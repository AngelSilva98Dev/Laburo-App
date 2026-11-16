import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado } from "@/components/ui";

export const metadata: Metadata = { title: "Ayuda" };

const PASOS: { titulo: string; texto: string; href: string; boton: string }[] = [
  {
    titulo: "Hacé un presupuesto",
    texto: "Elegí el cliente (o cargalo ahí mismo), escribí qué incluye y cuánto sale. El total se calcula solo.",
    href: "/presupuestos/nuevo",
    boton: "Hacer un presupuesto",
  },
  {
    titulo: "Mandalo por WhatsApp",
    texto: "Tocá “Enviar por WhatsApp”. Se abre el chat con el mensaje ya escrito y un link. Tu cliente lo abre y toca “Aceptar”.",
    href: "/presupuestos",
    boton: "Ver mis presupuestos",
  },
  {
    titulo: "Agendá el trabajo",
    texto: "Cuando el cliente acepta, tocá “Agendar el trabajo” y elegí día y hora. Lo vas a ver en tu agenda.",
    href: "/agenda",
    boton: "Ver mi agenda",
  },
  {
    titulo: "Terminá y cobrá",
    texto: "Al terminar, tocá “Cobrar este trabajo”. Podés anotar una seña, pagos en partes y ver cuánto falta.",
    href: "/cobros",
    boton: "Ver mis cobros",
  },
];

const PREGUNTAS: [string, string][] = [
  [
    "¿Esto reemplaza la factura?",
    "No. Los presupuestos y cobros de Laburo son comprobantes internos, no son facturas. Si tenés que facturar, seguí haciéndolo como siempre (por ejemplo, desde la web o la app de ARCA).",
  ],
  [
    "¿Mi cliente necesita bajar algo?",
    "No. Le llega un link por WhatsApp y lo abre desde cualquier celular, sin crear cuenta.",
  ],
  [
    "¿Puedo usarlo en el celular como una aplicación?",
    "Sí. Abrí el menú de tu navegador (los tres puntitos en Chrome, o Compartir en iPhone) y tocá “Agregar a la pantalla de inicio”.",
  ],
  [
    "¿Cómo actualizo los precios cuando sube todo?",
    "Entrá a Lista de precios y usá “Actualizar todos los precios juntos”. Ponés el porcentaje y listo.",
  ],
  ["¿Puedo presupuestar en dólares?", "Sí. Al armar el presupuesto, abrí “Más opciones” y elegí dólares."],
];

export default function Ayuda() {
  return (
    <>
      <Encabezado titulo="Ayuda" bajada="Laburo en 4 pasos." />
      <ol className="space-y-3">
        {PASOS.map((p, i) => (
          <li key={p.titulo} className="tarjeta flex gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-marca-600 text-lg font-bold text-white">
              {i + 1}
            </span>
            <div>
              <h2 className="text-lg font-bold">{p.titulo}</h2>
              <p className="mt-1 text-suave">{p.texto}</p>
              <Link href={p.href} className="mt-2 inline-flex min-h-11 items-center font-semibold text-marca-700 underline underline-offset-2">
                {p.boton}
              </Link>
            </div>
          </li>
        ))}
      </ol>

      <h2 className="mt-8 mb-2 text-lg font-bold">Preguntas comunes</h2>
      <div className="lista">
        {PREGUNTAS.map(([pregunta, respuesta]) => (
          <details key={pregunta} className="desplegable px-4">
            <summary className="py-2">{pregunta}</summary>
            <p className="pb-4 text-suave">{respuesta}</p>
          </details>
        ))}
      </div>
    </>
  );
}
