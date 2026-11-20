import { sesionActual } from "@/lib/auth";
import { filas } from "@/lib/db";
import { crearExcel } from "@/lib/excel";
import { estadoTrabajo, fechaCorta, hoyISO, MEDIOS_PAGO } from "@/lib/formato";

/** Descarga todos los datos del negocio en una planilla de Excel, una hoja por tema. */
export async function GET() {
  const s = await sesionActual();
  if (!s) return Response.redirect(new URL("/ingresar", process.env.URL_PUBLICA ?? "http://localhost:3000"), 303);
  const id = s.negocio.id;

  const [clientes, documentos, items, pagos, trabajos] = await Promise.all([
    filas<Record<string, string>>(
      "SELECT nombre, telefono, email, direccion, documento, notas, creado FROM clientes WHERE negocio_id = ? ORDER BY nombre COLLATE NOCASE",
      [id],
    ),
    filas<{
      tipo: string; numero: number; fecha: string; vence: string | null; cliente: string; titulo: string; estado: string;
      moneda: string; subtotal: number; descuento: number; iva_pct: number; total: number; pagado: number;
    }>(
      `SELECT d.tipo, d.numero, d.fecha, d.vence, c.nombre AS cliente, d.titulo, d.estado, d.moneda,
         d.subtotal, d.descuento, d.iva_pct, d.total,
         COALESCE((SELECT SUM(p.monto) FROM pagos p WHERE p.doc_id = d.id), 0) AS pagado
       FROM documentos d JOIN clientes c ON c.id = d.cliente_id
       WHERE d.negocio_id = ? ORDER BY d.tipo, d.numero`,
      [id],
    ),
    filas<{ tipo: string; numero: number; descripcion: string; cantidad: number; precio: number; moneda: string }>(
      `SELECT d.tipo, d.numero, l.descripcion, l.cantidad, l.precio, d.moneda
       FROM lineas l JOIN documentos d ON d.id = l.doc_id
       WHERE d.negocio_id = ? ORDER BY d.tipo, d.numero, l.orden`,
      [id],
    ),
    filas<{ fecha: string; cliente: string; numero: number; titulo: string; monto: number; moneda: string; medio: string }>(
      `SELECT p.fecha, c.nombre AS cliente, d.numero, d.titulo, p.monto, d.moneda, p.medio
       FROM pagos p JOIN documentos d ON d.id = p.doc_id JOIN clientes c ON c.id = d.cliente_id
       WHERE p.negocio_id = ? ORDER BY p.fecha, p.creado`,
      [id],
    ),
    filas<{ fecha: string | null; hora: string; cliente: string; titulo: string; direccion: string; estado: string; descripcion: string }>(
      `SELECT t.fecha, t.hora, c.nombre AS cliente, t.titulo, t.direccion, t.estado, t.descripcion
       FROM trabajos t JOIN clientes c ON c.id = t.cliente_id
       WHERE t.negocio_id = ? ORDER BY COALESCE(t.fecha, '9999'), t.hora`,
      [id],
    ),
  ]);

  const presupuestos = documentos.filter((d) => d.tipo === "presupuesto");
  const cobros = documentos.filter((d) => d.tipo === "cobro");
  const estadoPres: Record<string, string> = { borrador: "Sin enviar", enviado: "Enviado", aprobado: "Aceptado", rechazado: "Rechazado" };
  const moneda = (m: string) => (m === "USD" ? "Dólares" : "Pesos");

  const excel = crearExcel([
    {
      nombre: "Clientes",
      columnas: [
        { titulo: "Nombre", ancho: 28 }, { titulo: "Celular", ancho: 16 }, { titulo: "Email", ancho: 26 },
        { titulo: "Dirección", ancho: 34 }, { titulo: "CUIT / DNI", ancho: 16 }, { titulo: "Notas", ancho: 40 }, { titulo: "Alta", ancho: 12 },
      ],
      filas: clientes.map((c) => [c.nombre, c.telefono, c.email, c.direccion, c.documento, c.notas, fechaCorta(c.creado?.slice(0, 10))]),
    },
    {
      nombre: "Presupuestos",
      columnas: [
        { titulo: "N°", ancho: 7 }, { titulo: "Fecha", ancho: 12 }, { titulo: "Vale hasta", ancho: 12 }, { titulo: "Cliente", ancho: 26 },
        { titulo: "Trabajo", ancho: 34 }, { titulo: "Estado", ancho: 14 }, { titulo: "Moneda", ancho: 9 },
        { titulo: "Subtotal", plata: true, ancho: 14 }, { titulo: "Descuento", plata: true, ancho: 12 }, { titulo: "IVA %", ancho: 7 },
        { titulo: "Total", plata: true, ancho: 14 },
      ],
      filas: presupuestos.map((d) => [
        d.numero, fechaCorta(d.fecha), fechaCorta(d.vence), d.cliente, d.titulo, estadoPres[d.estado] ?? d.estado, moneda(d.moneda),
        d.subtotal, d.descuento, d.iva_pct, d.total,
      ]),
    },
    {
      nombre: "Cobros",
      columnas: [
        { titulo: "N°", ancho: 7 }, { titulo: "Fecha", ancho: 12 }, { titulo: "Vence", ancho: 12 }, { titulo: "Cliente", ancho: 26 },
        { titulo: "Trabajo", ancho: 34 }, { titulo: "Moneda", ancho: 9 }, { titulo: "Total", plata: true, ancho: 14 },
        { titulo: "Pagado", plata: true, ancho: 14 }, { titulo: "Falta", plata: true, ancho: 14 },
      ],
      filas: cobros.map((d) => [
        d.numero, fechaCorta(d.fecha), fechaCorta(d.vence), d.cliente, d.titulo, moneda(d.moneda), d.total, d.pagado,
        Math.max(Math.round((d.total - d.pagado) * 100) / 100, 0),
      ]),
    },
    {
      nombre: "Pagos recibidos",
      columnas: [
        { titulo: "Fecha", ancho: 12 }, { titulo: "Cliente", ancho: 26 }, { titulo: "Cobro N°", ancho: 9 }, { titulo: "Trabajo", ancho: 34 },
        { titulo: "Medio", ancho: 15 }, { titulo: "Moneda", ancho: 9 }, { titulo: "Monto", plata: true, ancho: 14 },
      ],
      filas: pagos.map((p) => [fechaCorta(p.fecha), p.cliente, p.numero, p.titulo, MEDIOS_PAGO[p.medio] ?? p.medio, moneda(p.moneda), p.monto]),
    },
    {
      nombre: "Trabajos",
      columnas: [
        { titulo: "Fecha", ancho: 12 }, { titulo: "Hora", ancho: 7 }, { titulo: "Cliente", ancho: 26 }, { titulo: "Trabajo", ancho: 34 },
        { titulo: "Dirección", ancho: 34 }, { titulo: "Estado", ancho: 12 }, { titulo: "Notas", ancho: 40 },
      ],
      filas: trabajos.map((t) => [fechaCorta(t.fecha), t.hora, t.cliente, t.titulo, t.direccion, estadoTrabajo(t.estado).texto, t.descripcion]),
    },
    {
      nombre: "Detalle de ítems",
      columnas: [
        { titulo: "Tipo", ancho: 13 }, { titulo: "N°", ancho: 7 }, { titulo: "Descripción", ancho: 40 }, { titulo: "Cantidad", ancho: 10 },
        { titulo: "Precio unitario", plata: true, ancho: 15 }, { titulo: "Subtotal", plata: true, ancho: 15 }, { titulo: "Moneda", ancho: 9 },
      ],
      filas: items.map((l) => [
        l.tipo === "cobro" ? "Cobro" : "Presupuesto", l.numero, l.descripcion, l.cantidad, l.precio,
        Math.round(l.cantidad * l.precio * 100) / 100, moneda(l.moneda),
      ]),
    },
  ]);

  return new Response(new Blob([excel as Uint8Array<ArrayBuffer>]), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="laburo-mis-datos-${hoyISO()}.xlsx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
