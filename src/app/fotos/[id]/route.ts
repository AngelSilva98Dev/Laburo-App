import { sesionActual } from "@/lib/auth";
import { respuestaFoto } from "@/lib/fotos";

/** Foto de un trabajo, solo para el negocio dueño. */
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await sesionActual();
  if (!s) return new Response("No autorizado", { status: 401 });
  const { id } = await params;
  return respuestaFoto("SELECT datos FROM fotos WHERE id = ? AND negocio_id = ?", [id, s.negocio.id]);
}
