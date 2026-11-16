import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FilaDoc } from "@/components/documentos";
import { BotonAccion } from "@/components/formulario";
import { FilaTrabajo } from "@/components/trabajos";
import { Dato, Encabezado, Icono, TituloSeccion } from "@/components/ui";
import { borrarCliente } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { listarDocs, obtenerCliente, trabajosDeCliente } from "@/lib/datos";
import { dinero, hoyISO, linkMapa, linkWhatsApp, telefonoWhatsApp } from "@/lib/formato";

export const metadata: Metadata = { title: "Cliente" };

export default async function DetalleCliente({ params }: { params: Promise<{ id: string }> }) {
  const { negocio } = await requerirSesion();
  const { id } = await params;
  const c = await obtenerCliente(negocio.id, id);
  if (!c) notFound();

  const hoy = hoyISO();
  const [presupuestos, cobros, trabajos] = await Promise.all([
    listarDocs(negocio.id, "presupuesto", id),
    listarDocs(negocio.id, "cobro", id),
    trabajosDeCliente(negocio.id, id),
  ]);
  const debe = cobros.filter((d) => d.moneda === "ARS").reduce((s, d) => s + Math.max(d.total - d.pagado, 0), 0);
  const sinHistorial = !presupuestos.length && !cobros.length && !trabajos.length;

  return (
    <>
      <Encabezado titulo={c.nombre} volver={{ href: "/clientes", texto: "Clientes" }} />

      {debe > 0 && (
        <p className="mb-4 rounded-2xl border-2 border-amber-200 bg-amber-50 px-4 py-3 font-semibold text-amber-950">
          Te debe {dinero(debe)}
        </p>
      )}

      {/* Contacto rápido */}
      {(c.telefono || c.direccion) && (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {c.telefono && (
            <>
              <a href={linkWhatsApp(c.telefono, "")} target="_blank" rel="noopener noreferrer" className="btn btn-wa flex-col gap-1 px-2 py-2 text-sm">
                <Icono n="whatsapp" /> WhatsApp
              </a>
              <a href={`tel:+${telefonoWhatsApp(c.telefono)}`} className="btn btn-secundario flex-col gap-1 px-2 py-2 text-sm">
                <Icono n="telefono" /> Llamar
              </a>
            </>
          )}
          {c.direccion && (
            <a href={linkMapa(c.direccion)} target="_blank" rel="noopener noreferrer" className="btn btn-secundario flex-col gap-1 px-2 py-2 text-sm">
              <Icono n="mapa" /> Cómo llegar
            </a>
          )}
        </div>
      )}

      <div className="tarjeta">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato nombre="Celular">{c.telefono || "Sin cargar"}</Dato>
          <Dato nombre="Dirección">{c.direccion || "Sin cargar"}</Dato>
          {c.email && <Dato nombre="Email">{c.email}</Dato>}
          {c.documento && <Dato nombre="CUIT, CUIL o DNI">{c.documento}</Dato>}
        </dl>
        {c.notas && <p className="mt-4 rounded-xl bg-slate-50 p-3 whitespace-pre-line">{c.notas}</p>}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Link href={`/presupuestos/nuevo?cliente=${c.id}`} className="btn btn-primario"><Icono n="presupuesto" /> Hacer presupuesto</Link>
        <Link href={`/trabajos/nuevo?cliente=${c.id}`} className="btn btn-secundario"><Icono n="agenda" /> Agendar trabajo</Link>
        <Link href={`/cobros/nuevo?cliente=${c.id}`} className="btn btn-secundario"><Icono n="cobro" /> Anotar cobro</Link>
      </div>

      {trabajos.length > 0 && (
        <>
          <TituloSeccion>Trabajos</TituloSeccion>
          <ul className="lista">{trabajos.map((t) => <FilaTrabajo key={t.id} t={t} hoy={hoy} conFecha />)}</ul>
        </>
      )}
      {presupuestos.length > 0 && (
        <>
          <TituloSeccion>Presupuestos</TituloSeccion>
          <ul className="lista">{presupuestos.map((d) => <FilaDoc key={d.id} d={d} hoy={hoy} mostrarCliente={false} />)}</ul>
        </>
      )}
      {cobros.length > 0 && (
        <>
          <TituloSeccion>Cobros</TituloSeccion>
          <ul className="lista">{cobros.map((d) => <FilaDoc key={d.id} d={d} hoy={hoy} mostrarCliente={false} />)}</ul>
        </>
      )}

      <TituloSeccion>Otras acciones</TituloSeccion>
      <div className="grid gap-3 sm:grid-cols-2">
        <Link href={`/clientes/${c.id}/editar`} className="btn btn-secundario"><Icono n="editar" /> Editar datos</Link>
        {sinHistorial && (
          <form action={borrarCliente}>
            <input type="hidden" name="id" value={c.id} />
            <BotonAccion className="btn btn-peligro w-full" confirmar={`¿Seguro que querés borrar a ${c.nombre}? No se puede deshacer.`}>
              <Icono n="borrar" /> Borrar cliente
            </BotonAccion>
          </form>
        )}
      </div>
    </>
  );
}
