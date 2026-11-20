import { randomBytes } from "node:crypto";
import type { InStatement } from "@libsql/client";
import { lote, nuevoId } from "./db";
import { calcularTotales, hoyISO, sumarDias } from "./formato";

/** Datos de ejemplo para la cuenta de prueba: un plomero/gasista de Buenos Aires. */
export async function cargarDatosDeEjemplo(negocioId: string) {
  const hoy = hoyISO();
  const s: InStatement[] = [];

  const clientes = [
    ["Laura Gómez", "11 5555 0101", "Av. Corrientes 4521, 3° B, CABA"],
    ["Carlos Benítez", "11 5555 0102", "Yerbal 2350, CABA"],
    ["Consorcio Pedro Goyena 1180", "11 5555 0103", "Pedro Goyena 1180, CABA"],
    ["Marta Suárez", "11 5555 0104", "Av. San Martín 1890, Caseros"],
    ["Panadería La Espiga", "11 5555 0105", "Av. Gaona 3102, CABA"],
  ].map(([nombre, telefono, direccion]) => {
    const id = nuevoId();
    s.push({
      sql: "INSERT INTO clientes (id, negocio_id, nombre, telefono, direccion) VALUES (?, ?, ?, ?, ?)",
      args: [id, negocioId, nombre, telefono, direccion],
    });
    return { id, direccion };
  });

  for (const [nombre, precio] of [
    ["Visita y diagnóstico", 25000],
    ["Destapación de cañería", 60000],
    ["Cambio de flexible", 18000],
    ["Instalación de termotanque", 140000],
    ["Reparación de pérdida de gas", 95000],
    ["Hora de mano de obra", 30000],
  ] as const) {
    s.push({
      sql: "INSERT INTO precios (id, negocio_id, nombre, precio) VALUES (?, ?, ?, ?)",
      args: [nuevoId(), negocioId, nombre, precio],
    });
  }

  let nPres = 0;
  let nCobro = 0;
  function doc(
    tipo: "presupuesto" | "cobro",
    cliente: number,
    titulo: string,
    estado: string,
    fecha: string,
    vence: string,
    lineas: [string, number, number][],
    extra: { trabajoId?: string; origenId?: string } = {},
  ) {
    const id = nuevoId();
    const t = calcularTotales(lineas.map(([, cantidad, precio]) => ({ cantidad, precio })), 0, 0);
    s.push({
      sql: `INSERT INTO documentos (id, negocio_id, tipo, numero, cliente_id, trabajo_id, origen_id, titulo, estado,
              fecha, vence, subtotal, total, token)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        id, negocioId, tipo, tipo === "presupuesto" ? ++nPres : ++nCobro, clientes[cliente].id,
        extra.trabajoId ?? null, extra.origenId ?? null, titulo, estado, fecha, vence, t.subtotal, t.total,
        randomBytes(16).toString("hex"),
      ],
    });
    lineas.forEach(([descripcion, cantidad, precio], i) =>
      s.push({
        sql: "INSERT INTO lineas (id, doc_id, descripcion, cantidad, precio, orden) VALUES (?, ?, ?, ?, ?, ?)",
        args: [nuevoId(), id, descripcion, cantidad, precio, i],
      }),
    );
    return { id, total: t.total };
  }

  function trabajo(cliente: number, titulo: string, fecha: string | null, hora: string, estado: string, presupuestoId?: string) {
    const id = nuevoId();
    s.push({
      sql: `INSERT INTO trabajos (id, negocio_id, cliente_id, presupuesto_id, titulo, direccion, fecha, hora, estado)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, negocioId, clientes[cliente].id, presupuestoId ?? null, titulo, clientes[cliente].direccion, fecha, hora, estado],
    });
    return id;
  }

  // Presupuestos
  const pTermotanque = doc("presupuesto", 0, "Cambio de termotanque", "aprobado", sumarDias(hoy, -3), sumarDias(hoy, 4), [
    ["Instalación de termotanque", 1, 140000],
    ["Cambio de flexible", 2, 18000],
  ]);
  doc("presupuesto", 2, "Reparación de bajada pluvial", "enviado", sumarDias(hoy, -1), sumarDias(hoy, 6), [
    ["Mano de obra (2 personas, 1 día)", 1, 320000],
    ["Caño PVC 110 y accesorios", 1, 85000],
  ]);
  doc("presupuesto", 4, "Revisión de instalación de gas del horno", "borrador", hoy, sumarDias(hoy, 7), [
    ["Visita y diagnóstico", 1, 25000],
    ["Reparación de pérdida de gas", 1, 95000],
  ]);

  // Trabajos
  trabajo(0, "Cambio de termotanque", hoy, "09:30", "pendiente", pTermotanque.id);
  trabajo(1, "Destapación de cocina", hoy, "15:00", "pendiente");
  trabajo(3, "Pérdida en el baño", sumarDias(hoy, 1), "10:00", "pendiente");
  const tHecho = trabajo(4, "Cambio de flexibles en la cocina", sumarDias(hoy, -2), "11:00", "terminado");
  const tViejo = trabajo(1, "Arreglo de canilla del patio", sumarDias(hoy, -12), "16:00", "terminado");

  // Cobros
  const cParcial = doc("cobro", 4, "Cambio de flexibles en la cocina", "borrador", sumarDias(hoy, -2), sumarDias(hoy, 5), [
    ["Cambio de flexible", 3, 18000],
    ["Visita y diagnóstico", 1, 25000],
  ], { trabajoId: tHecho });
  s.push({
    sql: "INSERT INTO pagos (id, negocio_id, doc_id, monto, medio, fecha) VALUES (?, ?, ?, ?, 'transferencia', ?)",
    args: [nuevoId(), negocioId, cParcial.id, 40000, sumarDias(hoy, -2)],
  });
  doc("cobro", 1, "Arreglo de canilla del patio", "borrador", sumarDias(hoy, -12), sumarDias(hoy, -5), [
    ["Hora de mano de obra", 2, 30000],
  ], { trabajoId: tViejo });

  // Trabajos ya cobrados en los últimos meses.
  const medios = ["transferencia", "efectivo", "mercadopago", "transferencia", "efectivo"];
  const historico: [number, number, string, number][] = [
    [0, 8, "Destapación de cañería", 60000],
    [2, 15, "Cambio de flexibles", 36000],
    [3, 35, "Reparación de pérdida de gas", 95000],
    [4, 41, "Destapación de cocina", 60000],
    [0, 52, "Instalación de termotanque", 140000],
    [1, 66, "Visita y diagnóstico", 25000],
    [2, 74, "Cambio de canilla", 45000],
    [3, 95, "Reparación de pérdida de gas", 95000],
    [4, 103, "Destapación de cañería", 55000],
    [1, 128, "Instalación de termotanque", 130000],
    [2, 141, "Arreglo de mochila del inodoro", 38000],
    [0, 160, "Destapación de cañería", 52000],
  ];
  historico.forEach(([cliente, dias, titulo, monto], i) => {
    const fecha = sumarDias(hoy, -dias);
    const c = doc("cobro", cliente, titulo, "borrador", fecha, sumarDias(fecha, 7), [[titulo, 1, monto]]);
    s.push({
      sql: "INSERT INTO pagos (id, negocio_id, doc_id, monto, medio, fecha) VALUES (?, ?, ?, ?, ?, ?)",
      args: [nuevoId(), negocioId, c.id, monto, medios[i % medios.length], fecha],
    });
  });

  await lote(s);
}
