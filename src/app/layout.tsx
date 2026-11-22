import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { SCRIPT_TEMA } from "@/lib/tema";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Laburo — Presupuestos, agenda y cobros para tu trabajo", template: "%s · Laburo" },
  description:
    "La forma más simple de organizar tu trabajo: presupuestos por WhatsApp, agenda de trabajos y cobros. Hecho para oficios y servicios de Argentina.",
  applicationName: "Laburo",
  appleWebApp: { capable: true, title: "Laburo", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  // El color de la barra del celular lo pone el script del tema (src/lib/tema.ts),
  // para que coincida con el tema elegido en la app y no solo con el del celular.
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geist.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full font-sans">
        {children}
        {/* Pone claro u oscuro antes de que se vea la página, para que no parpadee. */}
        <Script id="tema" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </body>
    </html>
  );
}
