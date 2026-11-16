import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  borrarDoc,
  borrarPago,
  cambiarEstadoPresupuesto,
  guardarDoc,
  marcarEnviado,
  registrarPago,
} from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import {
  cobroExistente,
  lineasDe,
  listarClientes,
  listarDocs,
  listarPrecios,
  obtenerDoc,
  obtenerTrabajo,
  pagosDe,
  trabajoDePresupuesto,
  type Doc,
  type Linea,
} from "@/lib/datos";
import {
  dinero,
  estadoCobro,
  estadoPresupuesto,
  fechaCorta,
  hoyISO,
  linkWhatsApp,
  MEDIOS_PAGO,
  numeroDoc,
  sumarDias,
} from "@/lib/formato";
import { EditorLineas } from "./editor-lineas";
import { BotonAccion, BotonWhatsApp, Formulario, SelectorCliente } from "./formulario";
import { Chip, Dato, Encabezado, Icono, TituloSeccion, Vacio } from "./ui";

type Tipo = "presupuesto" | "cobro";

const TEXTOS = {
  presupuesto: { ruta: "/presupuestos", plural: "Presupuestos", uno: "Presupuesto", nuevo: "Nuevo presupuesto" },
  cobro: { ruta: "/cobros", plural: "Cobros", uno: "Cobro", nuevo: "Nuevo cobro" },
} as const;

export function estadoDoc(d: Doc, hoy: string) {
  return d.tipo === "cobro" ? estadoCobro(d, hoy) : estadoPresupuesto(d, hoy);
}

/* ───────────── Lista ───────────── */

export function FilaDoc({ d, hoy, mostrarCliente = true }: { d: Doc; hoy: string; mostrarCliente?: boolean }) {
  const saldo = d.total - d.pagado;
  return (
    <li>
      <Link href={`${TEXTOS[d.tipo].ruta}/${d.id}`} className="fila">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{d.titulo}</p>
          <p className="truncate text-sm text-suave">
            {mostrarCliente ? d.cliente_nombre : `${TEXTOS[d.tipo].uno} N° ${numeroDoc(d.numero)}`} · {fechaCorta(d.fecha)}
          </p>
          <div className="mt-1.5"><Chip estado={estadoDoc(d, hoy)} /></div>
        </div>
        <div className="text-right">
          <p className="font-bold whitespace-nowrap">{dinero(d.total, d.moneda)}</p>
          {d.tipo === "cobro" && d.pagado > 0 && saldo > 0.005 && (
            <p className="text-sm whitespace-nowrap text-suave">Falta {dinero(saldo, d.moneda)}</p>
          )}
        </div>
        <Icono n="derecha" className="size-5 text-slate-400" />
      </Link>
    </li>
  );
}

export async function ListaDocs({ tipo }: { tipo: Tipo }) {
  const { negocio } = await requerirSesion();
  const hoy = hoyISO();
  const tx = TEXTOS[tipo];
  let docs = await listarDocs(negocio.id, tipo);

  // En cobros, primero lo que falta cobrar.
  if (tipo === "cobro") {
    const falta = (d: Doc) => (d.total - d.pagado > 0.005 ? 0 : 1);
    docs = [...docs].sort((a, b) => falta(a) - falta(b));
  }
  const deben = docs.filter((d) => d.moneda === "ARS").reduce((s, d) => s + Math.max(d.total - d.pagado, 0), 0);

  return (
    <>
      <Encabezado titulo={tx.plural}>
        {docs.length > 0 && (
          <Link href={`${tx.ruta}/nuevo`} className="btn btn-primario w-full sm:w-auto">
            <Icono n="mas" /> {tx.nuevo}
          </Link>
        )}
      </Encabezado>

      {tipo === "cobro" && deben > 0 && (
        <div className="mb-4 rounded-2xl bg-marca-900 p-4 text-white">
          <p className="text-marca-100">Te deben en total</p>
          <p className="text-3xl font-bold tracking-tight">{dinero(deben)}</p>
        </div>
      )}

      {docs.length === 0 ? (
        tipo === "presupuesto" ? (
          <Vacio
            icono="presupuesto"
            titulo="Todavía no hiciste presupuestos"
            texto="Armá un presupuesto en un minuto y mandalo por WhatsApp. Tu cliente lo acepta desde su celular."
          >
            <Link href="/presupuestos/nuevo" className="btn btn-primario"><Icono n="mas" /> Hacer mi primer presupuesto</Link>
          </Vacio>
        ) : (
          <Vacio
            icono="cobro"
            titulo="Todavía no tenés cobros"
            texto="Anotá acá lo que te tienen que pagar. Podés registrar señas y pagos en partes, y ver quién te debe."
          >
            <Link href="/cobros/nuevo" className="btn btn-primario"><Icono n="mas" /> Anotar un cobro</Link>
          </Vacio>
        )
      ) : (
        <ul className="lista">
          {docs.map((d) => <FilaDoc key={d.id} d={d} hoy={hoy} />)}
        </ul>
      )}
    </>
  );
}

