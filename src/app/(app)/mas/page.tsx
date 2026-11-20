import type { Metadata } from "next";
import Link from "next/link";
import { ActivarAvisos } from "@/components/activar-avisos";
import { BotonAccion } from "@/components/formulario";
import { SelectorTema } from "@/components/selector-tema";
import { Encabezado, Icono, TituloSeccion, type NombreIcono } from "@/components/ui";
import { salir } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { clavesPush } from "@/lib/avisos";

export const metadata: Metadata = { title: "Más" };

const OPCIONES: { href: string; texto: string; detalle: string; icono: NombreIcono }[] = [
  { href: "/numeros", texto: "Cuánto gané", detalle: "Lo que cobraste este mes y cómo te pagaron", icono: "subir" },
  { href: "/precios", texto: "Lista de precios", detalle: "Tus servicios y materiales, y cómo actualizarlos", icono: "precios" },
  { href: "/negocio", texto: "Mi negocio", detalle: "Tus datos, tu alias para cobrar y tu CUIT", icono: "negocio" },
  { href: "/suscripcion", texto: "Suscripción", detalle: "Tu prueba gratis, tu plan y cómo darte de baja", icono: "cobro" },
  { href: "/ayuda", texto: "Ayuda", detalle: "Cómo usar Laburo, paso a paso", icono: "ayuda" },
];

export default async function Mas() {
  await requerirSesion();
  const claves = await clavesPush();
  return (
    <>
      <Encabezado titulo="Más opciones" />
      <ul className="lista">
        {OPCIONES.map((o) => (
          <li key={o.href}>
            <Link href={o.href} className="fila">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-100 text-marca-700">
                <Icono n={o.icono} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{o.texto}</span>
                <span className="block text-sm text-suave">{o.detalle}</span>
              </span>
              <Icono n="derecha" className="size-5 text-slate-400" />
            </Link>
          </li>
        ))}
      </ul>

      <TituloSeccion>Avisos en el celular</TituloSeccion>
      <div className="tarjeta">
        <ActivarAvisos clavePublica={claves.publica} variante="completo" />
      </div>

      <a href="/exportar" download className="btn btn-secundario mt-4 w-full">
        <Icono n="descargar" /> Descargar mis datos en Excel
      </a>

      <TituloSeccion>Apariencia</TituloSeccion>
      <div className="tarjeta">
        <SelectorTema />
        <p className="ayuda">“Automático” usa el mismo modo que tu celular. El oscuro cansa menos la vista de noche y gasta menos batería.</p>
      </div>

      <form action={salir} className="mt-6">
        <BotonAccion className="btn btn-secundario w-full">
          <Icono n="salir" /> Cerrar sesión
        </BotonAccion>
      </form>
    </>
  );
}
