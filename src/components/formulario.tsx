"use client";

import Link from "next/link";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import type { Resultado } from "@/lib/acciones";

/**
 * Formulario con botón grande al final.
 * - Mientras guarda, el botón lo dice y no se puede tocar dos veces.
 * - Si algo falta, el aviso aparece al lado del botón, en palabras simples,
 *   y no se pierde nada de lo que la persona ya escribió.
 */
export function Formulario({
  accion,
  boton,
  cancelar,
  claseBoton = "btn btn-primario",
  limpiarAlGuardar = false,
  className = "space-y-5",
  children,
}: {
  accion: (fd: FormData) => Promise<Resultado>;
  boton: ReactNode;
  cancelar?: string;
  claseBoton?: string;
  limpiarAlGuardar?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const [resultado, setResultado] = useState<Resultado>();
  const [guardando, iniciar] = useTransition();
  const form = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={form}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        setResultado(undefined);
        iniciar(async () => {
          const r = await accion(fd);
          setResultado(r);
          if (r?.ok && limpiarAlGuardar) form.current?.reset();
        });
      }}
    >
      {children}
      <div aria-live="polite">
        {resultado?.error && <p className="aviso-error" role="alert">{resultado.error}</p>}
        {resultado?.ok && <p className="aviso-ok">{resultado.ok}</p>}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row-reverse sm:justify-start">
        <button type="submit" disabled={guardando} className={`${claseBoton} sm:min-w-48`}>
          {guardando ? "Guardando…" : boton}
        </button>
        {cancelar && (
          <Link href={cancelar} className="btn btn-secundario">
            Cancelar
          </Link>
        )}
      </div>
    </form>
  );
}

/** Botón para formularios simples (un solo toque). Muestra que está trabajando. */
export function BotonAccion({
  children,
  className = "btn btn-primario",
  confirmar,
}: {
  children: ReactNode;
  className?: string;
  /** Si se pasa, pregunta antes de seguir. Para acciones que no se pueden deshacer. */
  confirmar?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmar && !window.confirm(confirmar)) e.preventDefault();
      }}
    >
      {pending ? "Un momento…" : children}
    </button>
  );
}

/** Abre WhatsApp con el mensaje escrito y, si hace falta, avisa al sistema que se envió. */
export function BotonWhatsApp({
  href,
  alEnviar,
  className = "btn btn-wa",
  children,
}: {
  href: string;
  alEnviar?: () => Promise<void>;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => {
        if (alEnviar) void alEnviar();
      }}
    >
      {children}
    </a>
  );
}

export function BotonCopiar({ texto, children }: { texto: string; children: ReactNode }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      className="btn btn-secundario btn-chico"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2500);
        } catch {}
      }}
    >
      {copiado ? "¡Copiado!" : children}
    </button>
  );
}

export function BotonImprimir({ children }: { children: ReactNode }) {
  return (
    <button type="button" className="btn btn-secundario w-full" onClick={() => window.print()}>
      {children}
    </button>
  );
}

/** Elegir un cliente de la lista o cargar uno nuevo sin salir del formulario. */
export function SelectorCliente({
  clientes,
  inicial,
}: {
  clientes: { id: string; nombre: string }[];
  inicial?: string;
}) {
  const [valor, setValor] = useState(inicial ?? (clientes.length ? "" : "nuevo"));
  return (
    <div className="space-y-3">
      <div>
        <label htmlFor="cliente_id" className="etiqueta">¿Para qué cliente?</label>
        <select
          id="cliente_id"
          name="cliente_id"
          required
          className="campo"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        >
          <option value="" disabled>Elegí un cliente…</option>
          <option value="nuevo">＋ Es un cliente nuevo</option>
          {clientes.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
      </div>
      {valor === "nuevo" && (
        <div className="space-y-3 rounded-xl border-2 border-marca-200 bg-marca-50 p-4">
          <div>
            <label htmlFor="cliente_nombre" className="etiqueta">Nombre del cliente</label>
            <input id="cliente_nombre" name="cliente_nombre" required className="campo" autoComplete="off" placeholder="Ej: Laura Gómez" />
          </div>
          <div>
            <label htmlFor="cliente_telefono" className="etiqueta">
              Celular <span className="opcional">(para mandarle WhatsApp)</span>
            </label>
            <input id="cliente_telefono" name="cliente_telefono" type="tel" inputMode="tel" className="campo" autoComplete="off" placeholder="Ej: 11 5555 1234" />
          </div>
          <div>
            <label htmlFor="cliente_direccion" className="etiqueta">
              Dirección <span className="opcional">(opcional)</span>
            </label>
            <input id="cliente_direccion" name="cliente_direccion" className="campo" autoComplete="off" placeholder="Calle, número y localidad" />
          </div>
        </div>
      )}
    </div>
  );
}
