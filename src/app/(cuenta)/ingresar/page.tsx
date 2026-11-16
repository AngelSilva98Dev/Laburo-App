import type { Metadata } from "next";
import Link from "next/link";
import { BotonAccion, Formulario } from "@/components/formulario";
import { entrarDemo, ingresar } from "@/lib/acciones";

export const metadata: Metadata = { title: "Ingresar" };

export default function Ingresar() {
  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Ingresar</h1>
      <p className="mt-2 mb-6 text-suave">Entrá con el email y la contraseña de tu cuenta.</p>

      <Formulario accion={ingresar} boton="Ingresar">
        <div>
          <label htmlFor="email" className="etiqueta">Email</label>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="campo" />
        </div>
        <div>
          <label htmlFor="clave" className="etiqueta">Contraseña</label>
          <input id="clave" name="clave" type="password" autoComplete="current-password" required className="campo" />
        </div>
      </Formulario>

      <p className="mt-8 text-center">
        ¿Todavía no tenés cuenta?{" "}
        <Link href="/registrarse" className="font-semibold text-marca-700 underline underline-offset-2">Creala gratis</Link>
      </p>
      <form action={entrarDemo} className="mt-4">
        <BotonAccion className="btn btn-secundario w-full">Probar con datos de ejemplo</BotonAccion>
      </form>
    </main>
  );
}
