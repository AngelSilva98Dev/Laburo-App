/**
 * Datos del titular del servicio, para los Términos y la Política de privacidad.
 * Se completan con variables de entorno (ver .env.example). Mientras falten,
 * las páginas legales muestran "[COMPLETAR]" para que no pase desapercibido.
 */
const dato = (valor: string | undefined, que: string) => valor?.trim() || `[COMPLETAR: ${que}]`;

export const TITULAR = {
  nombre: dato(process.env.LEGAL_TITULAR, "nombre o razón social del titular"),
  cuit: dato(process.env.LEGAL_CUIT, "CUIT"),
  domicilio: dato(process.env.LEGAL_DOMICILIO, "domicilio legal"),
  email: dato(process.env.EMAIL_CONTACTO, "email de contacto"),
};

/** Fecha de la última revisión de los textos legales. Actualizala cuando los cambies. */
export const LEGAL_VIGENCIA = "16 de noviembre de 2026";
