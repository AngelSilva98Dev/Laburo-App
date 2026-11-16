import type { Metadata } from "next";
import { FormularioDoc } from "@/components/documentos";

export const metadata: Metadata = { title: "Editar presupuesto" };

export default async function EditarPresupuesto({ params }: { params: Promise<{ id: string }> }) {
  return <FormularioDoc tipo="presupuesto" id={(await params).id} />;
}
