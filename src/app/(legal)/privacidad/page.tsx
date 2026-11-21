import type { Metadata } from "next";
import { identificacion, LEGAL_VIGENCIA, TITULAR } from "@/lib/legal";

export const metadata: Metadata = { title: "Política de privacidad" };

/**
 * BORRADOR. Texto base según la Ley 25.326 de Protección de Datos Personales;
 * tiene que revisarlo un abogado antes de publicar el servicio.
 */
export default function Privacidad() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Política de privacidad</h1>
      <p className="text-suave">Vigente desde el {LEGAL_VIGENCIA}.</p>

      <h2>1. Quién es el responsable</h2>
      <p>
        {identificacion("El responsable de los datos es")} Para cualquier consulta sobre tus datos, escribinos a {TITULAR.email}.
      </p>

      <h2>2. Qué datos guardamos</h2>
      <ul>
        <li><strong>De tu cuenta:</strong> tu nombre, tu email y tu contraseña (guardada cifrada: nadie puede leerla, ni nosotros).</li>
        <li><strong>De tu negocio:</strong> nombre, teléfono, dirección, CUIT, condición frente al IVA, alias o CVU y link de pago, si los cargás.</li>
        <li><strong>De tus clientes:</strong> los datos que vos cargues (nombre, teléfono, dirección, email, CUIT o DNI, notas) y los presupuestos, trabajos, cobros y pagos relacionados.</li>
        <li><strong>De uso:</strong> una cookie de sesión para mantenerte conectado y registros técnicos básicos para la seguridad del servicio.</li>
      </ul>
      <p>No guardamos datos de tarjetas ni de cuentas bancarias: los pagos de la suscripción los procesa Mercado Pago.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Para darte el servicio: mostrarte tu información, armar tus presupuestos y cobros y generar los links que les mandás a tus clientes.</li>
        <li>Para administrar tu cuenta y tu suscripción, y para escribirte por temas del servicio (por ejemplo, recuperar tu contraseña o avisarte de un cambio de precio).</li>
        <li>Para cuidar la seguridad del servicio y cumplir con obligaciones legales.</li>
      </ul>
      <p>No vendemos tus datos ni los de tus clientes, y no los usamos para publicidad de terceros.</p>

      <h2>4. Los datos de tus clientes</h2>
      <p>
        Los datos de tus clientes los cargás vos y los tratamos solamente por tu encargo, para prestarte el servicio (art. 25 de la Ley 25.326). Vos sos responsable de tener derecho a usarlos y de informarles a tus clientes, si corresponde. No contactamos a tus clientes por nuestra cuenta.
      </p>
      <p>
        Cuando le mandás a un cliente el link de un presupuesto o de un cobro, cualquier persona que tenga ese link puede ver ese documento. Compartilo solo con quien corresponda.
      </p>

      <h2>5. Con quién los compartimos</h2>
      <p>Solo con los proveedores que necesitamos para funcionar, y solo en la medida necesaria:</p>
      <ul>
        <li>Alojamiento del sitio y de la base de datos (Vercel y Turso), cuyos servidores pueden estar fuera de la Argentina.</li>
        <li>Mercado Pago, para cobrar la suscripción.</li>
        <li>Un servicio de envío de emails (Resend), para mensajes como el de recuperación de contraseña.</li>
      </ul>
      <p>También podemos entregar información si lo exige una autoridad competente con una orden válida.</p>

      <h2>6. Cuánto tiempo los guardamos</h2>
      <p>Mientras tengas tu cuenta. Si pedís que la cerremos, eliminamos tus datos y los de tus clientes dentro de los 30 días, salvo lo que la ley nos obligue a conservar.</p>

      <h2>7. Cómo los cuidamos</h2>
      <p>La conexión es cifrada (https), las contraseñas se guardan cifradas, cada negocio ve únicamente su propia información y limitamos los intentos de ingreso. Ningún sistema es infalible: si detectamos un incidente que afecte tus datos, te vamos a avisar.</p>

      <h2>8. Tus derechos</h2>
      <p>
        Podés pedir en cualquier momento acceder a tus datos, corregirlos, actualizarlos o que los eliminemos, escribiendo a {TITULAR.email}. Te respondemos dentro de los plazos de la ley (10 días corridos para el acceso y 5 días hábiles para corregir o eliminar). Muchos datos también los podés cambiar vos desde “Mi negocio” y desde la ficha de cada cliente.
      </p>
      <p>
        El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto, conforme lo establecido en el artículo 14, inciso 3 de la Ley N° 25.326.
      </p>
      <p>
        La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
      </p>

      <h2>9. Cookies</h2>
      <p>Usamos una sola cookie, necesaria para mantener tu sesión iniciada. No usamos cookies de publicidad ni de seguimiento.</p>

      <h2>10. Cambios</h2>
      <p>Si cambiamos esta política de forma importante, te avisamos por email o dentro del servicio antes de que rija.</p>
    </>
  );
}
