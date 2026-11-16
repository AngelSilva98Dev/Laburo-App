"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { InStatement } from "@libsql/client";
import { cerrarSesion, cifrarClave, claveCorrecta, crearSesion, requerirSesion } from "./auth";
import { ejecutar, fila, lote, nuevoId } from "./db";
import { cargarDatosDeEjemplo } from "./demo";
import { calcularTotales, esFechaISO, hoyISO, MEDIOS_PAGO, CONDICIONES_IVA } from "./formato";

/** Lo que devuelve una acción cuando hay algo para avisarle a la persona. */
export type Resultado = { error?: string; ok?: string } | void;

const texto = (fd: FormData, campo: string, max = 500) =>
  String(fd.get(campo) ?? "")
    .trim()
    .slice(0, max);

/** Acepta "1500", "1.500,50" y "1500.50". */
function numero(valor: unknown) {
  let s = String(valor ?? "").trim().replace(/[^\d.,-]/g, "");
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

function actualizar() {
  revalidatePath("/", "layout");
}

/* ───────────── Cuenta ───────────── */

export async function registrarse(fd: FormData): Promise<Resultado> {
  const nombre = texto(fd, "nombre", 80);
  const negocio = texto(fd, "negocio", 80);
  const email = texto(fd, "email", 120).toLowerCase();
  const clave = String(fd.get("clave") ?? "");

  if (!nombre || !negocio) return { error: "Completá tu nombre y el nombre de tu negocio." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Revisá el email: parece que le falta algo." };
  if (clave.length < 8) return { error: "La contraseña tiene que tener al menos 8 letras o números." };
  if (await fila("SELECT id FROM usuarios WHERE email = ?", [email]))
    return { error: "Ya hay una cuenta con ese email. Probá ingresar." };

  const negocioId = nuevoId();
  const usuarioId = nuevoId();
  await lote([
    { sql: "INSERT INTO negocios (id, nombre) VALUES (?, ?)", args: [negocioId, negocio] },
    {
      sql: "INSERT INTO usuarios (id, negocio_id, email, nombre, clave) VALUES (?, ?, ?, ?, ?)",
      args: [usuarioId, negocioId, email, nombre, cifrarClave(clave)],
    },
  ]);
  await crearSesion(usuarioId);
  redirect("/inicio");
}

export async function ingresar(fd: FormData): Promise<Resultado> {
  const email = texto(fd, "email", 120).toLowerCase();
  const clave = String(fd.get("clave") ?? "");
  const u = await fila<{ id: string; clave: string }>("SELECT id, clave FROM usuarios WHERE email = ?", [email]);
  if (!u || !claveCorrecta(clave, u.clave)) return { error: "El email o la contraseña no coinciden. Probá de nuevo." };
  await crearSesion(u.id);
  redirect("/inicio");
}

export async function salir() {
  await cerrarSesion();
  redirect("/");
}

/** Crea una cuenta de prueba con datos de ejemplo, para mirar sin compromiso. */
export async function entrarDemo() {
  const negocioId = nuevoId();
  const usuarioId = nuevoId();
  await lote([
    {
      sql: `INSERT INTO negocios (id, nombre, rubro, telefono, direccion, cuit, alias, validez_dias)
            VALUES (?, 'Instalaciones Rivera', 'Plomería y gas', '11 5555 0199', 'Av. Rivadavia 6800, CABA', '20-12345678-9', 'rivera.instalaciones', 7)`,
      args: [negocioId],
    },
    {
      sql: "INSERT INTO usuarios (id, negocio_id, email, nombre, clave) VALUES (?, ?, ?, 'Martín', ?)",
      args: [usuarioId, negocioId, `demo-${usuarioId}@ejemplo.laburo`, cifrarClave(randomBytes(16).toString("hex"))],
    },
  ]);
  await cargarDatosDeEjemplo(negocioId);
  await crearSesion(usuarioId);
  redirect("/inicio");
}

/* ───────────── Mi negocio ───────────── */

export async function guardarNegocio(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const nombre = texto(fd, "nombre", 80);
  if (!nombre) return { error: "Escribí el nombre de tu negocio." };
  const condicion = texto(fd, "condicion_iva");
  const link = texto(fd, "link_pago", 300);
  if (link && !/^https:\/\//i.test(link)) return { error: "El link de pago tiene que empezar con https://" };
  const validez = Math.min(Math.max(Math.round(numero(fd.get("validez_dias"))) || 7, 1), 90);
  await ejecutar(
    `UPDATE negocios SET nombre = ?, rubro = ?, telefono = ?, direccion = ?, cuit = ?, condicion_iva = ?,
       alias = ?, link_pago = ?, validez_dias = ?, nota_pie = ? WHERE id = ?`,
    [
      nombre,
      texto(fd, "rubro", 80),
      texto(fd, "telefono", 40),
      texto(fd, "direccion", 160),
      texto(fd, "cuit", 20),
      condicion in CONDICIONES_IVA ? condicion : "monotributo",
      texto(fd, "alias", 60),
      link,
      validez,
      texto(fd, "nota_pie", 400),
      negocio.id,
    ],
  );
  actualizar();
  return { ok: "Listo, guardamos los datos de tu negocio." };
}

/* ───────────── Clientes ───────────── */

function datosCliente(fd: FormData, prefijo = "") {
  return [
    texto(fd, `${prefijo}nombre`, 100),
    texto(fd, `${prefijo}telefono`, 40),
    texto(fd, `${prefijo}email`, 120),
    texto(fd, `${prefijo}direccion`, 160),
    texto(fd, `${prefijo}documento`, 20),
    texto(fd, `${prefijo}notas`, 1000),
  ];
}

export async function guardarCliente(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const id = texto(fd, "id");
  const d = datosCliente(fd);
  if (!d[0]) return { error: "Escribí el nombre del cliente." };

  let destino = id;
  if (id) {
    await ejecutar(
      `UPDATE clientes SET nombre = ?, telefono = ?, email = ?, direccion = ?, documento = ?, notas = ?
       WHERE id = ? AND negocio_id = ?`,
      [...d, id, negocio.id],
    );
  } else {
    destino = nuevoId();
    await ejecutar(
      `INSERT INTO clientes (id, negocio_id, nombre, telefono, email, direccion, documento, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [destino, negocio.id, ...d],
    );
  }
  actualizar();
  redirect(`/clientes/${destino}`);
}

export async function borrarCliente(fd: FormData) {
  const { negocio } = await requerirSesion();
  const id = texto(fd, "id");
  const usado = await fila(
    `SELECT 1 AS x FROM documentos WHERE cliente_id = ?1 AND negocio_id = ?2
     UNION SELECT 1 FROM trabajos WHERE cliente_id = ?1 AND negocio_id = ?2`,
    [id, negocio.id],
  );
  if (usado) redirect(`/clientes/${id}`);
  await ejecutar("DELETE FROM clientes WHERE id = ? AND negocio_id = ?", [id, negocio.id]);
  actualizar();
  redirect("/clientes");
}

/** En los formularios se puede elegir un cliente existente o cargar uno nuevo ahí mismo. */
async function resolverCliente(negocioId: string, fd: FormData): Promise<{ id?: string; error?: string }> {
  const elegido = texto(fd, "cliente_id");
  if (elegido && elegido !== "nuevo") {
    const c = await fila<{ id: string }>("SELECT id FROM clientes WHERE id = ? AND negocio_id = ?", [elegido, negocioId]);
    return c ? { id: c.id } : { error: "No encontramos ese cliente. Elegilo de nuevo." };
  }
  const nombre = texto(fd, "cliente_nombre", 100);
  if (!nombre) return { error: "Elegí un cliente o escribí el nombre del cliente nuevo." };
  const id = nuevoId();
  await ejecutar(
    "INSERT INTO clientes (id, negocio_id, nombre, telefono, direccion) VALUES (?, ?, ?, ?, ?)",
    [id, negocioId, nombre, texto(fd, "cliente_telefono", 40), texto(fd, "cliente_direccion", 160)],
  );
  return { id };
}

/* ───────────── Lista de precios ───────────── */

export async function guardarPrecio(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const id = texto(fd, "id");
  const nombre = texto(fd, "nombre", 120);
  const precio = numero(fd.get("precio"));
  if (!nombre) return { error: "Escribí qué servicio o material es." };
  if (precio < 0) return { error: "El precio no puede ser negativo." };
  if (id) {
    await ejecutar("UPDATE precios SET nombre = ?, precio = ? WHERE id = ? AND negocio_id = ?", [nombre, precio, id, negocio.id]);
  } else {
    await ejecutar("INSERT INTO precios (id, negocio_id, nombre, precio) VALUES (?, ?, ?, ?)", [nuevoId(), negocio.id, nombre, precio]);
  }
  actualizar();
  return { ok: id ? "Precio actualizado." : `Agregamos "${nombre}" a tu lista.` };
}

export async function borrarPrecio(fd: FormData) {
  const { negocio } = await requerirSesion();
  await ejecutar("DELETE FROM precios WHERE id = ? AND negocio_id = ?", [texto(fd, "id"), negocio.id]);
  actualizar();
}

/** Sube (o baja) todos los precios de la lista un porcentaje. Pensado para la inflación. */
export async function ajustarPrecios(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const pct = numero(fd.get("porcentaje"));
  if (!pct || pct <= -90 || pct > 500) return { error: "Escribí un porcentaje válido, por ejemplo 10." };
  const redondeo = [1, 10, 100, 1000].includes(numero(fd.get("redondeo"))) ? numero(fd.get("redondeo")) : 100;
  await ejecutar(
    "UPDATE precios SET precio = ROUND(precio * (1 + ? / 100.0) / ?) * ? WHERE negocio_id = ?",
    [pct, redondeo, redondeo, negocio.id],
  );
  actualizar();
  return { ok: `Listo: ${pct > 0 ? "aumentamos" : "bajamos"} todos tus precios un ${Math.abs(pct)}%.` };
}

/* ───────────── Presupuestos y cobros ───────────── */

const RUTA = { presupuesto: "/presupuestos", cobro: "/cobros" } as const;

export async function guardarDoc(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const tipo = texto(fd, "tipo") === "cobro" ? "cobro" : "presupuesto";
  const id = texto(fd, "id");
  const titulo = texto(fd, "titulo", 140);
  if (!titulo) return { error: "Contá en pocas palabras qué trabajo es." };

  let crudas: { descripcion?: unknown; cantidad?: unknown; precio?: unknown }[] = [];
  try {
    crudas = JSON.parse(String(fd.get("lineas") ?? "[]"));
  } catch {}
  const lineas = (Array.isArray(crudas) ? crudas : [])
    .map((l) => ({
      descripcion: String(l.descripcion ?? "").trim().slice(0, 200),
      cantidad: numero(l.cantidad) || 1,
      precio: numero(l.precio),
    }))
    .filter((l) => l.descripcion)
    .slice(0, 100);
  if (!lineas.length) return { error: "Agregá al menos un ítem con su descripción y su precio." };
  if (lineas.some((l) => l.precio < 0 || l.cantidad < 0)) return { error: "Las cantidades y los precios no pueden ser negativos." };

  const ivaPct = fd.get("iva") ? 21 : 0;
  const t = calcularTotales(lineas, numero(fd.get("descuento")), ivaPct);
  const vence = esFechaISO(texto(fd, "vence")) ? texto(fd, "vence") : null;
  const moneda = texto(fd, "moneda") === "USD" ? "USD" : "ARS";
  const notas = texto(fd, "notas", 1000);

  let docId = id;
  const sentencias: InStatement[] = [];

  if (id) {
    const existe = await fila("SELECT id FROM documentos WHERE id = ? AND negocio_id = ? AND tipo = ?", [id, negocio.id, tipo]);
    if (!existe) return { error: "No encontramos ese documento." };
    const cliente = await resolverCliente(negocio.id, fd);
    if (!cliente.id) return { error: cliente.error };
    sentencias.push(
      {
        sql: `UPDATE documentos SET cliente_id = ?, titulo = ?, vence = ?, notas = ?, descuento = ?, iva_pct = ?,
              subtotal = ?, total = ?, moneda = ? WHERE id = ?`,
        args: [cliente.id, titulo, vence, notas, t.descuento, ivaPct, t.subtotal, t.total, moneda, id],
      },
      { sql: "DELETE FROM lineas WHERE doc_id = ?", args: [id] },
    );
  } else {
    const cliente = await resolverCliente(negocio.id, fd);
    if (!cliente.id) return { error: cliente.error };
    docId = nuevoId();
    const sig = await fila<{ n: number }>(
      "SELECT COALESCE(MAX(numero), 0) + 1 AS n FROM documentos WHERE negocio_id = ? AND tipo = ?",
      [negocio.id, tipo],
    );
    sentencias.push({
      sql: `INSERT INTO documentos (id, negocio_id, tipo, numero, cliente_id, trabajo_id, origen_id, titulo, estado,
              fecha, vence, notas, descuento, iva_pct, subtotal, total, moneda, token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'borrador', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        docId, negocio.id, tipo, sig?.n ?? 1, cliente.id,
        texto(fd, "trabajo_id") || null, texto(fd, "origen_id") || null,
        titulo, hoyISO(), vence, notas, t.descuento, ivaPct, t.subtotal, t.total, moneda,
        randomBytes(16).toString("hex"),
      ],
    });
  }
  lineas.forEach((l, i) =>
    sentencias.push({
      sql: "INSERT INTO lineas (id, doc_id, descripcion, cantidad, precio, orden) VALUES (?, ?, ?, ?, ?, ?)",
      args: [nuevoId(), docId, l.descripcion, l.cantidad, l.precio, i],
    }),
  );
  await lote(sentencias);
  actualizar();
  redirect(`${RUTA[tipo]}/${docId}`);
}

export async function borrarDoc(fd: FormData) {
  const { negocio } = await requerirSesion();
  const id = texto(fd, "id");
  const doc = await fila<{ tipo: "presupuesto" | "cobro" }>("SELECT tipo FROM documentos WHERE id = ? AND negocio_id = ?", [id, negocio.id]);
  if (!doc) redirect("/inicio");
  await lote([
    { sql: "DELETE FROM pagos WHERE doc_id = ?", args: [id] },
    { sql: "DELETE FROM lineas WHERE doc_id = ?", args: [id] },
    { sql: "DELETE FROM documentos WHERE id = ?", args: [id] },
  ]);
  actualizar();
  redirect(RUTA[doc.tipo]);
}

/** Cambia el estado de un presupuesto: borrador, enviado, aprobado o rechazado. */
export async function cambiarEstadoPresupuesto(fd: FormData) {
  const { negocio } = await requerirSesion();
  const estado = texto(fd, "estado");
  if (!["borrador", "enviado", "aprobado", "rechazado"].includes(estado)) return;
  await ejecutar("UPDATE documentos SET estado = ? WHERE id = ? AND negocio_id = ? AND tipo = 'presupuesto'", [
    estado, texto(fd, "id"), negocio.id,
  ]);
  actualizar();
}

/** Al tocar "Enviar por WhatsApp" el presupuesto pasa a "Esperando respuesta". */
export async function marcarEnviado(id: string) {
  const { negocio } = await requerirSesion();
  await ejecutar(
    "UPDATE documentos SET estado = 'enviado' WHERE id = ? AND negocio_id = ? AND tipo = 'presupuesto' AND estado = 'borrador'",
    [id, negocio.id],
  );
  actualizar();
}

/** El cliente acepta o rechaza desde el link que recibió (no necesita cuenta). */
export async function responderPresupuesto(fd: FormData) {
  const token = texto(fd, "token", 64);
  const respuesta = texto(fd, "respuesta") === "aprobado" ? "aprobado" : "rechazado";
  await ejecutar(
    "UPDATE documentos SET estado = ? WHERE token = ? AND tipo = 'presupuesto' AND estado IN ('borrador', 'enviado')",
    [respuesta, token],
  );
  actualizar();
}

/* ───────────── Pagos ───────────── */

export async function registrarPago(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const docId = texto(fd, "doc_id");
  const monto = numero(fd.get("monto"));
  const medio = texto(fd, "medio");
  const fecha = esFechaISO(texto(fd, "fecha")) ? texto(fd, "fecha") : hoyISO();
  const doc = await fila<{ total: number; pagado: number }>(
    `SELECT total, COALESCE((SELECT SUM(monto) FROM pagos WHERE doc_id = documentos.id), 0) AS pagado
     FROM documentos WHERE id = ? AND negocio_id = ? AND tipo = 'cobro'`,
    [docId, negocio.id],
  );
  if (!doc) return { error: "No encontramos ese cobro." };
  if (monto <= 0) return { error: "Escribí cuánto te pagaron." };
  if (monto > doc.total - doc.pagado + 0.005) return { error: "Ese monto es más de lo que falta cobrar. Revisalo." };
  await ejecutar("INSERT INTO pagos (id, negocio_id, doc_id, monto, medio, fecha) VALUES (?, ?, ?, ?, ?, ?)", [
    nuevoId(), negocio.id, docId, monto, medio in MEDIOS_PAGO ? medio : "efectivo", fecha,
  ]);
  actualizar();
  return { ok: "Pago anotado." };
}

export async function borrarPago(fd: FormData) {
  const { negocio } = await requerirSesion();
  await ejecutar("DELETE FROM pagos WHERE id = ? AND negocio_id = ?", [texto(fd, "id"), negocio.id]);
  actualizar();
}

/* ───────────── Trabajos ───────────── */

export async function guardarTrabajo(fd: FormData): Promise<Resultado> {
  const { negocio } = await requerirSesion();
  const id = texto(fd, "id");
  const titulo = texto(fd, "titulo", 140);
  if (!titulo) return { error: "Contá en pocas palabras qué trabajo es." };
  const fecha = esFechaISO(texto(fd, "fecha")) ? texto(fd, "fecha") : null;
  const hora = /^\d{2}:\d{2}$/.test(texto(fd, "hora")) ? texto(fd, "hora") : "";

  const cliente = await resolverCliente(negocio.id, fd);
  if (!cliente.id) return { error: cliente.error };

  let direccion = texto(fd, "direccion", 160);
  if (!direccion) {
    const c = await fila<{ direccion: string }>("SELECT direccion FROM clientes WHERE id = ?", [cliente.id]);
    direccion = c?.direccion ?? "";
  }
  const descripcion = texto(fd, "descripcion", 1000);

  let destino = id;
  if (id) {
    await ejecutar(
      `UPDATE trabajos SET cliente_id = ?, titulo = ?, descripcion = ?, direccion = ?, fecha = ?, hora = ?
       WHERE id = ? AND negocio_id = ?`,
      [cliente.id, titulo, descripcion, direccion, fecha, hora, id, negocio.id],
    );
  } else {
    destino = nuevoId();
    await ejecutar(
      `INSERT INTO trabajos (id, negocio_id, cliente_id, presupuesto_id, titulo, descripcion, direccion, fecha, hora)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [destino, negocio.id, cliente.id, texto(fd, "presupuesto_id") || null, titulo, descripcion, direccion, fecha, hora],
    );
  }
  actualizar();
  redirect(`/trabajos/${destino}`);
}

export async function cambiarEstadoTrabajo(fd: FormData) {
  const { negocio } = await requerirSesion();
  const estado = texto(fd, "estado");
  if (!["pendiente", "en_curso", "terminado", "cancelado"].includes(estado)) return;
  await ejecutar("UPDATE trabajos SET estado = ? WHERE id = ? AND negocio_id = ?", [estado, texto(fd, "id"), negocio.id]);
  actualizar();
}

export async function borrarTrabajo(fd: FormData) {
  const { negocio } = await requerirSesion();
  await ejecutar("DELETE FROM trabajos WHERE id = ? AND negocio_id = ?", [texto(fd, "id"), negocio.id]);
  actualizar();
  redirect("/agenda");
}
