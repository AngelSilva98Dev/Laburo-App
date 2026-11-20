import { borrarFoto } from "@/lib/acciones";
import type { Foto } from "@/lib/fotos";
import { BotonAccion } from "./formulario";
import { SubirFotos } from "./subir-fotos";
import { Icono } from "./ui";

const ETAPAS = [
  { etapa: "antes", titulo: "Antes" },
  { etapa: "despues", titulo: "Después" },
] as const;

/** Grilla de fotos. Tocar una la abre en grande. */
export function GrillaFotos({
  fotos,
  url,
  borrable = false,
}: {
  fotos: Foto[];
  url: (id: string) => string;
  borrable?: boolean;
}) {
  return (
    <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {fotos.map((f, i) => (
        <li key={f.id} className="relative">
          <a href={url(f.id)} target="_blank" rel="noopener" className="block overflow-hidden rounded-xl bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element -- fotos privadas servidas desde la base */}
            <img src={url(f.id)} alt={`Foto ${i + 1}`} loading="lazy" className="aspect-square w-full object-cover" />
          </a>
          {borrable && (
            <form action={borrarFoto} className="absolute top-1 right-1">
              <input type="hidden" name="id" value={f.id} />
              <BotonAccion
                className="grid size-11 cursor-pointer place-items-center rounded-full bg-black/60 text-white"
                confirmar="¿Seguro que querés borrar esta foto?"
              >
                <Icono n="borrar" className="size-5" />
                <span className="sr-only">Borrar foto {i + 1}</span>
              </BotonAccion>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Sección de fotos en el detalle del trabajo: antes y después, con botón para agregar. */
export function FotosTrabajo({ trabajoId, fotos, puedeSubir }: { trabajoId: string; fotos: Foto[]; puedeSubir: boolean }) {
  return (
    <div className="space-y-5">
      {ETAPAS.map(({ etapa, titulo }) => {
        const deEtapa = fotos.filter((f) => f.etapa === etapa);
        return (
          <div key={etapa} className="tarjeta space-y-3">
            <h3 className="font-bold">
              {titulo} <span className="font-normal text-suave">({deEtapa.length})</span>
            </h3>
            {deEtapa.length > 0 && <GrillaFotos fotos={deEtapa} url={(id) => `/fotos/${id}`} borrable />}
            {puedeSubir && <SubirFotos trabajoId={trabajoId} etapa={etapa} />}
          </div>
        );
      })}
      <p className="ayuda">Las fotos de “Después” también las ve tu cliente en el link del cobro.</p>
    </div>
  );
}
