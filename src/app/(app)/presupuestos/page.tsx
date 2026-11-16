import type { Metadata } from "next";
import { ListaDocs } from "@/components/documentos";

export const metadata: Metadata = { title: "Presupuestos" };

export default function Presupuestos() {
  return <ListaDocs tipo="presupuesto" />;
}
