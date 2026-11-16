import type { Metadata } from "next";
import Link from "next/link";
import { dinero } from "@/lib/formato";
import { LEGAL_VIGENCIA, TITULAR } from "@/lib/legal";
import { DIAS_PRUEBA, PRECIO_MENSUAL } from "@/lib/suscripcion";

export const metadata: Metadata = { title: "Términos y condiciones" };

/**
 * BORRADOR. Texto base redactado para Argentina; tiene que revisarlo un abogado
 * antes de publicar el servicio y empezar a cobrar.
 */
export default function Terminos() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Términos y condiciones</h1>
      <p className="text-suave">Vigentes desde el {LEGAL_VIGENCIA}.</p>

      <h2>1. Quiénes somos</h2>
      <p>
        Laburo es un servicio por internet para que trabajadores de oficios y servicios organicen sus presupuestos, su agenda y sus cobros. El titular del servicio es {TITULAR.nombre}, CUIT {TITULAR.cuit}, con domicilio en {TITULAR.domicilio}. Podés escribirnos a {TITULAR.email}.
      </p>

      <h2>2. Aceptación</h2>
      <p>
        Al crear una cuenta aceptás estos términos y la <Link href="/privacidad" className="font-semibold text-marca-700 underline">Política de privacidad</Link>. Si no estás de acuerdo, no uses el servicio. Tenés que ser mayor de 18 años.
      </p>

      <h2>3. Tu cuenta</h2>
      <ul>
        <li>Los datos que cargues al registrarte tienen que ser verdaderos.</li>
        <li>Sos responsable de cuidar tu contraseña y de lo que se haga desde tu cuenta.</li>
        <li>Si creés que alguien entró a tu cuenta sin permiso, avisanos enseguida.</li>
      </ul>

      <h2>4. Prueba gratis y precio</h2>
      <ul>
        <li>Al registrarte tenés {DIAS_PRUEBA} días de prueba gratis, sin cargar un medio de pago.</li>
        <li>Terminada la prueba, para seguir cargando información necesitás una suscripción mensual de {dinero(PRECIO_MENSUAL)} (pesos argentinos, precio final).</li>
        <li>La suscripción se cobra por mes adelantado a través de Mercado Pago, con el medio de pago que elijas ahí, y se renueva sola cada mes hasta que te des de baja.</li>
        <li>Si cambiamos el precio, te avisamos por email y dentro del servicio con al menos 30 días de anticipación. Si no estás de acuerdo, podés darte de baja antes de que rija el precio nuevo.</li>
        <li>Si un pago no se puede cobrar, la suscripción queda sin efecto hasta que se regularice. Tus datos no se borran por eso.</li>
      </ul>

      <h2>5. Baja y arrepentimiento</h2>
      <ul>
        <li>Podés darte de baja cuando quieras, sin costo y sin dar explicaciones, desde <Link href="/suscripcion" className="font-semibold text-marca-700 underline">Suscripción</Link> → “Dar de baja mi suscripción”. También podés cancelarla desde tu cuenta de Mercado Pago.</li>
        <li>La baja evita los cobros futuros. El mes ya pagado no se reintegra, salvo en el caso del punto siguiente.</li>
        <li>
          <strong>Derecho de arrepentimiento:</strong> como contrataste por internet, tenés 10 días corridos desde la contratación para arrepentirte sin costo (art. 34 de la Ley 24.240 y art. 1110 del Código Civil y Comercial). Date de baja desde el servicio o escribinos a {TITULAR.email} y te devolvemos lo que hayas pagado.
        </li>
      </ul>

      <h2>6. Qué es Laburo y qué no es</h2>
      <ul>
        <li>Los presupuestos y los detalles de pago que genera Laburo son documentos internos entre vos y tu cliente. <strong>No son facturas ni comprobantes fiscales.</strong> Emitir las facturas que correspondan ante ARCA sigue siendo responsabilidad tuya.</li>
        <li>Laburo no es parte de la relación entre vos y tus clientes: no cobra por vos, no recibe ni guarda el dinero de tus trabajos y no garantiza que tus clientes te paguen.</li>
        <li>Los mensajes de WhatsApp los enviás vos, desde tu propio WhatsApp.</li>
      </ul>

      <h2>7. Uso correcto</h2>
      <p>No podés usar Laburo para actividades ilegales, para enviar mensajes no deseados, para cargar datos de personas sin tener derecho a hacerlo, ni para intentar entrar a cuentas ajenas o afectar el funcionamiento del servicio. Si pasa, podemos suspender la cuenta.</p>

      <h2>8. Tu información</h2>
      <p>
        Lo que cargás (clientes, presupuestos, trabajos, cobros) es tuyo. Lo usamos solamente para darte el servicio, como explica la <Link href="/privacidad" className="font-semibold text-marca-700 underline">Política de privacidad</Link>. Si cerrás tu cuenta, podés pedirnos una copia de tus datos antes de que los eliminemos.
      </p>

      <h2>9. Disponibilidad y responsabilidad</h2>
      <p>
        Trabajamos para que Laburo funcione siempre, pero puede haber interrupciones por mantenimiento o por fallas de terceros (internet, servidores, Mercado Pago, WhatsApp). Te recomendamos conservar por tu cuenta la información importante. En la medida en que la ley lo permita, nuestra responsabilidad se limita a lo que hayas pagado por el servicio en los últimos tres meses. Nada de esto limita los derechos que te da la Ley de Defensa del Consumidor.
      </p>

      <h2>10. Cambios en estos términos</h2>
      <p>Podemos actualizar estos términos. Si el cambio es importante, te avisamos por email o dentro del servicio con al menos 30 días de anticipación.</p>

      <h2>11. Ley aplicable y reclamos</h2>
      <p>
        Estos términos se rigen por las leyes de la República Argentina. Ante cualquier problema, escribinos primero a {TITULAR.email}. Como consumidor también podés reclamar ante la autoridad de Defensa del Consumidor de tu jurisdicción y en la Ventanilla Única Federal de Defensa del Consumidor (www.argentina.gob.ar/servicio/iniciar-un-reclamo-ante-defensa-de-las-y-los-consumidores).
      </p>
    </>
  );
}
