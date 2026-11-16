import type { Metadata } from "next";
import Link from "next/link";
import { FilaTrabajo } from "@/components/trabajos";
import { Icono, TituloSeccion, type NombreIcono } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { resumen, trabajosEntre } from "@/lib/datos";
import { dinero, fechaLarga, hoyISO, sumarDias } from "@/lib/formato";

export const metadata: Metadata = { title: "Inicio" };

const ATAJOS: { href: string; texto: string; icono: NombreIcono }[] = [
  { href: "/presupuestos/nuevo", texto: "Hacer un presupuesto", icono: "presupuesto" },
  { href: "/trabajos/nuevo", texto: "Agendar un trabajo", icono: "agenda" },
  { href: "/cobros/nuevo", texto: "Anotar un cobro", icono: "cobro" },
  { href: "/clientes/nuevo", texto: "Agregar un cliente", icono: "clientes" },
];

export default async function Inicio() {
  const { usuario, negocio } = await requerirSesion();
  const hoy = hoyISO();
  const [r, proximos] = await Promise.all([resumen(negocio.id), trabajosEntre(negocio.id, hoy, sumarDias(hoy, 1))]);
  const deHoy = proximos.filter((t) => t.fecha === hoy && t.estado !== "cancelado");
  const deManiana = proximos.filter((t) => t.fecha !== hoy && t.estado !== "cancelado");
  const pesos = r.porCobrar.find((p) => p.moneda === "ARS");
  const dolares = r.porCobrar.find((p) => p.moneda === "USD");
  const faltaConfigurar = !negocio.telefono || !negocio.alias;

  return (
    <>
      <header className="mb-5">
        <p className="text-suave first-letter:uppercase">{fechaLarga(hoy)}</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Hola, {usuario.nombre.split(" ")[0]}</h1>
      </header>

      {/* Lo más importante primero: la plata y lo que espera respuesta. */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/cobros" className="tarjeta block transition hover:border-marca-200">
          <p className="text-sm font-medium text-suave">Te deben</p>
          <p className="mt-1 text-2xl font-bold tracking-tight break-words">{dinero(pesos?.saldo ?? 0)}</p>
          {dolares && <p className="font-semibold">+ {dinero(dolares.saldo, "USD")}</p>}
          <p className="mt-1 text-sm font-semibold text-marca-700">Ver cobros</p>
        </Link>
        <Link href="/presupuestos" className="tarjeta block transition hover:border-marca-200">
          <p className="text-sm font-medium text-suave">Presupuestos sin respuesta</p>
          <p className="mt-1 text-2xl font-bold tracking-tight">{r.presupuestosEsperando}</p>
          <p className="mt-1 text-sm font-semibold text-marca-700">Ver presupuestos</p>
        </Link>
      </div>

      {r.clientes === 0 && (
        <div className="mt-4 rounded-2xl border-2 border-marca-200 bg-marca-50 p-5">
          <h2 className="text-lg font-bold">¡Bienvenido! Empecemos por lo primero</h2>
          <p className="mt-1 text-suave">Hacé tu primer presupuesto. Ahí mismo cargás al cliente, no hace falta nada antes.</p>
          <Link href="/presupuestos/nuevo" className="btn btn-primario mt-4 w-full sm:w-auto">
            <Icono n="mas" /> Hacer mi primer presupuesto
          </Link>
        </div>
      )}

      <TituloSeccion>Trabajos de hoy</TituloSeccion>
      {deHoy.length ? (
        <ul className="lista">{deHoy.map((t) => <FilaTrabajo key={t.id} t={t} hoy={hoy} />)}</ul>
      ) : (
        <div className="tarjeta flex flex-wrap items-center justify-between gap-3">
          <p className="text-suave">No tenés trabajos agendados para hoy.</p>
          <Link href="/trabajos/nuevo" className="btn btn-secundario btn-chico">Agendar uno</Link>
        </div>
      )}

      {deManiana.length > 0 && (
        <>
          <TituloSeccion>Mañana</TituloSeccion>
          <ul className="lista">{deManiana.map((t) => <FilaTrabajo key={t.id} t={t} hoy={hoy} />)}</ul>
        </>
      )}

      <TituloSeccion>¿Qué querés hacer?</TituloSeccion>
      <ul className="grid grid-cols-2 gap-3">
        {ATAJOS.map((a) => (
          <li key={a.href}>
            <Link href={a.href} className="tarjeta flex h-full min-h-24 flex-col items-start gap-2 font-semibold transition hover:border-marca-200 active:scale-[0.98]">
              <span className="grid size-10 place-items-center rounded-xl bg-marca-100 text-marca-700"><Icono n={a.icono} /></span>
              {a.texto}
            </Link>
          </li>
        ))}
      </ul>

      {faltaConfigurar && r.clientes > 0 && (
        <Link href="/negocio" className="mt-6 flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-950">
          <Icono n="negocio" />
          <span className="flex-1">
            <strong className="block">Completá los datos de tu negocio</strong>
            <span className="text-sm">Sumá tu celular y tu alias para que los clientes te puedan escribir y pagar.</span>
          </span>
          <Icono n="derecha" className="size-5" />
        </Link>
      )}
    </>
  );
}
