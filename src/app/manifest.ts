import type { MetadataRoute } from "next";

/** Permite "Agregar a la pantalla de inicio" y usar Laburo como una app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Laburo — Presupuestos, agenda y cobros",
    short_name: "Laburo",
    description: "Organizá tu trabajo: presupuestos por WhatsApp, agenda y cobros.",
    lang: "es-AR",
    start_url: "/inicio",
    display: "standalone",
    background_color: "#f3f5f9",
    theme_color: "#1b54d6",
    icons: [
      { src: "/icono-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icono-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icono-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icono.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icono-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
