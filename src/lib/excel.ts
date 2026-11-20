import { strToU8, zipSync } from "fflate";

/**
 * Generador mínimo de planillas Excel (.xlsx) con varias hojas.
 * Un .xlsx es un ZIP con archivos XML; no hace falta una librería grande para esto.
 */

export type Celda = string | number | null | undefined;
export type Hoja = {
  nombre: string;
  columnas: { titulo: string; ancho?: number; plata?: boolean }[];
  filas: Celda[][];
};

const escapar = (s: string) =>
  s
    // Excel no acepta caracteres de control en el XML.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function columna(n: number) {
  let s = "";
  for (n++; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
}

function celda(valor: Celda, ref: string, estilo: number) {
  if (valor === null || valor === undefined || valor === "") return "";
  if (typeof valor === "number" && Number.isFinite(valor)) return `<c r="${ref}" s="${estilo}"><v>${valor}</v></c>`;
  return `<c r="${ref}" t="inlineStr" s="${estilo}"><is><t xml:space="preserve">${escapar(String(valor))}</t></is></c>`;
}

function hojaXml(h: Hoja) {
  const cols = h.columnas
    .map((c, i) => `<col min="${i + 1}" max="${i + 1}" width="${c.ancho ?? 18}" customWidth="1"/>`)
    .join("");
  const titulos = `<row r="1">${h.columnas.map((c, i) => celda(c.titulo, `${columna(i)}1`, 1)).join("")}</row>`;
  const filas = h.filas
    .map(
      (f, r) =>
        `<row r="${r + 2}">${f.map((v, i) => celda(v, `${columna(i)}${r + 2}`, h.columnas[i]?.plata ? 2 : 0)).join("")}</row>`,
    )
    .join("");
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${titulos}${filas}</sheetData></worksheet>`;
}

export function crearExcel(hojas: Hoja[]): Uint8Array {
  const archivos: Record<string, Uint8Array> = {
    "[Content_Types].xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${hojas
      .map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
      .join("")}</Types>`),
    "_rels/.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`),
    "xl/workbook.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${hojas
      .map((h, i) => `<sheet name="${escapar(h.nombre.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
      .join("")}</sheets></workbook>`),
    "xl/_rels/workbook.xml.rels": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${hojas
      .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
      .join("")}<Relationship Id="rId${hojas.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`),
    // Estilos: 0 normal · 1 título en negrita con fondo · 2 plata con separador de miles.
    "xl/styles.xml": strToU8(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFDBE7FF"/></patternFill></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="3"><xf/><xf fontId="1" fillId="2" applyFont="1" applyFill="1"/><xf numFmtId="164" applyNumberFormat="1"/></cellXfs></styleSheet>`),
  };
  hojas.forEach((h, i) => (archivos[`xl/worksheets/sheet${i + 1}.xml`] = strToU8(hojaXml(h))));
  return zipSync(archivos, { level: 6 });
}
