import { firmaValida, sincronizarSuscripcion } from "@/lib/suscripcion";

/**
 * Avisos de Mercado Pago (webhook).
 * Se configura en "Tus integraciones → Webhooks" apuntando a https://TU-DOMINIO/api/mercadopago
 * con el evento de suscripciones. Cuando una suscripción se autoriza, se pausa o se cancela,
 * Mercado Pago avisa acá y se actualiza el estado del negocio.
 */
export async function POST(pedido: Request) {
  const url = new URL(pedido.url);
  let cuerpo: { type?: string; data?: { id?: string | number } } = {};
  try {
    cuerpo = await pedido.json();
  } catch {}

  const tipo = cuerpo.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic") ?? "";
  const id = String(url.searchParams.get("data.id") ?? cuerpo.data?.id ?? url.searchParams.get("id") ?? "");

  if (!firmaValida(pedido.headers.get("x-signature"), pedido.headers.get("x-request-id"), id)) {
    return Response.json({ error: "firma inválida" }, { status: 401 });
  }

  if (tipo === "subscription_preapproval" && id) {
    try {
      await sincronizarSuscripcion(id);
    } catch {
      // Si Mercado Pago no responde, devolvemos error para que reintente más tarde.
      return Response.json({ error: "no se pudo sincronizar" }, { status: 502 });
    }
  }
  return Response.json({ ok: true });
}
