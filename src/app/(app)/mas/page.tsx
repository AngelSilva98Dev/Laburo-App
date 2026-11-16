import type { Metadata } from "next";
import Link from "next/link";
import { BotonAccion } from "@/components/formulario";
import { Encabezado, Icono, type NombreIcono } from "@/components/ui";
import { salir } from "@/lib/acciones";

export const metadata: Metadata = { title: "Más" };

const OPCIONES: { href: string; texto: string; detalle: string; icono: NombreIcono }[] = [
  { href: "/precios", texto: "Lista de precios", detalle: "Tus servicios y materiales, y cómo actualizarlos", icono: "precios" },
  { href: "/negocio", texto: "Mi negocio", detalle: "Tus datos, tu alias para cobrar y tu CUIT", icono: "negocio" },
  { href: "/ayuda", texto: "Ayuda", detalle: "Cómo usar Laburo, paso a paso", icono: "ayuda" },
];

export default function Mas() {
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
      <form action={salir} className="mt-6">
        <BotonAccion className="btn btn-secundario w-full">
          <Icono n="salir" /> Cerrar sesión
        </BotonAccion>
      </form>
    </>
  );
}