/* ───────────── Formulario (nuevo y editar) ───────────── */

export async function FormularioDoc({
  tipo,
  id,
  desde,
}: {
  tipo: Tipo;
  id?: string;
  /** Para arrancar con datos ya cargados: desde un cliente, un presupuesto o un trabajo. */
  desde?: { cliente?: string; presupuesto?: string; trabajo?: string };
}) {
  const { negocio } = await requerirSesion();
  const tx = TEXTOS[tipo];
  const hoy = hoyISO();
  const [clientes, precios] = await Promise.all([listarClientes(negocio.id), listarPrecios(negocio.id)]);

  let doc: Doc | null = null;
  let lineas: Linea[] = [];
  let clienteInicial = desde?.cliente;
  let tituloInicial = "";
  let trabajoId = "";
  let origenId = "";

  if (id) {
    doc = await obtenerDoc(negocio.id, id);
    if (!doc || doc.tipo !== tipo) notFound();
    lineas = await lineasDe(doc.id);
    clienteInicial = doc.cliente_id;
    tituloInicial = doc.titulo;
  } else {
    // Un cobro puede nacer de un trabajo terminado o de un presupuesto aceptado.
    let presupuestoId = desde?.presupuesto;
    if (desde?.trabajo) {
      const t = await obtenerTrabajo(negocio.id, desde.trabajo);
      if (t) {
        trabajoId = t.id;
        clienteInicial = t.cliente_id;
        tituloInicial = t.titulo;
        presupuestoId = t.presupuesto_id ?? undefined;
      }
    }
    if (presupuestoId) {
      const p = await obtenerDoc(negocio.id, presupuestoId);
      if (p && p.tipo === "presupuesto") {
        origenId = p.id;
        clienteInicial = p.cliente_id;
        tituloInicial ||= p.titulo;
        lineas = await lineasDe(p.id);
        doc = { ...p, id: "", notas: "", vence: null };
      }
    }
  }

  const venceInicial = id
    ? (doc?.vence ?? "")
    : sumarDias(hoy, negocio.validez_dias || 7);
  const esRI = negocio.condicion_iva === "ri";

  return (
    <>
      <Encabezado
        titulo={id ? `Editar ${tx.uno.toLowerCase()}` : tx.nuevo}
        volver={{ href: id ? `${tx.ruta}/${id}` : tx.ruta, texto: "Volver" }}
      />
      <Formulario
        accion={guardarDoc}
        boton={id ? "Guardar cambios" : `Guardar ${tx.uno.toLowerCase()}`}
        cancelar={id ? `${tx.ruta}/${id}` : tx.ruta}
      >
        <input type="hidden" name="tipo" value={tipo} />
        {id && <input type="hidden" name="id" value={id} />}
        {trabajoId && <input type="hidden" name="trabajo_id" value={trabajoId} />}
        {origenId && <input type="hidden" name="origen_id" value={origenId} />}

        <div className="tarjeta space-y-5">
          <SelectorCliente clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))} inicial={clienteInicial} />
          <div>
            <label htmlFor="titulo" className="etiqueta">¿Qué trabajo es?</label>
            <input
              id="titulo"
              name="titulo"
              required
              maxLength={140}
              className="campo"
              defaultValue={tituloInicial}
              placeholder="Ej: Cambio de termotanque"
            />
          </div>
        </div>

        <EditorLineas
          inicial={lineas.map((l) => ({ descripcion: l.descripcion, cantidad: l.cantidad, precio: l.precio }))}
          precios={precios.map((p) => ({ nombre: p.nombre, precio: p.precio }))}
          monedaInicial={doc?.moneda ?? "ARS"}
          descuentoInicial={doc?.descuento ?? 0}
          ofrecerIva={esRI || (doc?.iva_pct ?? 0) > 0}
          ivaInicial={doc ? doc.iva_pct > 0 : esRI}
        />

        <div className="tarjeta space-y-5">
          <div>
            <label htmlFor="vence" className="etiqueta">
              {tipo === "presupuesto" ? "¿Hasta cuándo vale este precio?" : "¿Hasta cuándo puede pagar?"}
            </label>
            <input id="vence" name="vence" type="date" className="campo" defaultValue={venceInicial} min={id ? undefined : hoy} />
            {tipo === "presupuesto" && (
              <p className="ayuda">Con los precios cambiando seguido, conviene poner pocos días.</p>
            )}
          </div>
          <div>
            <label htmlFor="notas" className="etiqueta">
              Aclaraciones para el cliente <span className="opcional">(opcional)</span>
            </label>
            <textarea
              id="notas"
              name="notas"
              rows={3}
              maxLength={1000}
              className="campo"
              defaultValue={doc?.notas ?? ""}
              placeholder={tipo === "presupuesto" ? "Ej: Incluye materiales. Se pide una seña del 50%." : "Ej: Gracias por confiar en nosotros."}
            />
          </div>
        </div>
      </Formulario>
    </>
  );
}

