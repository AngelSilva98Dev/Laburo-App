import type { Metadata } from "next";
import { FormularioTrabajo } from "@/components/trabajos";

export const metadata: Metadata = { title: "Agendar un trabajo" };

export default async function NuevoTrabajo({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string; presupuesto?: string; dia?: string }>;
}) {
  return <FormularioTrabajo desde={await searchParams} />;
}
