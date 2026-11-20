import { connection } from "next/server";
import { docPorToken } from "@/lib/datos";
import { respuestaFoto, trabajoDeDoc } from "@/lib/fotos";

/** Foto del trabajo, para el cliente que tiene el link del cobro. Solo fotos de ese trabajo. */
export async function GET(_: Request, { params }: { params: Promise<{ token: string; id: string }> }) {
  await connection();
  const { token, id } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) return new Response("No encontrada", { status: 404 });
  const doc = await docPorToken(token);
  if (!doc || doc.tipo !== "cobro") return new Response("No encontrada", { status: 404 });
  const trabajoId = await trabajoDeDoc(doc);
  if (!trabajoId) return new Response("No encontrada", { status: 404 });
  return respuestaFoto("SELECT datos FROM fotos WHERE id = ? AND trabajo_id = ? AND negocio_id = ? AND etapa = 'despues'", [
    id,
    trabajoId,
    doc.negocio_id,
  ]);
}
