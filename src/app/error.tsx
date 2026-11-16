"use client";

export default function ErrorGeneral({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-bold">Algo salió mal</h1>
      <p className="mt-2 text-suave">No es culpa tuya. Probá de nuevo en un momento.</p>
      <button type="button" onClick={() => reset()} className="btn btn-primario mt-6">
        Probar de nuevo
      </button>
    </main>
  );
}
