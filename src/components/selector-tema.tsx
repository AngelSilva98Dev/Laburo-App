"use client";

import { useSyncExternalStore } from "react";
import { CLAVE_TEMA, EVENTO_TEMA, type Tema } from "@/lib/tema";
import { Icono, type NombreIcono } from "./ui";

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE_TEMA);
    return t === "claro" || t === "oscuro" ? t : "auto";
  } catch {
    return "auto";
  }
}

function suscribir(avisar: () => void) {
  window.addEventListener(EVENTO_TEMA, avisar);
  window.addEventListener("storage", avisar);
  return () => {
    window.removeEventListener(EVENTO_TEMA, avisar);
    window.removeEventListener("storage", avisar);
  };
}

function elegir(t: Tema) {
  try {
    localStorage.setItem(CLAVE_TEMA, t);
  } catch {}
  // El script del <head> escucha este evento y cambia los colores al instante.
  window.dispatchEvent(new Event(EVENTO_TEMA));
}

const OPCIONES: { valor: Tema; texto: string; icono: NombreIcono }[] = [
  { valor: "claro", texto: "Claro", icono: "sol" },
  { valor: "oscuro", texto: "Oscuro", icono: "luna" },
  { valor: "auto", texto: "Automático", icono: "celular" },
];

/** Tres botones grandes: Claro, Oscuro o Automático (igual que el celular). */
export function SelectorTema({ compacto = false }: { compacto?: boolean }) {
  const actual = useSyncExternalStore(suscribir, leer, () => "auto" as Tema);

  return (
    <div role="group" aria-label="Apariencia" className="grid grid-cols-3 gap-2">
      {OPCIONES.map((o) => {
        const on = actual === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            aria-pressed={on}
            onClick={() => elegir(o.valor)}
            className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 font-semibold transition ${
              compacto ? "min-h-14 text-xs" : "min-h-20 text-sm"
            } ${on ? "border-marca-600 bg-marca-50 text-marca-900" : "border-slate-200 text-suave hover:border-slate-300"}`}
          >
            <Icono n={o.icono} className={compacto ? "size-5" : "size-6"} />
            {o.texto}
          </button>
        );
      })}
    </div>
  );
}
