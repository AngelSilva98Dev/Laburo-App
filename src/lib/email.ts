/**
 * Envío de emails con Resend (https://resend.com).
 * Necesita RESEND_API_KEY y EMAIL_REMITENTE (por ejemplo "Laburo <hola@tudominio.com.ar>").
 * Sin configurar, el email no sale: el contenido se muestra en la consola del servidor,
 * que alcanza para probar en tu computadora.
 */
export async function enviarEmail({ para, asunto, texto }: { para: string; asunto: string; texto: string }) {
  const clave = process.env.RESEND_API_KEY;
  const remitente = process.env.EMAIL_REMITENTE;
  if (!clave || !remitente) {
    console.log(`\n[Email sin enviar: falta configurar Resend]\nPara: ${para}\nAsunto: ${asunto}\n${texto}\n`);
    return false;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    cache: "no-store",
    headers: { Authorization: `Bearer ${clave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: remitente, to: [para], subject: asunto, text: texto }),
  });
  if (!r.ok) console.error(`[Email] Resend respondió ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.ok;
}
