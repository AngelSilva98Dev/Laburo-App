import { fila, filas } from "./db";
import type { Doc } from "./datos";

/** Fotos de antes y después de cada trabajo. Se guardan achicadas (JPEG de ~300 KB) en la base. */

export const MAX_FOTOS_POR_TRABAJO = 12;
export const MAX_BYTES_FOTO = 1_500_000;

export type Foto = { id: string; etapa: "antes" | "despues"; creado: string };

export function fotosDeTrabajo(negocioId: string, trabajoId: string) {
  return filas<Foto>(
    "SELECT id, etapa, creado FROM fotos WHERE negocio_id = ? AND trabajo_id = ? ORDER BY creado",
    [negocioId, trabajoId],
  );
}

/** El trabajo al que corresponde un cobro: el suyo, o el agendado desde su presupuesto. */
export async function trabajoDeDoc(doc: Pick<Doc, "negocio_id" | "trabajo_id" | "origen_id">) {
  if (doc.trabajo_id) return doc.trabajo_id;
  if (!doc.origen_id) return null;
  const t = await fila<{ id: string }>("SELECT id FROM trabajos WHERE negocio_id = ? AND presupuesto_id = ?", [
    doc.negocio_id,
    doc.origen_id,
  ]);
  return t?.id ?? null;
}

/** Devuelve la foto como respuesta HTTP (o 404). */
export async function respuestaFoto(sql: string, args: string[]) {
  const f = await fila<{ datos: ArrayBuffer }>(sql, args);
  if (!f) return new Response("No encontrada", { status: 404 });
  return new Response(f.datos, {
    headers: {
      "Content-Type": "image/jpeg",
      // Las fotos no cambian nunca: se pueden guardar en el celular.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
