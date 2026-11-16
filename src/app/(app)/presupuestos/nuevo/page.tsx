import type { Metadata } from "next";
import { FormularioDoc } from "@/components/documentos";

export const metadata: Metadata = { title: "Nuevo presupuesto" };

export default async function NuevoPresupuesto({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; presupuesto?: string; trabajo?: string }>;
}) {
  return <FormularioDoc tipo="presupuesto" desde={await searchParams} />;
}
