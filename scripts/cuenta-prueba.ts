/**
 * Crea (o renueva) una cuenta de prueba en la base LOCAL, con datos de ejemplo.
 *
 *   npm run cuenta-prueba
 *
 * El email y la contraseña quedan anotados en CUENTA-DE-PRUEBA.txt (no se sube a GitHub).
 * Si la cuenta ya existe, conserva sus datos y solo le pone una contraseña nueva.
 */
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import { ejecutar, fila, lote, nuevoId } from "../src/lib/db";
import { cargarDatosDeEjemplo } from "../src/lib/demo";

const EMAIL = "prueba@laburo.test";
const ARCHIVO = "CUENTA-DE-PRUEBA.txt";

if (process.env.TURSO_DATABASE_URL) {
  console.error("Este script es solo para la base local. Sacá TURSO_DATABASE_URL para usarlo.");
  process.exit(1);
}

/** Igual que cifrarClave() en src/lib/auth.ts. */
function cifrar(clave: string) {
  const sal = randomBytes(16).toString("hex");
  return `${sal}:${scryptSync(clave, sal, 64).toString("hex")}`;
}

async function main() {
  // Contraseña fácil de tipear en el celular: tres palabras y un número.
  const palabras = ["mate", "pala", "caño", "llave", "taladro", "cable", "pintura", "escalera", "tornillo", "obra"];
  const elegir = () => palabras[randomBytes(1)[0] % palabras.length];
  const clave = `${elegir()}-${elegir()}-${elegir()}-${100 + (randomBytes(1)[0] % 900)}`;

  const existente = await fila<{ id: string }>("SELECT id FROM usuarios WHERE email = ?", [EMAIL]);
  if (existente) {
    await ejecutar("UPDATE usuarios SET clave = ? WHERE id = ?", [cifrar(clave), existente.id]);
    await ejecutar("DELETE FROM intentos_ingreso WHERE email = ?", [EMAIL]);
    console.log("La cuenta de prueba ya existía: le puse una contraseña nueva y conservé sus datos.");
  } else {
    const negocioId = nuevoId();
    await lote([
      {
        sql: `INSERT INTO negocios (id, nombre, rubro, telefono, direccion, cuit, alias, validez_dias)
              VALUES (?, 'Instalaciones Rivera', 'Plomería y gas', '11 5555 0199', 'Av. Rivadavia 6800, CABA', '20-12345678-9', 'rivera.instalaciones', 7)`,
        args: [negocioId],
      },
      {
        sql: "INSERT INTO usuarios (id, negocio_id, email, nombre, clave) VALUES (?, ?, ?, 'Martín', ?)",
        args: [nuevoId(), negocioId, EMAIL, cifrar(clave)],
      },
    ]);
    await cargarDatosDeEjemplo(negocioId);
    console.log("Cuenta de prueba creada con clientes, presupuestos, trabajos y cobros de ejemplo.");
  }

  fs.writeFileSync(
    ARCHIVO,
    [
      "CUENTA DE PRUEBA DE LABURO (solo funciona en tu computadora)",
      "",
      "1. En la terminal de VS Code: npm run dev",
      "2. Abrí http://localhost:3000/ingresar",
      "",
      `Email:      ${EMAIL}`,
      `Contraseña: ${clave}`,
      "",
      "Para generar una contraseña nueva: npm run cuenta-prueba",
      "",
    ].join("\r\n"),
  );
  console.log(`Email y contraseña anotados en ${ARCHIVO}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
