import type { Metadata } from "next";
import { DetalleDoc } from "@/components/documentos";

export const metadata: Metadata = { title: "Cobro" };

export default async function DetalleCobro({ params }: { params: Promise<{ id: string }> }) {
  return <DetalleDoc tipo="cobro" id={(await params).id} />;
}
