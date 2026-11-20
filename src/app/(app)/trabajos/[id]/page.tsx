import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FotosTrabajo } from "@/components/fotos";
import { BotonAccion, BotonWhatsApp } from "@/components/formulario";
import { Chip, Encabezado, Icono, TituloSeccion } from "@/components/ui";
import { borrarTrabajo, cambiarEstadoTrabajo } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { cobroExistente, obtenerTrabajo } from "@/lib/datos";
import { fotosDeTrabajo } from "@/lib/fotos";
import { acceso } from "@/lib/suscripcion";
import { estadoTrabajo, fechaAmigable, fechaLarga, hoyISO, linkMapa, linkWhatsApp, telefonoWhatsApp } from "@/lib/formato";

export const metadata: Metadata = { title: "Trabajo" };

function CambiarEstado({ id, estado, className, children }: { id: string; estado: string; className?: string; children: React.ReactNode }) {
  return (
    <form action={cambiarEstadoTrabajo}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="estado" value={estado} />
      <BotonAccion className={className ?? "btn btn-primario w-full"}>{children}</BotonAccion>
    </form>
  );
}

export default async function DetalleTrabajo({ params }: { params: Promise<{ id: string }> }) {
  const { negocio } = await requerirSesion();
  const { id } = await params;
  const t = await obtenerTrabajo(negocio.id, id);
  if (!t) notFound();

  const hoy = hoyISO();
  const [cobro, fotos] = await Promise.all([cobroExistente(negocio.id, "trabajo_id", t.id), fotosDeTrabajo(negocio.id, t.id)]);
  const nombre = t.cliente_nombre.split(" ")[0];
  const cuando = t.fecha
    ? `${t.fecha === hoy ? "hoy" : `el ${fechaLarga(t.fecha)}`}${t.hora ? ` a las ${t.hora}` : ""}`
    : "";
  const activo = t.estado === "pendiente" || t.estado === "en_curso";

  return (
    <>
      <Encabezado titulo={t.titulo} volver={{ href: t.fecha ? `/agenda?dia=${t.fecha}` : "/agenda", texto: "Agenda" }}>
        <Chip estado={estadoTrabajo(t.estado)} />
      </Encabezado>

      <div className="tarjeta space-y-4">
        <div className="flex items-start gap-3">
          <Icono n="reloj" className="mt-0.5 size-6 text-marca-600" />
          <div>
            {t.fecha ? (
              <>
                <p className="font-semibold first-letter:uppercase">{fechaAmigable(t.fecha, hoy)}{t.hora && ` a las ${t.hora}`}</p>
                {fechaAmigable(t.fecha, hoy) !== fechaLarga(t.fecha) && <p className="text-sm text-suave first-letter:uppercase">{fechaLarga(t.fecha)}</p>}
              </>
            ) : (
              <p className="font-semibold">Todavía sin fecha</p>
            )}
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Icono n="clientes" className="mt-0.5 size-6 text-marca-600" />
          <Link href={`/clientes/${t.cliente_id}`} className="font-semibold text-marca-700 underline underline-offset-2">
            {t.cliente_nombre}
          </Link>
        </div>
        {t.direccion && (
          <div className="flex items-start gap-3">
            <Icono n="mapa" className="mt-0.5 size-6 text-marca-600" />
            <p className="font-medium">{t.direccion}</p>
          </div>
        )}
        {t.descripcion && <p className="rounded-xl bg-slate-50 p-3 whitespace-pre-line">{t.descripcion}</p>}
      </div>

      {/* El siguiente paso, siempre uno solo y bien grande. */}
      <div className="mt-4 flex flex-col gap-3">
        {t.estado === "pendiente" && <CambiarEstado id={t.id} estado="en_curso">Empezar el trabajo</CambiarEstado>}
        {t.estado === "en_curso" && (
          <CambiarEstado id={t.id} estado="terminado"><Icono n="check" /> Terminé el trabajo</CambiarEstado>
        )}
        {t.estado === "terminado" &&
          (cobro ? (
            <Link href={`/cobros/${cobro.id}`} className="btn btn-primario"><Icono n="cobro" /> Ver el cobro</Link>
          ) : (
            <Link href={`/cobros/nuevo?trabajo=${t.id}`} className="btn btn-primario"><Icono n="cobro" /> Cobrar este trabajo</Link>
          ))}

        {activo && (
          <div className="grid grid-cols-2 gap-3">
            {t.direccion && (
              <a href={linkMapa(t.direccion)} target="_blank" rel="noopener noreferrer" className="btn btn-secundario">
                <Icono n="mapa" /> Cómo llegar
              </a>
            )}
            {t.cliente_telefono && (
              <a href={`tel:+${telefonoWhatsApp(t.cliente_telefono)}`} className="btn btn-secundario">
                <Icono n="telefono" /> Llamar
              </a>
            )}
          </div>
        )}
      </div>

      {activo && (
        <>
          <TituloSeccion>Avisarle a {nombre} por WhatsApp</TituloSeccion>
          <div className="flex flex-col gap-3">
            <BotonWhatsApp
              href={linkWhatsApp(t.cliente_telefono, `Hola ${nombre}! Soy de ${negocio.nombre}. Estoy saliendo para allá, en un rato llego.`)}
            >
              <Icono n="whatsapp" /> Estoy en camino
            </BotonWhatsApp>
            {t.fecha && (
              <BotonWhatsApp
                className="btn btn-secundario"
                href={linkWhatsApp(
                  t.cliente_telefono,
                  `Hola ${nombre}! Te escribo de ${negocio.nombre} para recordarte que ${cuando} vamos por "${t.titulo}". ¿Me confirmás que hay alguien para recibirnos?`,
                )}
              >
                <Icono n="whatsapp" /> Recordarle la visita
              </BotonWhatsApp>
            )}
          </div>
        </>
      )}

      <TituloSeccion>Fotos del trabajo</TituloSeccion>
      <FotosTrabajo trabajoId={t.id} fotos={fotos} puedeSubir={acceso(negocio).puedeEscribir} />

      <TituloSeccion>Otras acciones</TituloSeccion>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/trabajos/${t.id}/editar`} className="btn btn-secundario"><Icono n="editar" /> Editar o cambiar la fecha</Link>
        {t.presupuesto_id && (
          <Link href={`/presupuestos/${t.presupuesto_id}`} className="btn btn-secundario"><Icono n="presupuesto" /> Ver el presupuesto</Link>
        )}
        {activo && (
          <CambiarEstado id={t.id} estado="cancelado" className="btn btn-secundario w-full">Cancelar el trabajo</CambiarEstado>
        )}
        {!activo && (
          <CambiarEstado id={t.id} estado="pendiente" className="btn btn-secundario w-full">Volver a “Pendiente”</CambiarEstado>
        )}
        <form action={borrarTrabajo}>
          <input type="hidden" name="id" value={t.id} />
          <BotonAccion className="btn btn-peligro w-full" confirmar="¿Seguro que querés borrar este trabajo? No se puede deshacer.">
            <Icono n="borrar" /> Borrar
          </BotonAccion>
        </form>
      </div>
    </>
  );
}
