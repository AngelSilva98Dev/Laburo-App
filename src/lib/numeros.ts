import { fila, filas } from "./db";

/** Números del negocio: lo cobrado por mes y por medio de pago. "Mes" = "AAAA-MM". */

export function sumarMeses(mes: string, n: number) {
  const [a, m] = mes.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1 + n, 1));
  return d.toISOString().slice(0, 7);
}

export function esMes(v: string | undefined): v is string {
  return !!v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v);
}

/** "noviembre de 2026" (o "noviembre" si se pide corto). */
export function nombreMes(mes: string, corto = false) {
  const [a, m] = mes.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    month: corto ? "short" : "long",
    ...(corto ? {} : { year: "numeric" }),
    timeZone: "UTC",
  })
    .format(new Date(Date.UTC(a, m - 1, 15)))
    .replace(".", "");
}

export type Fila = { mes: string; moneda: string; total: number; cantidad: number };

/** Lo cobrado (pagos anotados) por mes y moneda, desde un mes en adelante. */
export function cobradoPorMes(negocioId: string, desdeMes: string) {
  return filas<Fila>(
    `SELECT substr(p.fecha, 1, 7) AS mes, d.moneda, SUM(p.monto) AS total, COUNT(*) AS cantidad
     FROM pagos p JOIN documentos d ON d.id = p.doc_id
     WHERE p.negocio_id = ? AND p.fecha >= ?
     GROUP BY mes, d.moneda`,
    [negocioId, `${desdeMes}-01`],
  );
}

export function cobradoPorMedio(negocioId: string, mes: string) {
  return filas<{ medio: string; moneda: string; total: number; cantidad: number }>(
    `SELECT p.medio, d.moneda, SUM(p.monto) AS total, COUNT(*) AS cantidad
     FROM pagos p JOIN documentos d ON d.id = p.doc_id
     WHERE p.negocio_id = ? AND substr(p.fecha, 1, 7) = ?
     GROUP BY p.medio, d.moneda ORDER BY total DESC`,
    [negocioId, mes],
  );
}

export async function trabajosTerminados(negocioId: string, mes: string) {
  const r = await fila<{ n: number }>(
    "SELECT COUNT(*) AS n FROM trabajos WHERE negocio_id = ? AND estado = 'terminado' AND substr(fecha, 1, 7) = ?",
    [negocioId, mes],
  );
  return r?.n ?? 0;
}
