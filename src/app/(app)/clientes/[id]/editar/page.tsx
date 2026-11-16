import type { Metadata } from "next";
import { FormularioCliente } from "@/components/clientes";

export const metadata: Metadata = { title: "Editar cliente" };

export default async function EditarCliente({ params }: { params: Promise<{ id: string }> }) {
  return <FormularioCliente id={(await params).id} />;
}
