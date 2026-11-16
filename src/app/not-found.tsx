import Link from "next/link";

export default function NoEncontrado() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center px-5 text-center">
      <h1 className="text-3xl font-bold">No encontramos esa página</h1>
      <p className="mt-2 text-suave">Puede que el link esté mal escrito o que lo hayan borrado.</p>
      <Link href="/inicio" className="btn btn-primario mt-6">
        Volver al inicio
      </Link>
    </main>
  );
}
