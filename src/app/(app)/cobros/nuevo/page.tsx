import type { Metadata } from "next";
import { FormularioDoc } from "@/components/documentos";

export const metadata: Metadata = { title: "Nuevo cobro" };

export default async function NuevoCobro({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; presupuesto?: string; trabajo?: string }>;
}) {
  return <FormularioDoc tipo="cobro" desde={await searchParams} />;
}