/* ───────────── Detalle ───────────── */

export function TablaLineas({ doc, lineas }: { doc: Doc; lineas: Linea[] }) {
  const base = doc.subtotal - doc.descuento;
  const iva = doc.total - base;
  return (
    <div>
      <ul className="divide-y divide-slate-200">
        {lineas.map((l) => (
          <li key={l.id} className="flex items-start justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="font-medium break-words">{l.descripcion}</p>
              {l.cantidad !== 1 && (
                <p className="text-sm text-suave">
                  {new Intl.NumberFormat("es-AR").format(l.cantidad)} × {dinero(l.precio, doc.moneda)}
                </p>
              )}
            </div>
            <p className="font-semibold whitespace-nowrap">{dinero(l.cantidad * l.precio, doc.moneda)}</p>
          </li>
        ))}
      </ul>
      <dl className="space-y-1 border-t-2 border-slate-300 pt-3">
        {(doc.descuento > 0 || iva > 0.005) && (
          <div className="flex justify-between text-suave"><dt>Subtotal</dt><dd>{dinero(doc.subtotal, doc.moneda)}</dd></div>
        )}
        {doc.descuento > 0 && (
          <div className="flex justify-between text-suave"><dt>Descuento</dt><dd>– {dinero(doc.descuento, doc.moneda)}</dd></div>
        )}
        {iva > 0.005 && (
          <div className="flex justify-between text-suave"><dt>IVA {doc.iva_pct}%</dt><dd>{dinero(iva, doc.moneda)}</dd></div>
        )}
        <div className="flex items-baseline justify-between text-xl font-bold">
          <dt>Total</dt>
          <dd>{dinero(doc.total, doc.moneda)}</dd>
        </div>
      </dl>
    </div>
  );
}

