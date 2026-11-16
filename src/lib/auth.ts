import { cache } from "react";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { redirect } from "next/navigation";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { ejecutar, fila } from "./db";
import type { Negocio } from "./datos";

const COOKIE = "sesion";
const DIAS = 60;

export function cifrarClave(clave: string) {
  const sal = randomBytes(16).toString("hex");
  return `${sal}:${scryptSync(clave, sal, 64).toString("hex")}`;
}

export function claveCorrecta(clave: string, guardada: string) {
  const [sal, hash] = guardada.split(":");
  if (!sal || !hash) return false;
  const a = Buffer.from(hash, "hex");
  const b = scryptSync(clave, sal, 64);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function crearSesion(usuarioId: string) {
  const token = randomBytes(32).toString("hex");
  const expira = new Date(Date.now() + DIAS * 86400_000);
  await ejecutar("INSERT INTO sesiones (token, usuario_id, expira) VALUES (?, ?, ?)", [
    token,
    usuarioId,
    expira.toISOString(),
  ]);
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expira,
  });
}

export async function cerrarSesion() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await ejecutar("DELETE FROM sesiones WHERE token = ?", [token]);
  jar.delete(COOKIE);
}

export type Sesion = {
  usuario: { id: string; nombre: string; email: string };
  negocio: Negocio;
};

/** Sesión actual (o null). Se calcula una sola vez por pedido. */
export const sesionActual = cache(async (): Promise<Sesion | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const u = await fila<{ id: string; nombre: string; email: string; negocio_id: string }>(
    `SELECT u.id, u.nombre, u.email, u.negocio_id
     FROM sesiones s JOIN usuarios u ON u.id = s.usuario_id
     WHERE s.token = ? AND s.expira > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
    [token],
  );
  if (!u) return null;
  const negocio = await fila<Negocio>("SELECT * FROM negocios WHERE id = ?", [u.negocio_id]);
  if (!negocio) return null;
  return { usuario: { id: u.id, nombre: u.nombre, email: u.email }, negocio };
});

/** Para páginas privadas: si no hay sesión, manda a ingresar. */
export async function requerirSesion(): Promise<Sesion> {
  // Las pantallas privadas siempre se arman en el momento, con datos frescos.
  await connection();
  const s = await sesionActual();
  if (!s) redirect("/ingresar");
  return s;
}
