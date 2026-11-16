import type { Metadata } from "next";
import Link from "next/link";
import { FilaTrabajo } from "@/components/trabajos";
import { Encabezado, Icono, TituloSeccion } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { trabajosEntre, trabajosSinFecha } from "@/lib/datos";
import { diaDelMes, diaSemanaCorto, esFechaISO, fechaAmigable, fechaLarga, hoyISO, lunesDe, sumarDias } from "@/lib/formato";

export const metadata: Metadata = { title: "Agenda" };

export default async function Agenda({ searchParams }: { searchParams: Promise<{ dia?: string }> }) {
  const { negocio } = await requerirSesion();
  const hoy = hoyISO();
  const { dia: pedido } = await searchParams;
  const dia = esFechaISO(pedido) ? pedido : hoy;
  const lunes = lunesDe(dia);
  const semana = Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i));

  const [deLaSemana, sinFecha] = await Promise.all([
    trabajosEntre(negocio.id, semana[0], semana[6]),
    trabajosSinFecha(negocio.id),
  ]);
  const delDia = deLaSemana.filter((t) => t.fecha === dia);
  const cuantos = (d: string) => deLaSemana.filter((t) => t.fecha === d && t.estado !== "cancelado").length;
  const titulo = fechaAmigable(dia, hoy);

  return (
    <>
      <Encabezado titulo="Agenda">
        <Link href={`/trabajos/nuevo?dia=${dia}`} className="btn btn-primario w-full sm:w-auto">
          <Icono n="mas" /> Agendar trabajo
        </Link>
      </Encabezado>

      {/* Semana: 7 días a la vista, se cambia con un toque. */}
      <div className="tarjeta p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <Link href={`/agenda?dia=${sumarDias(dia, -7)}`} className="btn btn-secundario btn-chico px-3" aria-label="Semana anterior">
            <Icono n="izquierda" className="size-5" />
          </Link>
          {dia !== hoy ? (
            <Link href="/agenda" className="btn btn-secundario btn-chico">Volver a hoy</Link>
          ) : (
            <p className="font-semibold text-suave">Esta semana</p>
          )}
          <Link href={`/agenda?dia=${sumarDias(dia, 7)}`} className="btn btn-secundario btn-chico px-3" aria-label="Semana siguiente">
            <Icono n="derecha" className="size-5" />
          </Link>
        </div>
        <ul className="grid grid-cols-7 gap-1">
          {semana.map((d) => {
            const elegido = d === dia;
            const n = cuantos(d);
            return (
              <li key={d}>
                <Link
                  href={`/agenda?dia=${d}`}
                  aria-current={elegido ? "date" : undefined}
                  aria-label={`${fechaLarga(d)}, ${n === 0 ? "sin trabajos" : n === 1 ? "1 trabajo" : `${n} trabajos`}`}
                  className={`flex min-h-16 flex-col items-center justify-center rounded-xl text-center ${
                    elegido ? "bg-marca-600 text-white" : d === hoy ? "bg-marca-50 text-marca-900" : "hover:bg-slate-100"
                  }`}
                >
                  <span className="text-xs font-semibold uppercase">{diaSemanaCorto(d)}</span>
                  <span className="text-lg leading-tight font-bold">{diaDelMes(d)}</span>
                  <span className={`mt-0.5 size-1.5 rounded-full ${n ? (elegido ? "bg-white" : "bg-marca-600") : "bg-transparent"}`} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <TituloSeccion>
        <span className="first-letter:uppercase inline-block">{titulo}</span>
        {titulo !== fechaLarga(dia) && <span className="font-normal text-suave"> · {fechaLarga(dia)}</span>}
      </TituloSeccion>
      {delDia.length ? (
        <ul className="lista">{delDia.map((t) => <FilaTrabajo key={t.id} t={t} hoy={hoy} />)}</ul>
      ) : (
        <div className="tarjeta py-8 text-center">
          <p className="text-suave">No hay trabajos para este día.</p>
          <Link href={`/trabajos/nuevo?dia=${dia}`} className="btn btn-secundario mt-4">
            <Icono n="mas" /> Agendar un trabajo
          </Link>
        </div>
      )}

      {sinFecha.length > 0 && (
        <>
          <TituloSeccion>Falta ponerles fecha</TituloSeccion>
          <ul className="lista">{sinFecha.map((t) => <FilaTrabajo key={t.id} t={t} hoy={hoy} />)}</ul>
        </>
      )}
    </>
  );
}