export async function DetalleDoc({ tipo, id }: { tipo: Tipo; id: string }) {
  const { negocio } = await requerirSesion();
  const doc = await obtenerDoc(negocio.id, id);
  if (!doc || doc.tipo !== tipo) notFound();

  const tx = TEXTOS[tipo];
  const hoy = hoyISO();
  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const urlPublica = `${origen}/p/${doc.token}`;
  const [lineas, pagos] = await Promise.all([lineasDe(doc.id), tipo === "cobro" ? pagosDe(doc.id) : []]);
  const estado = estadoDoc(doc, hoy);
  const saldo = Math.max(doc.total - doc.pagado, 0);
  const cobrado = tipo === "cobro" && saldo <= 0.005;
  const primerNombre = doc.cliente_nombre.split(" ")[0];

  const mensaje =
    tipo === "presupuesto"
      ? `Hola ${primerNombre}! Te paso el presupuesto de ${negocio.nombre} por "${doc.titulo}".\nTotal: ${dinero(doc.total, doc.moneda)}${doc.vence ? `\nVálido hasta el ${fechaCorta(doc.vence)}` : ""}\n\nLo podés ver y aceptar acá:\n${urlPublica}`
      : `Hola ${primerNombre}! Te paso el detalle de ${negocio.nombre} por "${doc.titulo}".\n${doc.pagado > 0 ? "Falta pagar" : "Total"}: ${dinero(saldo, doc.moneda)}\n\nAcá están los datos para pagar:\n${urlPublica}`;
  const wa = linkWhatsApp(doc.cliente_telefono, mensaje);

  // Siguiente paso del circuito: presupuesto aceptado → trabajo → cobro.
  const [trabajoHecho, cobroHecho] =
    tipo === "presupuesto" && doc.estado === "aprobado"
      ? await Promise.all([trabajoDePresupuesto(negocio.id, doc.id), cobroExistente(negocio.id, "origen_id", doc.id)])
      : [null, null];

  const abierto = tipo === "presupuesto" && (doc.estado === "borrador" || doc.estado === "enviado");

  return (
    <>
      <Encabezado
        titulo={`${tx.uno} N° ${numeroDoc(doc.numero)}`}
        volver={{ href: tx.ruta, texto: tx.plural }}
      >
        <Chip estado={estado} />
      </Encabezado>

      <div className="tarjeta">
        <p className="text-xl font-bold">{doc.titulo}</p>
        <p className="mt-1">
          Para{" "}
          <Link href={`/clientes/${doc.cliente_id}`} className="font-semibold text-marca-700 underline underline-offset-2">
            {doc.cliente_nombre}
          </Link>
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-4">
          <Dato nombre="Fecha">{fechaCorta(doc.fecha)}</Dato>
          {doc.vence && <Dato nombre={tipo === "presupuesto" ? "Vale hasta" : "Vence"}>{fechaCorta(doc.vence)}</Dato>}
        </dl>
        {tipo === "cobro" && (
          <div className={`mt-4 rounded-xl p-4 ${cobrado ? "bg-emerald-50 text-emerald-900" : "bg-marca-50 text-marca-900"}`}>
            <p className="font-medium">{cobrado ? "Ya cobraste todo" : doc.pagado > 0 ? "Falta cobrar" : "Para cobrar"}</p>
            <p className="text-3xl font-bold tracking-tight">{dinero(cobrado ? doc.total : saldo, doc.moneda)}</p>
            {!cobrado && doc.pagado > 0 && (
              <p className="mt-1 text-sm">Ya te pagaron {dinero(doc.pagado, doc.moneda)} de {dinero(doc.total, doc.moneda)}</p>
            )}
          </div>
        )}
      </div>

      {/* Acción principal: una sola, bien visible. */}
      <div className="mt-4 flex flex-col gap-3">
        {abierto && (
          <>
            <BotonWhatsApp href={wa} alEnviar={marcarEnviado.bind(null, doc.id)}>
              <Icono n="whatsapp" /> {doc.estado === "enviado" ? "Volver a enviar por WhatsApp" : "Enviar por WhatsApp"}
            </BotonWhatsApp>
            <form action={cambiarEstadoPresupuesto}>
              <input type="hidden" name="id" value={doc.id} />
              <input type="hidden" name="estado" value="aprobado" />
              <BotonAccion className="btn btn-secundario w-full">
                <Icono n="check" /> El cliente me dijo que sí
              </BotonAccion>
            </form>
          </>
        )}

        {tipo === "presupuesto" && doc.estado === "aprobado" && (
          <>
            {trabajoHecho ? (
              <Link href={`/trabajos/${trabajoHecho.id}`} className="btn btn-secundario">
                <Icono n="agenda" /> Ver el trabajo agendado
              </Link>
            ) : (
              <Link href={`/trabajos/nuevo?presupuesto=${doc.id}`} className="btn btn-primario">
                <Icono n="agenda" /> Agendar el trabajo
              </Link>
            )}
            {cobroHecho ? (
              <Link href={`/cobros/${cobroHecho.id}`} className="btn btn-secundario">
                <Icono n="cobro" /> Ver el cobro
              </Link>
            ) : (
              <Link href={`/cobros/nuevo?presupuesto=${doc.id}`} className="btn btn-secundario">
                <Icono n="cobro" /> Cobrar o anotar una seña
              </Link>
            )}
          </>
        )}

        {tipo === "cobro" && !cobrado && (
          <>
            <div className="tarjeta border-2 border-marca-200">
              <h2 className="mb-3 text-lg font-bold">Anotar un pago</h2>
              <Formulario accion={registrarPago} boton="Anotar pago" className="space-y-4" key={doc.pagado}>
                <input type="hidden" name="doc_id" value={doc.id} />
                <div>
                  <label htmlFor="monto" className="etiqueta">¿Cuánto te pagó?</label>
                  <input
                    id="monto"
                    name="monto"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    step="any"
                    required
                    className="campo"
                    defaultValue={Math.round(saldo * 100) / 100}
                  />
                  <p className="ayuda">Si es una seña o un pago en partes, cambiá el monto.</p>
                </div>
                <div>
                  <label htmlFor="medio" className="etiqueta">¿Cómo te pagó?</label>
                  <select id="medio" name="medio" className="campo" defaultValue="transferencia">
                    {Object.entries(MEDIOS_PAGO).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
                  </select>
                </div>
                <input type="hidden" name="fecha" value={hoy} />
              </Formulario>
            </div>
            <BotonWhatsApp href={wa}>
              <Icono n="whatsapp" /> {doc.pagado > 0 || (doc.vence && doc.vence < hoy) ? "Recordarle el pago por WhatsApp" : "Enviar por WhatsApp"}
            </BotonWhatsApp>
          </>
        )}
      </div>

      {pagos.length > 0 && (
        <>
          <TituloSeccion>Pagos recibidos</TituloSeccion>
          <ul className="lista">
            {pagos.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-4 py-2">
                <div className="flex-1">
                  <p className="font-semibold">{dinero(p.monto, doc.moneda)}</p>
                  <p className="text-sm text-suave">{MEDIOS_PAGO[p.medio] ?? p.medio} · {fechaCorta(p.fecha)}</p>
                </div>
                <form action={borrarPago}>
                  <input type="hidden" name="id" value={p.id} />
                  <BotonAccion className="btn btn-chico text-red-700 hover:bg-red-50" confirmar="¿Seguro que querés borrar este pago?">
                    Borrar
                  </BotonAccion>
                </form>
              </li>
            ))}
          </ul>
        </>
      )}

      <TituloSeccion>Detalle</TituloSeccion>
      <div className="tarjeta">
        <TablaLineas doc={doc} lineas={lineas} />
        {doc.notas && <p className="mt-4 rounded-xl bg-slate-50 p-3 whitespace-pre-line text-suave">{doc.notas}</p>}
      </div>

      <TituloSeccion>Otras acciones</TituloSeccion>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/p/${doc.token}`} target="_blank" className="btn btn-secundario">
          <Icono n="ojo" /> Ver como lo ve el cliente
        </Link>
        <Link href={`${tx.ruta}/${doc.id}/editar`} className="btn btn-secundario">
          <Icono n="editar" /> Editar
        </Link>
        {tipo === "presupuesto" && doc.estado !== "borrador" && (
          <form action={cambiarEstadoPresupuesto}>
            <input type="hidden" name="id" value={doc.id} />
            <input type="hidden" name="estado" value={doc.estado === "enviado" ? "rechazado" : "enviado"} />
            <BotonAccion className="btn btn-secundario w-full">
              {doc.estado === "enviado" ? "El cliente dijo que no" : "Volver a “Esperando respuesta”"}
            </BotonAccion>
          </form>
        )}
        <form action={borrarDoc}>
          <input type="hidden" name="id" value={doc.id} />
          <BotonAccion
            className="btn btn-peligro w-full"
            confirmar={`¿Seguro que querés borrar este ${tx.uno.toLowerCase()}? No se puede deshacer.`}
          >
            <Icono n="borrar" /> Borrar
          </BotonAccion>
        </form>
      </div>
    </>
  );
}
