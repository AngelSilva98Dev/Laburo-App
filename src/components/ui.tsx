import Link from "next/link";
import type { ReactNode } from "react";
import type { Estado, Tono } from "@/lib/formato";

/** Íconos simples de línea. Siempre van acompañados de texto. */
const ICONOS = {
  inicio: "M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
  agenda: "M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z",
  clientes: "M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM21 20v-1a4 4 0 0 0-3-3.85M15.5 4.15a3.5 3.5 0 0 1 0 6.7",
  presupuesto: "M14 3H7a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7zM14 3v4h4M9 12h6M9 16h6",
  cobro: "M3 7a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1zM12 14.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM6.5 9.5v.01M17.5 14.5v.01",
  menu: "M4 6h16M4 12h16M4 18h16",
  mas: "M12 5v14M5 12h14",
  whatsapp: "M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3.5 20.5l1.5-4.3A8.5 8.5 0 1 1 20.5 11.6z",
  telefono: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z",
  mapa: "M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  derecha: "m9 6 6 6-6 6",
  izquierda: "m15 6-6 6 6 6",
  check: "m5 12.5 4.5 4.5L19 7.5",
  editar: "M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4",
  borrar: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5",
  precios: "M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9zM7.5 7.5v.01",
  negocio: "M4 9 5.5 4h13L20 9M4 9v11h16V9M4 9a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0A2.7 2.7 0 0 0 20 9M9 20v-5h6v5",
  salir: "M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5M15 8l4 4-4 4M19 12H9",
  imprimir: "M7 8V3h10v5M7 17H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-3M7 14h10v7H7z",
  copiar: "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1zM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
  reloj: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  ojo: "M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  subir: "M4 17 10 11l4 4 6-7M15 8h5v5",
  descargar: "M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14",
  camara: "M4 8a1 1 0 0 1 1-1h2.5L9 5h6l1.5 2H19a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zM12 16a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z",
  campana: "M6 9a6 6 0 1 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9zM10 20a2.2 2.2 0 0 0 4 0",
  sol: "M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4",
  luna: "M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z",
  celular: "M8 2h8a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 18.5h2",
  ayuda: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.7M12 17v.01",
} as const;

export type NombreIcono = keyof typeof ICONOS;

export function Icono({ n, className = "size-6" }: { n: NombreIcono; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d={ICONOS[n]} />
    </svg>
  );
}

const TONOS: Record<Tono, string> = {
  gris: "bg-slate-100 text-slate-700",
  azul: "bg-marca-100 text-marca-900",
  ambar: "bg-amber-100 text-amber-900",
  verde: "bg-emerald-100 text-emerald-900",
  rojo: "bg-red-100 text-red-800",
};

/** Etiqueta de estado. Usa color y texto: nunca depende solo del color. */
export function Chip({ estado }: { estado: Estado }) {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ${TONOS[estado.tono]}`}>
      {estado.texto}
    </span>
  );
}

/** Encabezado de cada pantalla: título claro y, si corresponde, cómo volver. */
export function Encabezado({
  titulo,
  bajada,
  volver,
  children,
}: {
  titulo: string;
  bajada?: ReactNode;
  volver?: { href: string; texto: string };
  children?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {volver && (
        <Link
          href={volver.href}
          className="no-imprimir -ml-2 mb-1 inline-flex min-h-11 items-center gap-1 rounded-lg px-2 font-semibold text-marca-700 hover:bg-marca-50"
        >
          <Icono n="izquierda" className="size-5" />
          {volver.texto}
        </Link>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h1>
          {bajada && <p className="mt-1 text-suave">{bajada}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}

/** Lo que se ve cuando todavía no hay nada cargado: explica y ofrece el primer paso. */
export function Vacio({
  icono,
  titulo,
  texto,
  children,
}: {
  icono: NombreIcono;
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <div className="tarjeta flex flex-col items-center px-6 py-10 text-center">
      <span className="mb-4 grid size-16 place-items-center rounded-full bg-marca-50 text-marca-600">
        <Icono n={icono} className="size-8" />
      </span>
      <h2 className="text-xl font-bold">{titulo}</h2>
      <p className="mt-2 max-w-sm text-suave">{texto}</p>
      {children && <div className="mt-6 flex w-full max-w-xs flex-col gap-3">{children}</div>}
    </div>
  );
}

export function TituloSeccion({ children }: { children: ReactNode }) {
  return <h2 className="mb-2 mt-7 text-lg font-bold">{children}</h2>;
}

/** Dato con su nombre arriba, para las pantallas de detalle. */
export function Dato({ nombre, children }: { nombre: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-suave">{nombre}</dt>
      <dd className="font-medium break-words">{children}</dd>
    </div>
  );
}
