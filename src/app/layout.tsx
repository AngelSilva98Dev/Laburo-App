import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Oficio — Presupuestos, agenda y cobros para tu trabajo", template: "%s · Oficio" },
  description:
    "La forma más simple de organizar tu trabajo: presupuestos por WhatsApp, agenda de trabajos y cobros. Hecho para oficios y servicios de Argentina.",
  applicationName: "Oficio",
  appleWebApp: { capable: true, title: "Oficio", statusBarStyle: "default" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#1b54d6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
