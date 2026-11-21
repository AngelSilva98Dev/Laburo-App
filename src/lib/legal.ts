/**
 * Datos del titular del servicio, para los Términos y la Política de privacidad.
 * Se completan con variables de entorno (ver .env.example). Todas son opcionales:
 * el dato que no esté cargado simplemente no se muestra.
 *
 * Antes de empezar a cobrar conviene completar nombre, CUIT y un domicilio para reclamos
 * (no tiene que ser tu casa: puede ser el domicilio fiscal o el de tu contador).
 */
const dato = (valor: string | undefined) => valor?.trim() || "";

export const TITULAR = {
  nombre: dato(process.env.LEGAL_TITULAR),
  cuit: dato(process.env.LEGAL_CUIT),
  domicilio: dato(process.env.LEGAL_DOMICILIO),
  email: dato(process.env.EMAIL_CONTACTO) || "laburoapp.ar@gmail.com",
};

/**
 * Frase de identificación con los datos que haya, por ejemplo:
 * "El titular del servicio es Juan Pérez, CUIT/CUIL 20-…, con domicilio en CABA."
 * Si no hay ninguno, devuelve "" y la página no la muestra.
 */
export function identificacion(comienzo: string) {
  if (!TITULAR.nombre && !TITULAR.cuit && !TITULAR.domicilio) return "";
  const partes = [
    TITULAR.nombre ? `${comienzo} ${TITULAR.nombre}` : comienzo.replace(/ es$/, ""),
    TITULAR.cuit && `CUIT/CUIL ${TITULAR.cuit}`,
    TITULAR.domicilio && `con domicilio en ${TITULAR.domicilio}`,
  ].filter(Boolean);
  return `${partes.join(", ")}.`;
}

/** Fecha de la última revisión de los textos legales. Actualizala cuando los cambies. */
export const LEGAL_VIGENCIA = "16 de noviembre de 2026";
