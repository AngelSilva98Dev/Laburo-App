import type { Metadata } from "next";
import { FormularioDoc } from "@/components/documentos";

export const metadata: Metadata = { title: "Editar cobro" };

export default async function EditarCobro({ params }: { params: Promise<{ id: string }> }) {
  return <FormularioDoc tipo="cobro" id={(await params).id} />;
}
