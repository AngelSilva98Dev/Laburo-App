import type { Metadata } from "next";
import { FormularioTrabajo } from "@/components/trabajos";

export const metadata: Metadata = { title: "Editar trabajo" };

export default async function EditarTrabajo({ params }: { params: Promise<{ id: string }> }) {
  return <FormularioTrabajo id={(await params).id} />;
}
