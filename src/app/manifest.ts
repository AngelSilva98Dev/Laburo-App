import type { MetadataRoute } from "next";

/** Permite "Agregar a la pantalla de inicio" y usar Oficio como una app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Oficio — Presupuestos, agenda y cobros",
    short_name: "Oficio",
    description: "Organizá tu trabajo: presupuestos por WhatsApp, agenda y cobros.",
    lang: "es-AR",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#f3f5f9",
    theme_color: "#1b54d6",
    icons: [
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
