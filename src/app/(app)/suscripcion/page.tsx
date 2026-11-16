import type { Metadata } from "next";
import Link from "next/link";
import { BotonAccion, Formulario } from "@/components/formulario";
import { Encabezado, Icono, TituloSeccion } from "@/components/ui";
import { cancelarSuscripcion, suscribirse } from "@/lib/acciones";
import { requerirSesion, sesionFresca } from "@/lib/auth";
import { dinero } from "@/lib/formato";
import { acceso, cobroActivo, DIAS_PRUEBA, PRECIO_MENSUAL, sincronizarSuscripcion } from "@/lib/suscripcion";

export const metadata: Metadata = { title: "Suscripción" };

const INCLUYE = [
  "Presupuestos y cobros sin límite",
  "Envío por WhatsApp y link para tu cliente",
  "Agenda de trabajos",
  "Lista de precios con aumento en un paso",
];

export default async function Suscripcion({
  searchParams,
}: {
  searchParams: Promise<{ cancelada?: string; error?: string }>;
}) {
  let { negocio, usuario } = await requerirSesion();
  const { cancelada, error } = await searchParams;

  // Al volver de Mercado Pago, confirma con ellos cómo quedó la suscripción.
  if (cobroActivo() && negocio.suscripcion_id && negocio.suscripcion_estado !== "cancelada") {
    try {
      const estado = await sincronizarSuscripcion(negocio.suscripcion_id);
      if (estado && estado !== negocio.suscripcion_estado) ({ negocio, usuario } = await sesionFresca());
    } catch {}
  }

  const plan = acceso(negocio);
  const precio = dinero(PRECIO_MENSUAL);

  return (
    <>
      <Encabezado titulo="Suscripción" />

      {cancelada && <p className="aviso-ok mb-4">Listo, diste de baja tu suscripción. No se te va a cobrar más.</p>}
      {error && (
        <p className="aviso-error mb-4" role="alert">
          No pudimos dar de baja la suscripción en este momento. Probá de nuevo en unos minutos o cancelala desde tu cuenta de Mercado Pago, en “Suscripciones”.
        </p>
      )}

      {/* Estado actual, en una frase */}
      <div
        className={`rounded-2xl p-5 ${
          plan.estado === "vencida" ? "border-2 border-red-200 bg-red-50 text-red-900" : "bg-marca-900 text-white"
        }`}
      >
        {plan.estado === "activa" && (
          <>
            <p className="flex items-center gap-2 text-xl font-bold"><Icono n="check" /> Tu suscripción está activa</p>
            <p className="mt-1 text-marca-100">Se cobra {precio} por mes con Mercado Pago.</p>
          </>
        )}
        {plan.estado === "prueba" && (
          <>
            <p className="text-xl font-bold">
              {plan.diasPrueba === 1 ? "Te queda 1 día de prueba gratis" : `Te quedan ${plan.diasPrueba} días de prueba gratis`}
            </p>
            <p className="mt-1 text-marca-100">Después, seguís usando Laburo por {precio} por mes.</p>
          </>
        )}
        {plan.estado === "vencida" && (
          <>
            <p className="text-xl font-bold">
              {negocio.suscripcion_estado === "cancelada" || negocio.suscripcion_estado === "pausada"
                ? "Tu suscripción no está activa"
                : "Tu prueba gratis terminó"}
            </p>
            <p className="mt-1">Todo lo que cargaste sigue guardado y lo podés ver. Para cargar cosas nuevas, activá tu suscripción.</p>
          </>
        )}
        {plan.estado === "libre" && (
          <>
            <p className="text-xl font-bold">Estás usando Laburo gratis</p>
            <p className="mt-1 text-marca-100">Por ahora no se cobra. Te vamos a avisar antes de cualquier cambio.</p>
          </>
        )}
      </div>

      {(plan.estado === "prueba" || plan.estado === "vencida") && (
        <div className="tarjeta mt-4 border-2 border-marca-200">
          <p className="text-suave">Plan mensual</p>
          <p className="text-3xl font-bold tracking-tight">
            {precio} <span className="text-lg font-semibold text-suave">por mes</span>
          </p>
          <ul className="my-4 space-y-2">
            {INCLUYE.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Icono n="check" className="mt-0.5 size-5 text-emerald-700" /> {t}
              </li>
            ))}
          </ul>
          <Formulario accion={suscribirse} boton="Suscribirme con Mercado Pago" className="space-y-4">
            <div>
              <label htmlFor="email_mp" className="etiqueta">Email de tu cuenta de Mercado Pago</label>
              <input id="email_mp" name="email_mp" type="email" inputMode="email" required className="campo" defaultValue={usuario.email} />
              <p className="ayuda">Tiene que ser el mismo email con el que entrás a Mercado Pago.</p>
            </div>
          </Formulario>
          <p className="ayuda mt-3">
            Te llevamos a Mercado Pago para que elijas cómo pagar. Se cobra una vez por mes y podés darte de baja cuando quieras, desde esta misma pantalla.
          </p>
        </div>
      )}

      {plan.estado === "activa" && (
        <>
          <TituloSeccion>Darte de baja</TituloSeccion>
          <div className="tarjeta">
            <p className="mb-4 text-suave">
              Si te das de baja no se te cobra más. Tus datos quedan guardados y los podés seguir viendo; para cargar cosas nuevas vas a tener que suscribirte de nuevo.
            </p>
            <form action={cancelarSuscripcion}>
              <BotonAccion className="btn btn-peligro w-full sm:w-auto" confirmar="¿Seguro que querés dar de baja tu suscripción?">
                Dar de baja mi suscripción
              </BotonAccion>
            </form>
          </div>
        </>
      )}

      <p className="mt-8 text-sm text-suave">
        La prueba gratis dura {DIAS_PRUEBA} días desde que creás la cuenta. Si te suscribiste por internet, tenés 10 días para arrepentirte sin costo dándote de baja desde acá. Más detalles en los{" "}
        <Link href="/terminos" className="font-semibold text-marca-700 underline underline-offset-2">Términos y condiciones</Link>.
      </p>
    </>
  );
}
