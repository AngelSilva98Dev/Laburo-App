import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, Icono, TituloSeccion } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { resumen } from "@/lib/datos";
import { dinero, hoyISO, MEDIOS_PAGO } from "@/lib/formato";
import { cobradoPorMedio, cobradoPorMes, esMes, nombreMes, sumarMeses, trabajosTerminados } from "@/lib/numeros";

export const metadata: Metadata = { title: "Cuánto gané" };

const MESES_GRAFICO = 6;

export default async function Numeros({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { negocio } = await requerirSesion();
  const actual = hoyISO().slice(0, 7);
  const pedido = (await searchParams).mes;
  const mes = esMes(pedido) && pedido <= actual ? pedido : actual;

  // Ventana del gráfico: los 6 meses que terminan en el mes elegido.
  const meses = Array.from({ length: MESES_GRAFICO }, (_, i) => sumarMeses(mes, i - MESES_GRAFICO + 1));
  const [porMes, porMedio, terminados, r] = await Promise.all([
    cobradoPorMes(negocio.id, sumarMeses(mes, -MESES_GRAFICO)),
    cobradoPorMedio(negocio.id, mes),
    trabajosTerminados(negocio.id, mes),
    resumen(negocio.id),
  ]);

  const enPesos = (m: string) => porMes.find((f) => f.mes === m && f.moneda === "ARS")?.total ?? 0;
  const total = enPesos(mes);
  const anterior = enPesos(sumarMeses(mes, -1));
  const dolares = porMes.find((f) => f.mes === mes && f.moneda === "USD");
  const cantidadPagos = porMes.filter((f) => f.mes === mes).reduce((s, f) => s + f.cantidad, 0);
  const cambio = anterior > 0 ? Math.round(((total - anterior) / anterior) * 100) : null;
  const maximo = Math.max(...meses.map(enPesos), 1);
  const medios = porMedio.filter((f) => f.moneda === "ARS");
  const maxMedio = Math.max(...medios.map((f) => f.total), 1);
  const debenPesos = r.porCobrar.find((p) => p.moneda === "ARS")?.saldo ?? 0;
  const esActual = mes === actual;

  return (
    <>
      <Encabezado titulo="Cuánto gané" bajada="Lo que anotaste como cobrado, mes a mes." />

      {/* Cambiar de mes */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <Link href={`/numeros?mes=${sumarMeses(mes, -1)}`} className="btn btn-secundario btn-chico px-3" aria-label="Mes anterior">
          <Icono n="izquierda" className="size-5" />
        </Link>
        <p className="text-lg font-bold first-letter:uppercase">{nombreMes(mes)}</p>
        {esActual ? (
          <span className="w-11" aria-hidden="true" />
        ) : (
          <Link href={`/numeros?mes=${sumarMeses(mes, 1)}`} className="btn btn-secundario btn-chico px-3" aria-label="Mes siguiente">
            <Icono n="derecha" className="size-5" />
          </Link>
        )}
      </div>

      {/* El número principal */}
      <div className="rounded-2xl bg-destacado p-5 text-white">
        <p className="text-white/80">{esActual ? "Este mes cobraste" : `En ${nombreMes(mes, true)} cobraste`}</p>
        <p className="text-4xl font-bold tracking-tight">{dinero(total)}</p>
        {dolares && <p className="text-lg font-semibold">+ {dinero(dolares.total, "USD")}</p>}
        {cambio !== null && (
          <p className="mt-2 text-white/90">
            {cambio === 0
              ? `Igual que en ${nombreMes(sumarMeses(mes, -1), true)}`
              : `${cambio > 0 ? "▲" : "▼"} ${Math.abs(cambio)}% ${cambio > 0 ? "más" : "menos"} que en ${nombreMes(sumarMeses(mes, -1), true)}`}
          </p>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="tarjeta">
          <p className="text-sm text-suave">Trabajos terminados</p>
          <p className="text-2xl font-bold">{terminados}</p>
        </div>
        <div className="tarjeta">
          <p className="text-sm text-suave">Pagos recibidos</p>
          <p className="text-2xl font-bold">{cantidadPagos}</p>
        </div>
      </div>

      {/* Últimos 6 meses: columnas finas, el mes elegido resaltado. */}
      <TituloSeccion>Últimos {MESES_GRAFICO} meses</TituloSeccion>
      <div className="tarjeta">
        <ul className="flex h-44 items-end justify-between gap-1 border-b border-slate-200" aria-label="Cobrado por mes, en pesos">
          {meses.map((m) => {
            const valor = enPesos(m);
            const alto = valor > 0 ? Math.max((valor / maximo) * 100, 3) : 0;
            const elegido = m === mes;
            const etiqueta = `${nombreMes(m)}: ${dinero(valor)}`;
            return (
              <li key={m} className="h-full flex-1">
                <Link
                  href={`/numeros?mes=${m}`}
                  aria-label={etiqueta}
                  aria-current={elegido ? "date" : undefined}
                  title={etiqueta}
                  className="group flex h-full items-end justify-center rounded-t-md hover:bg-slate-50"
                >
                  <span
                    className={`block w-full max-w-6 rounded-t ${elegido ? "bg-marca-600" : "bg-slate-300 group-hover:bg-marca-600/60"}`}
                    style={{ height: `${alto}%` }}
                  />
                </Link>
              </li>
            );
          })}
        </ul>
        <ul className="mt-1.5 flex justify-between gap-1 text-center text-xs font-semibold text-suave" aria-hidden="true">
          {meses.map((m) => (
            <li key={m} className={`flex-1 ${m === mes ? "text-tinta" : ""}`}>
              {nombreMes(m, true)}
            </li>
          ))}
        </ul>
        <details className="desplegable mt-2">
          <summary className="text-sm">Ver en números</summary>
          <table className="w-full text-left">
            <caption className="sr-only">Cobrado por mes, en pesos</caption>
            <thead>
              <tr className="text-sm text-suave">
                <th className="py-1 font-semibold">Mes</th>
                <th className="py-1 text-right font-semibold">Cobrado</th>
              </tr>
            </thead>
            <tbody>
              {[...meses].reverse().map((m) => (
                <tr key={m} className="border-t border-slate-200">
                  <td className="py-2 first-letter:uppercase">{nombreMes(m)}</td>
                  <td className="py-2 text-right font-semibold">{dinero(enPesos(m))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>

      {/* Cómo le pagaron */}
      <TituloSeccion>Cómo te pagaron</TituloSeccion>
      {medios.length === 0 ? (
        <p className="tarjeta text-suave">Todavía no anotaste pagos en {nombreMes(mes, true)}.</p>
      ) : (
        <ul className="tarjeta space-y-4">
          {medios.map((f) => (
            <li key={f.medio}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-semibold">{MEDIOS_PAGO[f.medio] ?? f.medio}</span>
                <span className="font-bold">{dinero(f.total)}</span>
              </div>
              <div className="mt-1 h-2.5 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-marca-600" style={{ width: `${(f.total / maxMedio) * 100}%` }} />
              </div>
              <p className="mt-0.5 text-sm text-suave">
                {f.cantidad === 1 ? "1 pago" : `${f.cantidad} pagos`} · {Math.round((f.total / (total || 1)) * 100)}% del total
              </p>
            </li>
          ))}
        </ul>
      )}

      {debenPesos > 0 && (
        <Link href="/cobros" className="tarjeta mt-4 flex items-center gap-3 transition hover:border-marca-200">
          <span className="flex-1">
            <span className="block text-sm text-suave">Todavía te deben</span>
            <span className="block text-xl font-bold">{dinero(debenPesos)}</span>
          </span>
          <span className="font-semibold text-marca-700">Ver cobros</span>
          <Icono n="derecha" className="size-5 text-marca-700" />
        </Link>
      )}

      <p className="ayuda mt-6">
        Se cuenta lo que anotaste como pagado en cada cobro, en la fecha del pago. No reemplaza a tu contador.
      </p>
    </>
  );
}
