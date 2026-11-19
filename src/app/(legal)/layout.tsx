import Link from "next/link";
import { Logo } from "@/components/logo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-superficie">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
        <Link href="/" aria-label="Laburo, volver a la portada"><Logo /></Link>
        <Link href="/" className="btn btn-secundario btn-chico">Volver</Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pt-4 pb-16 [&_h2]:mt-8 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_li]:mt-1 [&_p]:mt-3 [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-6">
        {children}
      </main>
      <footer className="border-t border-slate-200 px-5 py-6 text-center text-suave">
        <Link href="/terminos" className="font-semibold underline underline-offset-2">Términos y condiciones</Link>
        {" · "}
        <Link href="/privacidad" className="font-semibold underline underline-offset-2">Política de privacidad</Link>
      </footer>
    </div>
  );
}
