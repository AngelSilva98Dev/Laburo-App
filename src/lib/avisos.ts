import { after } from "next/server";
import * as webpush from "web-push";
import { ejecutar, fila, filas, nuevoId } from "./db";
import { enviarEmail } from "./email";
import { urlBase } from "./suscripcion";

/**
 * Avisos para el trabajador: "Laura aceptó tu presupuesto", "Carlos dice que ya te pagó"…
 *
 * 1. Siempre quedan guardados y se ven en Inicio.
 * 2. Además se mandan como notificación a cada celular o computadora donde los activó.
 * 3. Si no activó notificaciones en ningún lado, le llega un email (cuando Resend está configurado).
 */

export type Aviso = { id: string; tipo: string; titulo: string; texto: string; enlace: string; creado: string };

/* ───────────── Claves para notificaciones (VAPID) ───────────── */

type Claves = { publica: string; privada: string };
const g = globalThis as unknown as { __clavesPush?: Promise<Claves> };

/**
 * Usa VAPID_PUBLIC_KEY y VAPID_PRIVATE_KEY si están configuradas.
 * Si no, las genera una vez y las guarda en la base, así funciona sin configurar nada.
 */
export function clavesPush(): Promise<Claves> {
  if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    return Promise.resolve({ publica: process.env.VAPID_PUBLIC_KEY, privada: process.env.VAPID_PRIVATE_KEY });
  }
  g.__clavesPush ??= (async () => {
    const guardadas = await fila<{ valor: string }>("SELECT valor FROM ajustes WHERE clave = 'vapid'");
    if (guardadas) return JSON.parse(guardadas.valor) as Claves;
    const nuevas = webpush.generateVAPIDKeys();
    await ejecutar("INSERT OR IGNORE INTO ajustes (clave, valor) VALUES ('vapid', ?)", [
      JSON.stringify({ publica: nuevas.publicKey, privada: nuevas.privateKey }),
    ]);
    // Si dos pedidos las generaron a la vez, gana la primera que se guardó.
    const final = await fila<{ valor: string }>("SELECT valor FROM ajustes WHERE clave = 'vapid'");
    return JSON.parse(final!.valor) as Claves;
  })().catch((e) => {
    g.__clavesPush = undefined;
    throw e;
  });
  return g.__clavesPush;
}

function contactoPush() {
  if (process.env.VAPID_SUBJECT) return process.env.VAPID_SUBJECT;
  if (process.env.EMAIL_CONTACTO) return `mailto:${process.env.EMAIL_CONTACTO}`;
  if (process.env.URL_PUBLICA?.startsWith("https://")) return process.env.URL_PUBLICA;
  return "mailto:avisos@laburo.invalid";
}

/* ───────────── Enviar ───────────── */

type Suscripcion = { endpoint: string; p256dh: string; auth: string };

async function enviarPush(negocioId: string, datos: { title: string; body: string; url: string; tag: string }) {
  const subs = await filas<Suscripcion>(
    "SELECT endpoint, p256dh, auth FROM push_suscripciones WHERE negocio_id = ?",
    [negocioId],
  );
  if (!subs.length) return 0;

  const { publica, privada } = await clavesPush();
  let enviadas = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(datos),
          { TTL: 60 * 60 * 24, urgency: "high", vapidDetails: { subject: contactoPush(), publicKey: publica, privateKey: privada } },
        );
        enviadas++;
      } catch (e) {
        const estado = (e as { statusCode?: number }).statusCode;
        // 404 / 410: ese celular ya no acepta avisos (desinstaló o los apagó). Se borra.
        if (estado === 404 || estado === 410) {
          await ejecutar("DELETE FROM push_suscripciones WHERE endpoint = ?", [s.endpoint]);
        } else {
          console.error(`[Avisos] No se pudo mandar la notificación (${estado ?? "sin respuesta"})`);
        }
      }
    }),
  );
  return enviadas;
}

/**
 * Guarda el aviso y lo manda al celular. El envío corre después de responder,
 * para que el cliente que tocó "Aceptar" no tenga que esperar.
 */
export async function avisar(
  negocioId: string,
  aviso: { tipo: string; titulo: string; texto: string; enlace: string },
  { respaldoEmail = true }: { respaldoEmail?: boolean } = {},
) {
  await ejecutar(
    "INSERT INTO avisos (id, negocio_id, tipo, titulo, texto, enlace) VALUES (?, ?, ?, ?, ?, ?)",
    [nuevoId(), negocioId, aviso.tipo, aviso.titulo, aviso.texto, aviso.enlace],
  );
  const base = await urlBase();

  after(async () => {
    try {
      const enviadas = await enviarPush(negocioId, {
        title: aviso.titulo,
        body: aviso.texto,
        url: aviso.enlace,
        tag: `${aviso.tipo}:${aviso.enlace}`,
      });
      if (enviadas > 0 || !respaldoEmail) return;
      // Sin notificaciones activas: respaldo por email.
      const usuarios = await filas<{ email: string; nombre: string }>(
        "SELECT email, nombre FROM usuarios WHERE negocio_id = ? AND email NOT LIKE '%@ejemplo.laburo'",
        [negocioId],
      );
      for (const u of usuarios) {
        await enviarEmail({
          para: u.email,
          asunto: aviso.titulo,
          texto: `Hola ${u.nombre}:\n\n${aviso.texto}\n\nMiralo acá: ${base}${aviso.enlace}\n\nPara recibir estos avisos directo en tu celular, entrá a Laburo → Más → Avisos en el celular.\n\nLaburo`,
        });
      }
    } catch (e) {
      console.error("[Avisos] Error al enviar:", e);
    }
  });
}

/** Notificación de prueba, para que el trabajador vea cómo le llegan. */
export function avisoDePrueba(negocioId: string) {
  return enviarPush(negocioId, {
    title: "¡Listo! Los avisos funcionan",
    body: "Así te vas a enterar cuando un cliente acepte un presupuesto o te avise que pagó.",
    url: "/inicio",
    tag: "prueba",
  });
}

/* ───────────── Leer ───────────── */

/** Los de fin de prueba no se listan: Inicio ya muestra su propio cartel. */
export function avisosSinLeer(negocioId: string) {
  return filas<Aviso>(
    `SELECT id, tipo, titulo, texto, enlace, creado FROM avisos
     WHERE negocio_id = ? AND leido = 0 AND tipo <> 'prueba' ORDER BY creado DESC LIMIT 8`,
    [negocioId],
  );
}

/** Al abrir el presupuesto o cobro del aviso, el aviso se da por visto. */
export function marcarVistos(negocioId: string, enlace: string) {
  return ejecutar("UPDATE avisos SET leido = 1 WHERE negocio_id = ? AND enlace = ? AND leido = 0", [negocioId, enlace]);
}
