import Link from "next/link";
import { notFound } from "next/navigation";
import { guardarTrabajo } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { listarClientes, obtenerDoc, obtenerTrabajo, type Trabajo } from "@/lib/datos";
import { esFechaISO, estadoTrabajo, fechaAmigable, hoyISO } from "@/lib/formato";
import { Formulario, SelectorCliente } from "./formulario";
import { Chip, Encabezado, Icono } from "./ui";

export function FilaTrabajo({ t, hoy, conFecha = false }: { t: Trabajo; hoy: string; conFecha?: boolean }) {
  return (
    <li>
      <Link href={`/trabajos/${t.id}`} className="fila">
        <div className="w-14 shrink-0 text-center">
          {t.hora ? (
            <p className="text-lg leading-tight font-bold">{t.hora}</p>
          ) : (
            <p className="text-sm leading-tight text-suave">Sin hora</p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{t.titulo}</p>
          <p className="truncate text-sm text-suave">
            {conFecha && t.fecha ? `${fechaAmigable(t.fecha, hoy)} · ` : ""}
            {t.cliente_nombre}
          </p>
          {t.direccion && <p className="truncate text-sm text-suave">{t.direccion}</p>}
          {t.estado !== "pendiente" && <div className="mt-1.5"><Chip estado={estadoTrabajo(t.estado)} /></div>}
        </div>
        <Icono n="derecha" className="size-5 text-slate-400" />
      </Link>
    </li>
  );
}

export async function FormularioTrabajo({
  id,
  desde,
}: {
  id?: string;
  desde?: { cliente?: string; presupuesto?: string; dia?: string };
}) {
  const { negocio } = await requerirSesion();
  const hoy = hoyISO();
  const clientes = await listarClientes(negocio.id);

  let t: Trabajo | null = null;
  let clienteInicial = desde?.cliente;
  let tituloInicial = "";
  let presupuestoId = "";

  if (id) {
    t = await obtenerTrabajo(negocio.id, id);
    if (!t) notFound();
    clienteInicial = t.cliente_id;
    tituloInicial = t.titulo;
  } else if (desde?.presupuesto) {
    const p = await obtenerDoc(negocio.id, desde.presupuesto);
    if (p && p.tipo === "presupuesto") {
      presupuestoId = p.id;
      clienteInicial = p.cliente_id;
      tituloInicial = p.titulo;
    }
  }
  const fechaInicial = id ? (t?.fecha ?? "") : esFechaISO(desde?.dia) ? desde.dia : hoy;
  const volver = id ? `/trabajos/${id}` : "/agenda";

  return (
    <>
      <Encabezado titulo={id ? "Editar trabajo" : "Agendar un trabajo"} volver={{ href: volver, texto: "Volver" }} />
      <Formulario accion={guardarTrabajo} boton={id ? "Guardar cambios" : "Agendar trabajo"} cancelar={volver}>
        {id && <input type="hidden" name="id" value={id} />}
        {presupuestoId && <input type="hidden" name="presupuesto_id" value={presupuestoId} />}

        <div className="tarjeta space-y-5">
          <SelectorCliente clientes={clientes.map((c) => ({ id: c.id, nombre: c.nombre }))} inicial={clienteInicial} />
          <div>
            <label htmlFor="titulo" className="etiqueta">¿Qué trabajo es?</label>
            <input id="titulo" name="titulo" required maxLength={140} className="campo" defaultValue={tituloInicial} placeholder="Ej: Destapación de cocina" />
          </div>
        </div>

        <div className="tarjeta space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="fecha" className="etiqueta">¿Qué día?</label>
              <input id="fecha" name="fecha" type="date" className="campo px-3" defaultValue={fechaInicial} />
            </div>
            <div>
              <label htmlFor="hora" className="etiqueta">¿A qué hora?</label>
              <input id="hora" name="hora" type="time" step={900} className="campo px-3" defaultValue={t?.hora ?? ""} />
            </div>
          </div>
          <p className="ayuda -mt-2">Si todavía no sabés cuándo, dejá el día vacío y lo agendás después.</p>
          <div>
            <label htmlFor="direccion" className="etiqueta">
              ¿Dónde es? <span className="opcional">(si lo dejás vacío, usamos la dirección del cliente)</span>
            </label>
            <input id="direccion" name="direccion" maxLength={160} className="campo" defaultValue={t?.direccion ?? ""} placeholder="Calle, número y localidad" />
          </div>
          <div>
            <label htmlFor="descripcion" className="etiqueta">
              Notas para vos <span className="opcional">(opcional)</span>
            </label>
            <textarea id="descripcion" name="descripcion" rows={3} maxLength={1000} className="campo" defaultValue={t?.descripcion ?? ""} placeholder="Ej: Tocar timbre 3B. Llevar escalera." />
          </div>
        </div>
      </Formulario>
    </>
  );
}
