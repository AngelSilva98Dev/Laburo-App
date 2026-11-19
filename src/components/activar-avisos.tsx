"use client";

import { useEffect, useState, useTransition } from "react";
import { borrarSuscripcionPush, guardarSuscripcionPush, probarAvisos } from "@/lib/acciones";
import { Icono } from "./ui";

/**
 * Activar las notificaciones en este celular o computadora.
 * - "banner": tarjeta corta para Inicio. Solo aparece si todavía no las activó.
 * - "completo": para Más → Avisos, con todos los estados y el botón de prueba.
 */

type Estado = "cargando" | "no-soportado" | "iphone" | "bloqueado" | "apagado" | "activado";

function claveBinaria(base64: string) {
  const relleno = "=".repeat((4 - (base64.length % 4)) % 4);
  const crudo = atob((base64 + relleno).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(crudo, (c) => c.charCodeAt(0));
}

function esIphoneSinInstalar() {
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const instalada = window.matchMedia("(display-mode: standalone)").matches || ("standalone" in navigator && navigator.standalone === true);
  return ios && !instalada;
}

async function registro() {
  return navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
}

export function ActivarAvisos({ clavePublica, variante }: { clavePublica: string; variante: "banner" | "completo" }) {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState<{ ok?: string; error?: string }>({});
  const [trabajando, iniciar] = useTransition();

  useEffect(() => {
    let vigente = true;
    (async () => {
      let e: Estado;
      if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
        e = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "iphone" : "no-soportado";
      } else if (esIphoneSinInstalar()) {
        e = "iphone";
      } else if (Notification.permission === "denied") {
        e = "bloqueado";
      } else {
        const sub = await (await registro()).pushManager.getSubscription();
        if (sub && Notification.permission === "granted") {
          // Se vuelve a guardar por si cambió de cuenta en este dispositivo.
          await guardarSuscripcionPush(JSON.parse(JSON.stringify(sub)));
          e = "activado";
        } else {
          e = "apagado";
        }
      }
      if (vigente) setEstado(e);
    })().catch(() => vigente && setEstado("no-soportado"));
    return () => {
      vigente = false;
    };
  }, []);

  const activar = () =>
    iniciar(async () => {
      setMensaje({});
      try {
        const permiso = await Notification.requestPermission();
        if (permiso !== "granted") {
          setEstado(permiso === "denied" ? "bloqueado" : "apagado");
          return;
        }
        const reg = await registro();
        await navigator.serviceWorker.ready;
        const sub =
          (await reg.pushManager.getSubscription()) ??
          (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: claveBinaria(clavePublica) }));
        const r = await guardarSuscripcionPush(JSON.parse(JSON.stringify(sub)));
        if (r.error) {
          setMensaje({ error: r.error });
          return;
        }
        setEstado("activado");
        setMensaje({ ok: "¡Listo! Te vamos a avisar en este dispositivo." });
      } catch {
        setMensaje({ error: "No pudimos activar los avisos. Probá de nuevo en un rato." });
      }
    });

  const desactivar = () =>
    iniciar(async () => {
      setMensaje({});
      const sub = await (await registro()).pushManager.getSubscription();
      if (sub) {
        await borrarSuscripcionPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setEstado("apagado");
    });

  const probar = () =>
    iniciar(async () => {
      setMensaje({});
      setMensaje(await probarAvisos());
    });

  /* ── Tarjeta corta para Inicio ── */
  if (variante === "banner") {
    if (estado !== "apagado") return null;
    return (
      <div className="mt-4 flex flex-col gap-3 rounded-2xl border-2 border-marca-200 bg-marca-50 p-4 sm:flex-row sm:items-center">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-marca-100 text-marca-700">
          <Icono n="campana" />
        </span>
        <span className="flex-1">
          <strong className="block">Enterate al instante cuando un cliente acepta</strong>
          <span className="text-sm text-suave">Te avisamos en el celular, como un WhatsApp, aunque no tengas Laburo abierto.</span>
        </span>
        <button type="button" onClick={activar} disabled={trabajando} className="btn btn-primario">
          {trabajando ? "Un momento…" : "Activar avisos"}
        </button>
      </div>
    );
  }

  /* ── Versión completa para Más → Avisos ── */
  return (
    <div className="space-y-4">
      {estado === "cargando" && <p className="text-suave">Revisando este dispositivo…</p>}

      {estado === "activado" && (
        <>
          <p className="flex items-center gap-2 font-semibold text-emerald-900">
            <Icono n="check" /> Los avisos están activados en este dispositivo
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={probar} disabled={trabajando} className="btn btn-secundario">
              <Icono n="campana" /> Mandarme un aviso de prueba
            </button>
            <button type="button" onClick={desactivar} disabled={trabajando} className="btn btn-secundario">
              Desactivar en este dispositivo
            </button>
          </div>
        </>
      )}

      {estado === "apagado" && (
        <>
          <p>Activalos y te avisamos en el celular cuando un cliente acepta o rechaza un presupuesto, o te avisa que ya pagó.</p>
          <button type="button" onClick={activar} disabled={trabajando} className="btn btn-primario w-full sm:w-auto">
            <Icono n="campana" /> {trabajando ? "Un momento…" : "Activar avisos en este dispositivo"}
          </button>
          <p className="ayuda">El celular te va a preguntar si permitís notificaciones: tocá “Permitir”.</p>
        </>
      )}

      {estado === "bloqueado" && (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-950">
          <p className="font-semibold">Los avisos están bloqueados en este navegador</p>
          <p className="mt-1 text-sm">
            Para activarlos: tocá el candado o los tres puntitos al lado de la dirección → Permisos o Configuración del sitio → Notificaciones → Permitir. Después volvé a esta pantalla.
          </p>
        </div>
      )}

      {estado === "iphone" && (
        <div className="rounded-xl border-2 border-marca-200 bg-marca-50 p-4">
          <p className="font-semibold">En iPhone hay que agregar Laburo a la pantalla de inicio</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">
            <li>Abrí Laburo en Safari.</li>
            <li>Tocá el botón Compartir (el cuadrado con la flecha para arriba).</li>
            <li>Elegí “Agregar a inicio”.</li>
            <li>Abrí Laburo desde el ícono nuevo y volvé a esta pantalla.</li>
          </ol>
        </div>
      )}

      {estado === "no-soportado" && (
        <p className="rounded-xl bg-slate-100 p-4">
          Este navegador no permite avisos. Probá desde Google Chrome en tu celular o en la computadora.
        </p>
      )}

      <div aria-live="polite">
        {mensaje.ok && <p className="aviso-ok">{mensaje.ok}</p>}
        {mensaje.error && <p className="aviso-error" role="alert">{mensaje.error}</p>}
      </div>
    </div>
  );
}
