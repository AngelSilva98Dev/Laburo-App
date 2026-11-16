import type { Metadata } from "next";
import { Suspense } from "react";
import { Formulario } from "@/components/formulario";
import { restablecerClave } from "@/lib/acciones";

export const metadata: Metadata = { title: "Nueva contraseña", robots: { index: false, follow: false } };

async function CampoToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <input type="hidden" name="token" value={token} />;
}

export default function Restablecer({ params }: { params: Promise<{ token: string }> }) {
  return (
    <main>
      <h1 className="text-3xl font-bold tracking-tight">Elegí una contraseña nueva</h1>
      <p className="mt-2 mb-6 text-suave">Cuando la guardes, entrás directo a tu cuenta.</p>

      <Formulario accion={restablecerClave} boton="Guardar contraseña y entrar">
        <Suspense>
          <CampoToken params={params} />
        </Suspense>
        <div>
          <label htmlFor="clave" className="etiqueta">Contraseña nueva</label>
          <input id="clave" name="clave" type="password" autoComplete="new-password" required minLength={8} className="campo" />
          <p className="ayuda">Al menos 8 letras o números.</p>
        </div>
      </Formulario>
    </main>
  );
}
