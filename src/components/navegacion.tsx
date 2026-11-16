"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icono, type NombreIcono } from "./ui";

type Item = { href: string; texto: string; corto?: string; icono: NombreIcono; tambien?: string[] };

/** Las 5 secciones principales: pocas opciones, siempre en el mismo lugar. */
const PRINCIPALES: Item[] = [
  { href: "/inicio", texto: "Inicio", icono: "inicio" },
  { href: "/agenda", texto: "Agenda", icono: "agenda", tambien: ["/trabajos"] },
  { href: "/clientes", texto: "Clientes", icono: "clientes" },
  { href: "/presupuestos", texto: "Presupuestos", corto: "Presup.", icono: "presupuesto" },
  { href: "/cobros", texto: "Cobros", icono: "cobro" },
];

const SECUNDARIAS: Item[] = [
  { href: "/precios", texto: "Lista de precios", icono: "precios" },
  { href: "/negocio", texto: "Mi negocio", icono: "negocio" },
  { href: "/suscripcion", texto: "Suscripción", icono: "cobro" },
  { href: "/ayuda", texto: "Ayuda", icono: "ayuda" },
];

function activo(ruta: string, item: Item) {
  return [item.href, ...(item.tambien ?? [])].some((h) => ruta === h || ruta.startsWith(h + "/"));
}

/** En el celular: barra fija abajo, al alcance del pulgar. */
export function BarraInferior() {
  const ruta = usePathname();
  return (
    <nav
      aria-label="Secciones"
      className="no-imprimir fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {PRINCIPALES.map((item) => {
          const on = activo(ruta, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 text-xs font-semibold ${
                  on ? "text-marca-700" : "text-suave"
                }`}
              >
                <span className={`grid h-8 w-14 place-items-center rounded-full ${on ? "bg-marca-100" : ""}`}>
                  <Icono n={item.icono} />
                </span>
                {item.corto ?? item.texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** En la computadora: menú fijo a la izquierda. */
export function MenuLateral() {
  const ruta = usePathname();
  const enlace = (item: Item) => {
    const on = activo(ruta, item);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          aria-current={on ? "page" : undefined}
          className={`flex min-h-12 items-center gap-3 rounded-xl px-3 font-semibold ${
            on ? "bg-marca-100 text-marca-900" : "text-tinta hover:bg-slate-100"
          }`}
        >
          <Icono n={item.icono} />
          {item.texto}
        </Link>
      </li>
    );
  };
  return (
    <nav aria-label="Secciones" className="flex flex-1 flex-col">
      <ul className="space-y-1">{PRINCIPALES.map(enlace)}</ul>
      <hr className="my-4 border-slate-200" />
      <ul className="space-y-1">{SECUNDARIAS.map(enlace)}</ul>
    </nav>
  );
}
