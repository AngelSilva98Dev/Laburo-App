import { createClient, type Client, type InArgs, type InStatement } from "@libsql/client";
import fs from "node:fs";
import { randomUUID } from "node:crypto";

/**
 * Base de datos.
 * - En tu computadora: un archivo local (data/laburo.db), sin instalar nada.
 * - En producción: Turso (SQLite en la nube). Se activa con TURSO_DATABASE_URL y TURSO_AUTH_TOKEN.
 */

const g = globalThis as unknown as { __db?: Client; __dbLista?: Promise<void> };

const ESQUEMA = `
CREATE TABLE IF NOT EXISTS negocios (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  rubro TEXT DEFAULT '',
  telefono TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  cuit TEXT DEFAULT '',
  condicion_iva TEXT DEFAULT 'monotributo',
  alias TEXT DEFAULT '',
  link_pago TEXT DEFAULT '',
  validez_dias INTEGER DEFAULT 7,
  nota_pie TEXT DEFAULT '',
  creado TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  email TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  clave TEXT NOT NULL,
  creado TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sesiones (
  token TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  expira TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  telefono TEXT DEFAULT '',
  email TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  documento TEXT DEFAULT '',
  notas TEXT DEFAULT '',
  creado TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_clientes_negocio ON clientes(negocio_id);
CREATE TABLE IF NOT EXISTS precios (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  nombre TEXT NOT NULL,
  precio REAL NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_precios_negocio ON precios(negocio_id);
CREATE TABLE IF NOT EXISTS trabajos (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  presupuesto_id TEXT,
  titulo TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  direccion TEXT DEFAULT '',
  fecha TEXT,
  hora TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'pendiente',
  creado TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_trabajos_negocio ON trabajos(negocio_id, fecha);
CREATE TABLE IF NOT EXISTS documentos (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  tipo TEXT NOT NULL,
  numero INTEGER NOT NULL,
  cliente_id TEXT NOT NULL REFERENCES clientes(id),
  trabajo_id TEXT,
  origen_id TEXT,
  titulo TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'borrador',
  fecha TEXT NOT NULL,
  vence TEXT,
  notas TEXT DEFAULT '',
  descuento REAL DEFAULT 0,
  iva_pct REAL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  total REAL DEFAULT 0,
  moneda TEXT DEFAULT 'ARS',
  token TEXT NOT NULL UNIQUE,
  creado TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_documentos_negocio ON documentos(negocio_id, tipo);
CREATE TABLE IF NOT EXISTS lineas (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documentos(id),
  descripcion TEXT NOT NULL,
  cantidad REAL NOT NULL DEFAULT 1,
  precio REAL NOT NULL DEFAULT 0,
  orden INTEGER DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_lineas_doc ON lineas(doc_id);
CREATE TABLE IF NOT EXISTS pagos (
  id TEXT PRIMARY KEY,
  negocio_id TEXT NOT NULL REFERENCES negocios(id),
  doc_id TEXT NOT NULL REFERENCES documentos(id),
  monto REAL NOT NULL,
  medio TEXT NOT NULL DEFAULT 'efectivo',
  fecha TEXT NOT NULL,
  creado TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pagos_doc ON pagos(doc_id);
CREATE TABLE IF NOT EXISTS recuperaciones (
  token_hash TEXT PRIMARY KEY,
  usuario_id TEXT NOT NULL REFERENCES usuarios(id),
  expira TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS intentos_ingreso (
  email TEXT NOT NULL,
  momento TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_intentos_email ON intentos_ingreso(email, momento);
`;

/** Columnas que se agregaron después de la primera versión. Se suman solas si faltan. */
const COLUMNAS_NUEVAS: [tabla: string, columna: string, definicion: string][] = [
  ["negocios", "suscripcion_estado", "TEXT DEFAULT ''"],
  ["negocios", "suscripcion_id", "TEXT DEFAULT ''"],
];

async function preparar(c: Client) {
  await c.executeMultiple(ESQUEMA);
  for (const [tabla, columna, definicion] of COLUMNAS_NUEVAS) {
    const info = await c.execute(`PRAGMA table_info(${tabla})`);
    if (!info.rows.some((r) => r[1] === columna)) {
      await c.execute(`ALTER TABLE ${tabla} ADD COLUMN ${columna} ${definicion}`);
    }
  }
}

function cliente(): Client {
  if (!g.__db) {
    const url = process.env.TURSO_DATABASE_URL;
    if (url) {
      g.__db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
    } else {
      fs.mkdirSync("data", { recursive: true });
      g.__db = createClient({ url: "file:data/laburo.db" });
    }
  }
  return g.__db;
}

async function db(): Promise<Client> {
  const c = cliente();
  if (!g.__dbLista) {
    g.__dbLista = preparar(c).catch((e) => {
      g.__dbLista = undefined;
      throw e;
    });
  }
  await g.__dbLista;
  return c;
}

/** Devuelve todas las filas como objetos simples. */
export async function filas<T>(sql: string, args: InArgs = []): Promise<T[]> {
  const r = await (await db()).execute({ sql, args });
  return r.rows.map((row) => Object.fromEntries(r.columns.map((col, i) => [col, row[i]])) as T);
}

/** Devuelve la primera fila o null. */
export async function fila<T>(sql: string, args: InArgs = []): Promise<T | null> {
  return (await filas<T>(sql, args))[0] ?? null;
}

export async function ejecutar(sql: string, args: InArgs = []) {
  return (await db()).execute({ sql, args });
}

/** Ejecuta varias sentencias juntas: o se guardan todas o ninguna. */
export async function lote(sentencias: InStatement[]) {
  return (await db()).batch(sentencias, "write");
}

export function nuevoId() {
  return randomUUID().replace(/-/g, "").slice(0, 16);
}
