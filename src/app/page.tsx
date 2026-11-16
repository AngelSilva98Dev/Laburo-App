import Link from "next/link";
import { BotonAccion } from "@/components/formulario";
import { Logo } from "@/components/logo";
import { Icono, type NombreIcono } from "@/components/ui";
import { entrarDemo } from "@/lib/acciones";
import { DIAS_PRUEBA } from "@/lib/suscripcion";

const BENEFICIOS: { icono: NombreIcono; titulo: string; texto: string }[] = [
  {
    icono: "whatsapp",
    titulo: "Presupuestos por WhatsApp",
    texto: "Armalo en un minuto y mandalo. Tu cliente lo ve prolijo y lo acepta con un toque, sin bajar nada.",
  },
  {
    icono: "agenda",
    titulo: "Tu agenda, ordenada",
    texto: "Mirá qué trabajos tenés hoy, a qué hora y dónde. Con un toque avisás que estás en camino.",
  },
  {
    icono: "cobro",
    titulo: "Sabé quién te debe",
    texto: "Anotá señas y pagos en efectivo, transferencia o Mercado Pago. El cliente recibe tu alias para pagarte.",
  },
  {
    icono: "subir",
    titulo: "Precios al día",
    texto: "¿Subió todo? Aumentá tu lista de precios completa con un porcentaje, en un solo paso.",
  },
];

export default function Portada() {
  return (
    <div className="bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Logo />
        <Link href="/ingresar" className="btn btn-secundario btn-chico">Ingresar</Link>
      </header>

      <main>
        <section className="mx-auto max-w-5xl px-5 pt-8 pb-14 sm:pt-16">
          <div className="max-w-2xl">
            <p className="mb-3 inline-block rounded-full bg-marca-100 px-3 py-1 text-sm font-semibold text-marca-900">
              Para plomeros, electricistas, gasistas, jardineros, técnicos y más
            </p>
            <h1 className="text-4xl leading-tight font-bold tracking-tight sm:text-5xl">
              Presupuestá, agendá y cobrá tus trabajos desde el celular.
            </h1>
            <p className="mt-4 text-xl text-suave">
              Laburo ordena tu trabajo de todos los días. Sin planillas, sin papelitos y sin complicarte.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/registrarse" className="btn btn-primario text-lg">Probar gratis {DIAS_PRUEBA} días</Link>
              <form action={entrarDemo} className="contents">
                <BotonAccion className="btn btn-secundario text-lg">Probar con datos de ejemplo</BotonAccion>
              </form>
            </div>
            <p className="mt-3 text-suave">No hace falta tarjeta para empezar.</p>
          </div>
        </section>

        <section className="bg-fondo">
          <div className="mx-auto max-w-5xl px-5 py-14">
            <h2 className="text-2xl font-bold sm:text-3xl">Todo lo que necesitás, y nada más</h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {BENEFICIOS.map((b) => (
                <li key={b.titulo} className="tarjeta flex gap-4 p-5">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-marca-100 text-marca-700">
                    <Icono n={b.icono} />
                  </span>
                  <div>
                    <h3 className="text-lg font-bold">{b.titulo}</h3>
                    <p className="mt-1 text-suave">{b.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-5 py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Así de simple</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              ["Hacé el presupuesto", "Elegís el cliente, cargás qué incluye y el total se calcula solo."],
              ["Mandalo por WhatsApp", "El cliente lo abre desde su celular y lo acepta."],
              ["Hacé el trabajo y cobrá", "Lo agendás, lo terminás y anotás el pago. Listo."],
            ].map(([titulo, texto], i) => (
              <li key={titulo} className="tarjeta p-5">
                <span className="grid size-10 place-items-center rounded-full bg-marca-600 text-lg font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 text-lg font-bold">{titulo}</h3>
                <p className="mt-1 text-suave">{texto}</p>
              </li>
            ))}
          </ol>
          <div className="mt-10">
            <Link href="/registrarse" className="btn btn-primario w-full text-lg sm:w-auto">Empezar ahora</Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 px-5 py-8 text-center text-suave">
        <nav aria-label="Información legal" className="mb-3 flex flex-wrap justify-center gap-x-6 gap-y-1">
          <Link href="/terminos" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">Términos y condiciones</Link>
          <Link href="/privacidad" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">Política de privacidad</Link>
          <Link href="/suscripcion" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">Botón de arrepentimiento</Link>
          <Link href="/suscripcion" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-2">Botón de baja</Link>
        </nav>
        Laburo · Hecho en Argentina
      </footer>
    </div>
  );
}
