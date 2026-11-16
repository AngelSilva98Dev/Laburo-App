import type { Metadata } from "next";
import { ListaDocs } from "@/components/documentos";

export const metadata: Metadata = { title: "Cobros" };

export default function Cobros() {
  return <ListaDocs tipo="cobro" />;
}
