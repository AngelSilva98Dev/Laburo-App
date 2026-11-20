import { connection } from "next/server";
import { avisarFinDePrueba } from "@/lib/tareas";

/**
 * Tarea diaria. En Vercel la dispara el "cron" definido en vercel.json,
 * que manda el encabezado Authorization: Bearer <CRON_SECRET>.
 * En tu computadora (sin CRON_SECRET) se puede abrir a mano: /api/cron/diario
 */
export async function GET(pedido: Request) {
  await connection();
  const secreto = process.env.CRON_SECRET;
  const autorizado = secreto
    ? pedido.headers.get("authorization") === `Bearer ${secreto}`
    : process.env.NODE_ENV !== "production";
  if (!autorizado) return Response.json({ error: "no autorizado" }, { status: 401 });

  const prueba = await avisarFinDePrueba();
  return Response.json({ ok: true, prueba });
}
