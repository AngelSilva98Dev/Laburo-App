import type { Metadata } from "next";
import Link from "next/link";
import { Formulario } from "@/components/formulario";
import { pedirRecuperacion } from "@/lib/acciones";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function Recuperar() {
  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">¿Olvidaste tu contraseña?</h1>
      <p className="mt-2 mb-6 text-suave">
        No pasa nada. Escribí el email de tu cuenta y te mandamos un link para elegir una contraseña nueva.
      </p>

      <Formulario accion={pedirRecuperacion} boton="Mandarme el link" limpiarAlGuardar>
        <div>
          <label htmlFor="email" className="etiqueta">Tu email</label>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="campo" />
        </div>
      </Formulario>

      <p className="mt-8 text-center">
        <Link href="/ingresar" className="font-semibold text-marca-700 underline underline-offset-2">Volver a ingresar</Link>
      </p>
    </main>
  );
}
