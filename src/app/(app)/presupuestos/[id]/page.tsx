import type { Metadata } from "next";
import { DetalleDoc } from "@/components/documentos";

export const metadata: Metadata = { title: "Presupuesto" };

export default async function DetallePresupuesto({ params }: { params: Promise<{ id: string }> }) {
  return <DetalleDoc tipo="presupuesto" id={(await params).id} />;
}
