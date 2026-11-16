import type { Metadata } from "next";
import Link from "next/link";
import { Formulario } from "@/components/formulario";
import { registrarse } from "@/lib/acciones";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function Registrarse() {
  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Creá tu cuenta</h1>
      <p className="mt-2 mb-6 text-suave">Son 4 datos y ya podés empezar. Es gratis.</p>

      <Formulario accion={registrarse} boton="Crear mi cuenta">
        <div>
          <label htmlFor="nombre" className="etiqueta">¿Cómo te llamás?</label>
          <input id="nombre" name="nombre" autoComplete="given-name" required maxLength={80} className="campo" placeholder="Ej: Martín" />
        </div>
        <div>
          <label htmlFor="negocio" className="etiqueta">Nombre de tu negocio</label>
          <input id="negocio" name="negocio" autoComplete="organization" required maxLength={80} className="campo" placeholder="Ej: Instalaciones Rivera" />
          <p className="ayuda">Así lo van a ver tus clientes en los presupuestos. Si trabajás solo, poné tu nombre.</p>
        </div>
        <div>
          <label htmlFor="email" className="etiqueta">Tu email</label>
          <input id="email" name="email" type="email" inputMode="email" autoComplete="email" required className="campo" placeholder="nombre@gmail.com" />
        </div>
        <div>
          <label htmlFor="clave" className="etiqueta">Elegí una contraseña</label>
          <input id="clave" name="clave" type="password" autoComplete="new-password" required minLength={8} className="campo" />
          <p className="ayuda">Al menos 8 letras o números.</p>
        </div>
      </Formulario>

      <p className="mt-8 text-center">
        ¿Ya tenés cuenta?{" "}
        <Link href="/ingresar" className="font-semibold text-marca-700 underline underline-offset-2">Ingresá</Link>
      </p>
    </main>
  );
}
