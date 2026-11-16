import { fila, filas } from "./db";

/** Consultas de lectura. Todas filtran por negocio: nadie ve datos de otro. */

export type Negocio = {
  id: string;
  nombre: string;
  rubro: string;
  telefono: string;
  direccion: string;
  cuit: string;
  condicion_iva: string;
  alias: string;
  link_pago: string;
  validez_dias: number;
  nota_pie: string;
  /** Fecha de alta, en UTC: "AAAA-MM-DD HH:MM:SS". De acá sale la prueba gratis. */
  creado: string;
  /** "" (nunca se suscribió), pendiente, activa, pausada o cancelada. */
  suscripcion_estado: string;
  suscripcion_id: string;
};

export type Cliente = {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  documento: string;
  notas: string;
};

export type Precio = { id: string; nombre: string; precio: number };

export type Trabajo = {
  id: string;
  cliente_id: string;
  presupuesto_id: string | null;
  titulo: string;
  descripcion: string;
  direccion: string;
  fecha: string | null;
  hora: string;
  estado: string;
  cliente_nombre: string;
  cliente_telefono: string;
};

export type Doc = {
  id: string;
  negocio_id: string;
  tipo: "presupuesto" | "cobro";
  numero: number;
  cliente_id: string;
  trabajo_id: string | null;
  origen_id: string | null;
  titulo: string;
  estado: string;
  fecha: string;
  vence: string | null;
  notas: string;
  descuento: number;
  iva_pct: number;
  subtotal: number;
  total: number;
  moneda: string;
  token: string;
  cliente_nombre: string;
  cliente_telefono: string;
  pagado: number;
};

export type Linea = { id: string; descripcion: string; cantidad: number; precio: number };
export type Pago = { id: string; monto: number; medio: string; fecha: string };

const SQL_DOC = `
  SELECT d.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono,
    COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.doc_id = d.id), 0) AS pagado
  FROM documentos d JOIN clientes c ON c.id = d.cliente_id`;

const SQL_TRABAJO = `
  SELECT t.*, c.nombre AS cliente_nombre, c.telefono AS cliente_telefono
  FROM trabajos t JOIN clientes c ON c.id = t.cliente_id`;

export function listarClientes(negocioId: string, buscar = "") {
  const b = `%${buscar.trim()}%`;
  return filas<Cliente>(
    `SELECT * FROM clientes WHERE negocio_id = ?
     AND (nombre LIKE ? OR telefono LIKE ? OR direccion LIKE ?)
     ORDER BY nombre COLLATE NOCASE`,
    [negocioId, b, b, b],
  );
}

export function obtenerCliente(negocioId: string, id: string) {
  return fila<Cliente>("SELECT * FROM clientes WHERE negocio_id = ? AND id = ?", [negocioId, id]);
}

export function listarPrecios(negocioId: string) {
  return filas<Precio>(
    "SELECT id, nombre, precio FROM precios WHERE negocio_id = ? ORDER BY nombre COLLATE NOCASE",
    [negocioId],
  );
}

export function listarDocs(negocioId: string, tipo: string, clienteId?: string) {
  return filas<Doc>(
    `${SQL_DOC} WHERE d.negocio_id = ? AND d.tipo = ? ${clienteId ? "AND d.cliente_id = ?" : ""}
     ORDER BY d.numero DESC`,
    clienteId ? [negocioId, tipo, clienteId] : [negocioId, tipo],
  );
}

export function obtenerDoc(negocioId: string, id: string) {
  return fila<Doc>(`${SQL_DOC} WHERE d.negocio_id = ? AND d.id = ?`, [negocioId, id]);
}

export function docPorToken(token: string) {
  return fila<Doc>(`${SQL_DOC} WHERE d.token = ?`, [token]);
}

export function lineasDe(docId: string) {
  return filas<Linea>(
    "SELECT id, descripcion, cantidad, precio FROM lineas WHERE doc_id = ? ORDER BY orden",
    [docId],
  );
}

export function pagosDe(docId: string) {
  return filas<Pago>(
    "SELECT id, monto, medio, fecha FROM pagos WHERE doc_id = ? ORDER BY fecha, creado",
    [docId],
  );
}

export function trabajosEntre(negocioId: string, desde: string, hasta: string) {
  return filas<Trabajo>(
    `${SQL_TRABAJO} WHERE t.negocio_id = ? AND t.fecha BETWEEN ? AND ?
     ORDER BY t.fecha, CASE WHEN t.hora = '' THEN '99' ELSE t.hora END`,
    [negocioId, desde, hasta],
  );
}

export function trabajosSinFecha(negocioId: string) {
  return filas<Trabajo>(
    `${SQL_TRABAJO} WHERE t.negocio_id = ? AND t.fecha IS NULL
     AND t.estado IN ('pendiente', 'en_curso') ORDER BY t.creado DESC`,
    [negocioId],
  );
}

export function trabajosDeCliente(negocioId: string, clienteId: string) {
  return filas<Trabajo>(
    `${SQL_TRABAJO} WHERE t.negocio_id = ? AND t.cliente_id = ?
     ORDER BY COALESCE(t.fecha, '9999') DESC`,
    [negocioId, clienteId],
  );
}

export function obtenerTrabajo(negocioId: string, id: string) {
  return fila<Trabajo>(`${SQL_TRABAJO} WHERE t.negocio_id = ? AND t.id = ?`, [negocioId, id]);
}

/** Cobro ya creado para un trabajo o presupuesto (para no cobrar dos veces lo mismo). */
export function cobroExistente(negocioId: string, campo: "trabajo_id" | "origen_id", id: string) {
  return fila<{ id: string }>(
    `SELECT id FROM documentos WHERE negocio_id = ? AND tipo = 'cobro' AND ${campo} = ?`,
    [negocioId, id],
  );
}

export function trabajoDePresupuesto(negocioId: string, presupuestoId: string) {
  return fila<{ id: string }>(
    "SELECT id FROM trabajos WHERE negocio_id = ? AND presupuesto_id = ?",
    [negocioId, presupuestoId],
  );
}

/** Números para la pantalla de inicio. */
export async function resumen(negocioId: string) {
  const [porCobrar, esperando, clientes] = await Promise.all([
    filas<{ moneda: string; saldo: number; cantidad: number }>(
      `SELECT moneda, SUM(saldo) AS saldo, COUNT(*) AS cantidad FROM (
         SELECT d.moneda, d.total - COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.doc_id = d.id), 0) AS saldo
         FROM documentos d WHERE d.negocio_id = ? AND d.tipo = 'cobro'
       ) WHERE saldo > 0.005 GROUP BY moneda`,
      [negocioId],
    ),
    fila<{ n: number }>(
      "SELECT COUNT(*) AS n FROM documentos WHERE negocio_id = ? AND tipo = 'presupuesto' AND estado = 'enviado'",
      [negocioId],
    ),
    fila<{ n: number }>("SELECT COUNT(*) AS n FROM clientes WHERE negocio_id = ?", [negocioId]),
  ]);
  return {
    porCobrar,
    presupuestosEsperando: esperando?.n ?? 0,
    clientes: clientes?.n ?? 0,
  };
}
