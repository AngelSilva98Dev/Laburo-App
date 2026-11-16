import Link from "next/link";
import { Logo } from "@/components/logo";

export default function CuentaLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-8">
      <Link href="/" className="mb-8 self-start" aria-label="Laburo, volver a la portada">
        <Logo />
      </Link>
      {children}
    </div>
  );
}
