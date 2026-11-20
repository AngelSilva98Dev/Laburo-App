import { avisar } from "./avisos";
import type { Negocio } from "./datos";
import { ejecutar, filas } from "./db";
import { enviarEmail } from "./email";
import { dinero } from "./formato";
import { acceso, cobroActivo, DIAS_PRUEBA, PRECIO_MENSUAL, urlBase } from "./suscripcion";

/**
 * Tareas que corren una vez por día (ver src/app/api/cron/diario/route.ts y vercel.json).
 *
 * Aviso de fin de la prueba gratis: 3 días antes, el último día y cuando terminó.
 * Cada aviso se manda una sola vez (queda anotado en negocios.aviso_prueba),
 * aunque la tarea corra varias veces o se saltee un día.
 */
export async function avisarFinDePrueba() {
  if (!cobroActivo()) return { enviados: 0, motivo: "El cobro no está activo: nadie se bloquea, no hace falta avisar." };

  const negocios = await filas<Negocio & { aviso_prueba: string }>(
    `SELECT * FROM negocios
     WHERE COALESCE(suscripcion_estado, '') <> 'activa'
       AND creado > datetime('now', ?)`,
    [`-${DIAS_PRUEBA + 10} days`],
  );
  const base = await urlBase();
  const precio = dinero(PRECIO_MENSUAL);
  let enviados = 0;

  for (const n of negocios) {
    const plan = acceso(n);
    const dias = plan.diasPrueba;
    const ya = n.aviso_prueba ?? "";

    let hito: "3" | "1" | "0" | null = null;
    if (dias === 0 && ya !== "0") hito = "0";
    else if (dias === 1 && ya !== "1" && ya !== "0") hito = "1";
    else if (dias > 1 && dias <= 3 && ya === "") hito = "3";
    if (!hito) continue;

    const titulo =
      hito === "0"
        ? "Terminó tu prueba gratis de Laburo"
        : hito === "1"
          ? "Mañana termina tu prueba gratis"
          : `Te quedan ${dias} días de prueba gratis`;
    const texto =
      hito === "0"
        ? `Tus clientes, presupuestos y cobros siguen guardados. Para seguir cargando, activá tu suscripción por ${precio} por mes.`
        : `Para seguir usando Laburo sin cortes, activá tu suscripción por ${precio} por mes. Te lleva un minuto con Mercado Pago.`;

    // Primero se anota, así un error al enviar no hace que se repita mañana.
    await ejecutar("UPDATE negocios SET aviso_prueba = ? WHERE id = ?", [hito, n.id]);
    await avisar(n.id, { tipo: "prueba", titulo, texto, enlace: "/suscripcion" }, { respaldoEmail: false });

    const usuarios = await filas<{ email: string; nombre: string }>(
      "SELECT email, nombre FROM usuarios WHERE negocio_id = ? AND email NOT LIKE '%@ejemplo.laburo'",
      [n.id],
    );
    for (const u of usuarios) {
      await enviarEmail({
        para: u.email,
        asunto: titulo,
        texto: `Hola ${u.nombre}:\n\n${texto}\n\nActivala acá: ${base}/suscripcion\n\nPodés darte de baja cuando quieras, desde la misma pantalla.\n\nGracias por probar Laburo.`,
      });
    }
    enviados++;
  }
  return { enviados };
}
