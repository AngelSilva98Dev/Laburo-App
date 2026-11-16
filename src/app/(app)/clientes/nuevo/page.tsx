import type { Metadata } from "next";
import { FormularioCliente } from "@/components/clientes";

export const metadata: Metadata = { title: "Agregar cliente" };

export default function NuevoCliente() {
  return <FormularioCliente />;
}
