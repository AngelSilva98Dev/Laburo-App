import Link from "next/link";
import { Suspense } from "react";
import { BotonAccion } from "@/components/formulario";
import { Logo } from "@/components/logo";
import { SelectorTema } from "@/components/selector-tema";
import { BarraInferior, MenuLateral } from "@/components/navegacion";
import { Icono } from "@/components/ui";
import { salir } from "@/lib/acciones";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      <a href="#contenido" className="btn btn-primario sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50">
        Ir al contenido
      </a>

      {/* Computadora: menú a la izquierda */}
      <aside className="no-imprimir sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-slate-200 bg-superficie p-4 md:flex">
        <Link href="/inicio" className="mb-6 px-2 pt-1"><Logo /></Link>
        <Suspense>
          <MenuLateral />
        </Suspense>
        <div className="mb-2">
          <p className="mb-1.5 px-1 text-sm font-semibold text-suave">Apariencia</p>
          <SelectorTema compacto />
        </div>
        <form action={salir}>
          <BotonAccion className="flex min-h-12 w-full cursor-pointer items-center gap-3 rounded-xl px-3 font-semibold text-suave hover:bg-slate-100">
            <Icono n="salir" /> Cerrar sesión
          </BotonAccion>
        </form>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Celular: barra de arriba */}
        <header className="no-imprimir sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-superficie/95 px-4 py-2 backdrop-blur md:hidden">
          <Link href="/inicio"><Logo /></Link>
          <Link href="/mas" className="flex min-h-11 items-center gap-2 rounded-xl px-3 font-semibold text-marca-700 hover:bg-marca-50">
            <Icono n="menu" /> Más
          </Link>
        </header>

        <main id="contenido" className="mx-auto max-w-3xl px-4 pt-5 pb-28 md:px-8 md:pt-8 md:pb-12">
          {children}
        </main>
      </div>

      {/* Celular: secciones abajo, al alcance del pulgar */}
      <Suspense>
        <BarraInferior />
      </Suspense>
    </div>
  );
}
