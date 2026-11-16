"use client";

import { useState } from "react";
import { calcularTotales, dinero } from "@/lib/formato";
import { Icono } from "./ui";

type Fila = { clave: number; descripcion: string; cantidad: string; precio: string };

const aNumero = (v: string) => {
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

/**
 * Lista de ítems de un presupuesto o cobro, con el total que se actualiza solo.
 * Lo poco usado (descuento, dólares, IVA) queda guardado en "Más opciones".
 */
export function EditorLineas({
  inicial,
  precios,
  monedaInicial = "ARS",
  descuentoInicial = 0,
  ofrecerIva,
  ivaInicial,
}: {
  inicial: { descripcion: string; cantidad: number; precio: number }[];
  precios: { nombre: string; precio: number }[];
  monedaInicial?: string;
  descuentoInicial?: number;
  ofrecerIva: boolean;
  ivaInicial: boolean;
}) {
  const [filas, setFilas] = useState<Fila[]>(() =>
    (inicial.length ? inicial : [{ descripcion: "", cantidad: 1, precio: 0 }]).map((l, i) => ({
      clave: i,
      descripcion: l.descripcion,
      cantidad: String(l.cantidad),
      precio: l.precio ? String(l.precio) : "",
    })),
  );
  const [sig, setSig] = useState(filas.length);
  const [moneda, setMoneda] = useState(monedaInicial);
  const [descuento, setDescuento] = useState(descuentoInicial ? String(descuentoInicial) : "");
  const [iva, setIva] = useState(ivaInicial);

  const cambiar = (clave: number, cambio: Partial<Fila>) =>
    setFilas((fs) => fs.map((f) => (f.clave === clave ? { ...f, ...cambio } : f)));

  const agregar = (descripcion = "", precio = "") => {
    setFilas((fs) => {
      // Si la única fila está vacía, la reemplaza en vez de sumar otra.
      const base = fs.length === 1 && !fs[0].descripcion && !fs[0].precio && descripcion ? [] : fs;
      return [...base, { clave: sig, descripcion, cantidad: "1", precio }];
    });
    setSig((n) => n + 1);
  };

  const lineas = filas.map((f) => ({
    descripcion: f.descripcion,
    cantidad: aNumero(f.cantidad) || 1,
    precio: aNumero(f.precio),
  }));
  const t = calcularTotales(lineas, aNumero(descuento), iva ? 21 : 0);

  return (
    <fieldset className="space-y-3">
      <legend className="etiqueta">¿Qué incluye?</legend>
      <input type="hidden" name="lineas" value={JSON.stringify(lineas)} />

      {filas.map((f, i) => (
        <div key={f.clave} className="rounded-xl border-2 border-slate-200 bg-white p-3">
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <label htmlFor={`desc-${f.clave}`} className="mb-1 block text-sm font-semibold text-suave">
                Ítem {i + 1}
              </label>
              <input
                id={`desc-${f.clave}`}
                className="campo"
                list="lista-precios"
                autoComplete="off"
                placeholder="Ej: Mano de obra, materiales…"
                value={f.descripcion}
                onChange={(e) => {
                  const descripcion = e.target.value;
                  const p = precios.find((x) => x.nombre === descripcion);
                  cambiar(f.clave, p && !f.precio ? { descripcion, precio: String(p.precio) } : { descripcion });
                }}
              />
            </div>
            {filas.length > 1 && (
              <button
                type="button"
                onClick={() => setFilas((fs) => fs.filter((x) => x.clave !== f.clave))}
                className="mt-6 grid size-13 shrink-0 place-items-center rounded-xl text-red-700 hover:bg-red-50"
                aria-label={`Quitar ítem ${i + 1}`}
              >
                <Icono n="borrar" />
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-[5.5rem_1fr] gap-3">
            <div>
              <label htmlFor={`cant-${f.clave}`} className="mb-1 block text-sm font-semibold text-suave">Cantidad</label>
              <input
                id={`cant-${f.clave}`}
                className="campo px-3"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                value={f.cantidad}
                onChange={(e) => cambiar(f.clave, { cantidad: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor={`precio-${f.clave}`} className="mb-1 block text-sm font-semibold text-suave">
                Precio de cada uno ({moneda === "USD" ? "US$" : "$"})
              </label>
              <input
                id={`precio-${f.clave}`}
                className="campo"
                type="number"
                inputMode="decimal"
                min="0"
                step="any"
                placeholder="0"
                value={f.precio}
                onChange={(e) => cambiar(f.clave, { precio: e.target.value })}
              />
            </div>
          </div>
          {lineas[i].cantidad !== 1 && lineas[i].precio > 0 && (
            <p className="mt-2 text-right text-sm text-suave">
              Subtotal: <strong className="text-tinta">{dinero(lineas[i].cantidad * lineas[i].precio, moneda)}</strong>
            </p>
          )}
        </div>
      ))}

      <datalist id="lista-precios">
        {precios.map((p) => (
          <option key={p.nombre} value={p.nombre} />
        ))}
      </datalist>

      <div className="grid gap-3 sm:grid-cols-2">
        <button type="button" onClick={() => agregar()} className="btn btn-secundario">
          <Icono n="mas" /> Agregar otro ítem
        </button>
        {precios.length > 0 && (
          <select
            aria-label="Agregar un ítem desde mi lista de precios"
            className="campo font-semibold"
            value=""
            onChange={(e) => {
              const p = precios.find((x) => x.nombre === e.target.value);
              if (p) agregar(p.nombre, String(p.precio));
            }}
          >
            <option value="">Agregar desde mi lista de precios…</option>
            {precios.map((p) => (
              <option key={p.nombre} value={p.nombre}>
                {p.nombre} — {dinero(p.precio)}
              </option>
            ))}
          </select>
        )}
      </div>

      <details className="desplegable rounded-xl border-2 border-slate-200 bg-white px-4" open={!!descuentoInicial || monedaInicial === "USD"}>
        <summary>Más opciones: descuento, dólares{ofrecerIva ? ", IVA" : ""}</summary>
        <div className="space-y-4 pb-4">
          <div>
            <label htmlFor="descuento" className="etiqueta">Descuento <span className="opcional">(en plata, no en %)</span></label>
            <input
              id="descuento"
              name="descuento"
              className="campo"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              placeholder="0"
              value={descuento}
              onChange={(e) => setDescuento(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="moneda" className="etiqueta">¿En qué moneda?</label>
            <select id="moneda" name="moneda" className="campo" value={moneda} onChange={(e) => setMoneda(e.target.value)}>
              <option value="ARS">Pesos ($)</option>
              <option value="USD">Dólares (US$)</option>
            </select>
          </div>
          {ofrecerIva && (
            <label className="flex min-h-13 cursor-pointer items-center gap-3 font-semibold">
              <input type="checkbox" name="iva" checked={iva} onChange={(e) => setIva(e.target.checked)} className="size-6 accent-marca-600" />
              Sumar IVA (21%) a estos precios
            </label>
          )}
        </div>
      </details>

      <div className="rounded-2xl bg-marca-900 p-4 text-white" aria-live="polite">
        {(t.descuento > 0 || t.iva > 0) && (
          <dl className="mb-2 space-y-1 text-marca-100">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{dinero(t.subtotal, moneda)}</dd></div>
            {t.descuento > 0 && <div className="flex justify-between"><dt>Descuento</dt><dd>– {dinero(t.descuento, moneda)}</dd></div>}
            {t.iva > 0 && <div className="flex justify-between"><dt>IVA 21%</dt><dd>{dinero(t.iva, moneda)}</dd></div>}
          </dl>
        )}
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-lg font-semibold">Total</span>
          <span className="text-3xl font-bold tracking-tight">{dinero(t.total, moneda)}</span>
        </div>
      </div>
    </fieldset>
  );
}
