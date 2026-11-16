import { createHmac, timingSafeEqual } from "node:crypto";
import { headers } from "next/headers";
import { ejecutar } from "./db";
import type { Negocio } from "./datos";

/**
 * Prueba gratis y suscripción mensual con Mercado Pago.
 *
 * El cobro se activa solo cuando está configurado MP_ACCESS_TOKEN.
 * Sin esa variable (por ejemplo en tu computadora) todo queda libre y nadie se bloquea.
 */

export const DIAS_PRUEBA = Number(process.env.DIAS_PRUEBA) || 14;
export const PRECIO_MENSUAL = Number(process.env.PRECIO_MENSUAL) || 15000;

export function cobroActivo() {
  return !!process.env.MP_ACCESS_TOKEN;
}

export type Acceso = {
  /** libre: no se cobra · prueba · activa · vencida (terminó la prueba o dejó de pagar) */
  estado: "libre" | "prueba" | "activa" | "vencida";
  /** Días de prueba que quedan (0 si ya terminó). */
  diasPrueba: number;
  /** Con la cuenta vencida se puede mirar todo, pero no cargar cosas nuevas. */
  puedeEscribir: boolean;
};

export function acceso(negocio: Negocio): Acceso {
  const alta = new Date(`${(negocio.creado ?? "").replace(" ", "T")}Z`).getTime();
  const fin = (Number.isFinite(alta) ? alta : Date.now()) + DIAS_PRUEBA * 86400_000;
  const diasPrueba = Math.max(Math.ceil((fin - Date.now()) / 86400_000), 0);

  if (!cobroActivo()) return { estado: "libre", diasPrueba, puedeEscribir: true };
  if (negocio.suscripcion_estado === "activa") return { estado: "activa", diasPrueba, puedeEscribir: true };
  if (diasPrueba > 0) return { estado: "prueba", diasPrueba, puedeEscribir: true };
  return { estado: "vencida", diasPrueba: 0, puedeEscribir: false };
}

/** Dirección pública del sitio (para links en emails y la vuelta desde Mercado Pago). */
export async function urlBase() {
  if (process.env.URL_PUBLICA) return process.env.URL_PUBLICA.replace(/\/$/, "");
  const h = await headers();
  return `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
}

/* ───────────── Mercado Pago ───────────── */

type Preapproval = { id: string; status: string; init_point?: string; external_reference?: string };

async function mp<T>(ruta: string, metodo = "GET", cuerpo?: unknown): Promise<T> {
  const r = await fetch(`https://api.mercadopago.com${ruta}`, {
    method: metodo,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  if (!r.ok) {
    console.error(`[Mercado Pago] ${metodo} ${ruta} respondió ${r.status}: ${(await r.text()).slice(0, 400)}`);
    throw new Error(`Mercado Pago respondió ${r.status}`);
  }
  return (await r.json()) as T;
}

/** Crea la suscripción mensual y devuelve el link donde el usuario carga su medio de pago. */
export async function crearSuscripcionMP(negocio: Negocio, emailMercadoPago: string) {
  const s = await mp<Preapproval>("/preapproval", "POST", {
    reason: "Suscripción mensual a Laburo",
    external_reference: negocio.id,
    payer_email: emailMercadoPago,
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: PRECIO_MENSUAL,
      currency_id: "ARS",
    },
    back_url: `${await urlBase()}/suscripcion`,
    status: "pending",
  });
  await ejecutar("UPDATE negocios SET suscripcion_id = ?, suscripcion_estado = 'pendiente' WHERE id = ?", [
    s.id,
    negocio.id,
  ]);
  return s.init_point ?? null;
}

const ESTADOS: Record<string, string> = {
  authorized: "activa",
  paused: "pausada",
  cancelled: "cancelada",
  pending: "pendiente",
};

/**
 * Le pregunta a Mercado Pago cómo está una suscripción y lo guarda.
 * Nunca confía en lo que diga un aviso: siempre consulta con la credencial propia.
 */
export async function sincronizarSuscripcion(suscripcionId: string) {
  if (!cobroActivo() || !/^[a-zA-Z0-9]{8,64}$/.test(suscripcionId)) return null;
  const s = await mp<Preapproval>(`/preapproval/${suscripcionId}`);
  const estado = ESTADOS[s.status] ?? "pendiente";
  if (s.external_reference) {
    // Solo actualiza si esa suscripción es la que el negocio tiene registrada.
    await ejecutar("UPDATE negocios SET suscripcion_estado = ? WHERE id = ? AND suscripcion_id = ?", [
      estado,
      s.external_reference,
      s.id,
    ]);
  }
  return estado;
}

export async function cancelarSuscripcionMP(negocio: Negocio) {
  if (negocio.suscripcion_id) {
    await mp(`/preapproval/${negocio.suscripcion_id}`, "PUT", { status: "cancelled" });
  }
  await ejecutar("UPDATE negocios SET suscripcion_estado = 'cancelada' WHERE id = ?", [negocio.id]);
}

/** Verifica la firma de un aviso de Mercado Pago (si está configurado MP_WEBHOOK_SECRET). */
export function firmaValida(firma: string | null, idPedido: string | null, idDato: string) {
  const secreto = process.env.MP_WEBHOOK_SECRET;
  if (!secreto) return true;
  const partes = Object.fromEntries((firma ?? "").split(",").map((p) => p.trim().split("=")));
  if (!partes.ts || !partes.v1) return false;
  const texto = `id:${idDato.toLowerCase()};request-id:${idPedido ?? ""};ts:${partes.ts};`;
  const esperado = createHmac("sha256", secreto).update(texto).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(String(partes.v1));
  return a.length === b.length && timingSafeEqual(a, b);
}
