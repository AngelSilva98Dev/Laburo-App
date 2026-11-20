"use client";

import { useRef, useState, useTransition } from "react";
import { subirFoto } from "@/lib/acciones";
import { Icono } from "./ui";

/**
 * Achica la foto en el celular antes de subirla: una foto de 4 MB queda en ~300 KB.
 * Así sube rápido con datos móviles y no llena la base.
 */
async function achicar(archivo: File): Promise<Blob> {
  const imagen = await createImageBitmap(archivo);
  const lado = 1600;
  const k = Math.min(1, lado / Math.max(imagen.width, imagen.height));
  const lienzo = document.createElement("canvas");
  lienzo.width = Math.round(imagen.width * k);
  lienzo.height = Math.round(imagen.height * k);
  lienzo.getContext("2d")!.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
  imagen.close();

  let calidad = 0.78;
  let blob: Blob | null = null;
  do {
    blob = await new Promise<Blob | null>((r) => lienzo.toBlob(r, "image/jpeg", calidad));
    calidad -= 0.15;
  } while (blob && blob.size > 900_000 && calidad > 0.35);
  if (!blob) throw new Error("No se pudo procesar la foto");
  return blob;
}

/** Botón grande para sacar o elegir fotos. En el celular ofrece la cámara o la galería. */
export function SubirFotos({ trabajoId, etapa }: { trabajoId: string; etapa: "antes" | "despues" }) {
  const entrada = useRef<HTMLInputElement>(null);
  const [subiendo, iniciar] = useTransition();
  const [progreso, setProgreso] = useState("");
  const [error, setError] = useState("");

  const subir = (archivos: FileList | null) => {
    if (!archivos?.length) return;
    const lista = Array.from(archivos);
    setError("");
    iniciar(async () => {
      for (let i = 0; i < lista.length; i++) {
        setProgreso(lista.length > 1 ? `Subiendo ${i + 1} de ${lista.length}…` : "Subiendo…");
        try {
          const fd = new FormData();
          fd.set("trabajo_id", trabajoId);
          fd.set("etapa", etapa);
          fd.set("foto", await achicar(lista[i]), "foto.jpg");
          const r = await subirFoto(fd);
          if (r?.error) {
            setError(r.error);
            break;
          }
        } catch {
          setError("No pudimos subir esa foto. Probá sacarla de nuevo.");
          break;
        }
      }
      setProgreso("");
      if (entrada.current) entrada.current.value = "";
    });
  };

  return (
    <div>
      <input
        ref={entrada}
        id={`foto-${etapa}`}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(e) => subir(e.target.files)}
        disabled={subiendo}
      />
      <label
        htmlFor={`foto-${etapa}`}
        className={`btn btn-secundario w-full ${subiendo ? "pointer-events-none opacity-60" : ""}`}
      >
        <Icono n="camara" /> {subiendo ? progreso : etapa === "antes" ? "Agregar foto de cómo estaba" : "Agregar foto de cómo quedó"}
      </label>
      {error && (
        <p className="aviso-error mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
