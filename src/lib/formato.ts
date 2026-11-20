/** Formatos pensados para Argentina: pesos, fechas dd/mm, WhatsApp. */

export const MARCA = "Laburo";
export const ZONA = "America/Argentina/Buenos_Aires";

/** Fecha de hoy en Argentina, como AAAA-MM-DD. */
export function hoyISO() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: ZONA }).format(new Date());
}

function aFecha(iso: string) {
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12));
}

export function sumarDias(iso: string, dias: number) {
  const f = aFecha(iso);
  f.setUTCDate(f.getUTCDate() + dias);
  return f.toISOString().slice(0, 10);
}

/** Lunes de la semana a la que pertenece la fecha. */
export function lunesDe(iso: string) {
  const dia = aFecha(iso).getUTCDay();
  return sumarDias(iso, dia === 0 ? -6 : 1 - dia);
}

export function esFechaISO(v: string | undefined | null): v is string {
  return !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(aFecha(v).getTime());
}

/** "lunes 16 de noviembre" */
export function fechaLarga(iso: string) {
  return new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(aFecha(iso));
}

/** "16/11/2026" */
export function fechaCorta(iso: string | null | undefined) {
  if (!iso) return "";
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Texto amigable: "Hoy", "Mañana", "Ayer" o la fecha larga. */
export function fechaAmigable(iso: string, hoy: string) {
  if (iso === hoy) return "Hoy";
  if (iso === sumarDias(hoy, 1)) return "Mañana";
  if (iso === sumarDias(hoy, -1)) return "Ayer";
  return fechaLarga(iso);
}

export function diaSemanaCorto(iso: string) {
  return new Intl.DateTimeFormat("es-AR", { weekday: "short", timeZone: "UTC" })
    .format(aFecha(iso))
    .replace(".", "");
}

export function diaDelMes(iso: string) {
  return Number(iso.slice(8, 10));
}

/** "$ 125.000" o "US$ 100" */
export function dinero(monto: number, moneda: string = "ARS") {
  const n = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.round((monto || 0) * 100) / 100);
  return `${moneda === "USD" ? "US$" : "$"} ${n}`;
}

export function numeroDoc(n: number) {
  return String(n).padStart(4, "0");
}

/** Convierte un teléfono argentino al formato que pide WhatsApp (549 + área + número). */
export function telefonoWhatsApp(tel: string | null | undefined) {
  let d = (tel ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("549")) return d;
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("9") && d.length === 11) d = d.slice(1);
  // Saca el "15" que va después del código de área (de 2, 3 o 4 dígitos).
  if (d.length === 12) {
    for (const largo of [2, 3, 4]) {
      if (d.slice(largo, largo + 2) === "15") {
        d = d.slice(0, largo) + d.slice(largo + 2);
        break;
      }
    }
  }
  return `549${d}`;
}

/** Link que abre WhatsApp con el mensaje ya escrito. Sin teléfono, deja elegir el contacto. */
export function linkWhatsApp(tel: string | null | undefined, texto: string) {
  const n = telefonoWhatsApp(tel);
  return `https://wa.me/${n}?text=${encodeURIComponent(texto)}`;
}

export function linkMapa(direccion: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`;
}

export type Tono = "gris" | "azul" | "ambar" | "verde" | "rojo";
export type Estado = { texto: string; tono: Tono };

export function estadoPresupuesto(d: { estado: string; vence: string | null }, hoy: string): Estado {
  if (d.estado === "aprobado") return { texto: "Aceptado", tono: "verde" };
  if (d.estado === "rechazado") return { texto: "Rechazado", tono: "rojo" };
  if (d.vence && d.vence < hoy) return { texto: "Vencido", tono: "rojo" };
  if (d.estado === "enviado") return { texto: "Esperando respuesta", tono: "ambar" };
  return { texto: "Sin enviar", tono: "gris" };
}

export function estadoCobro(
  d: { total: number; pagado: number; vence: string | null },
  hoy: string,
): Estado {
  if (d.pagado >= d.total - 0.005) return { texto: "Cobrado", tono: "verde" };
  if (d.vence && d.vence < hoy) return { texto: "Atrasado", tono: "rojo" };
  if (d.pagado > 0) return { texto: "Pago parcial", tono: "ambar" };
  return { texto: "Por cobrar", tono: "azul" };
}

export function estadoTrabajo(estado: string): Estado {
  switch (estado) {
    case "en_curso":
      return { texto: "En curso", tono: "ambar" };
    case "terminado":
      return { texto: "Terminado", tono: "verde" };
    case "cancelado":
      return { texto: "Cancelado", tono: "gris" };
    default:
      return { texto: "Pendiente", tono: "azul" };
  }
}

export const MEDIOS_PAGO: Record<string, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  mercadopago: "Mercado Pago",
  tarjeta: "Tarjeta",
  otro: "Otro",
};

export const CONDICIONES_IVA: Record<string, string> = {
  monotributo: "Monotributista",
  ri: "Responsable Inscripto",
  exento: "Exento",
  ninguna: "Todavía no estoy inscripto",
};

/** Días entre dos fechas AAAA-MM-DD (positivo si "hasta" es posterior). */
export function diasEntre(desde: string, hasta: string) {
  return Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / 86400_000);
}

/** Mensaje de WhatsApp para mandar un cobro, o para recordarlo con buena onda si está atrasado. */
export function mensajeCobro(
  d: { titulo: string; total: number; pagado: number; moneda: string; vence: string | null; cliente_nombre: string },
  negocio: string,
  url: string,
  hoy: string,
) {
  const nombre = d.cliente_nombre.split(" ")[0];
  const saldo = Math.max(d.total - d.pagado, 0);
  if (d.vence && d.vence < hoy) {
    return `Hola ${nombre}! ¿Cómo estás? Te escribo de ${negocio} para recordarte que quedó pendiente el pago de "${d.titulo}" por ${dinero(saldo, d.moneda)}.\n\nAcá tenés los datos para pagar:\n${url}\n\n¡Muchas gracias!`;
  }
  return `Hola ${nombre}! Te paso el detalle de ${negocio} por "${d.titulo}".\n${d.pagado > 0 ? "Falta pagar" : "Total"}: ${dinero(saldo, d.moneda)}\n\nAcá están los datos para pagar:\n${url}`;
}

/** Calcula los totales de un presupuesto o cobro. */
export function calcularTotales(
  lineas: { cantidad: number; precio: number }[],
  descuento: number,
  ivaPct: number,
) {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = r2(lineas.reduce((s, l) => s + l.cantidad * l.precio, 0));
  const desc = Math.min(Math.max(descuento || 0, 0), subtotal);
  const base = subtotal - desc;
  const iva = r2((base * (ivaPct || 0)) / 100);
  return { subtotal, descuento: r2(desc), iva, total: r2(base + iva) };
}
