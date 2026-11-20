import type { Metadata } from "next";
import Link from "next/link";
import { BotonWhatsApp } from "@/components/formulario";
import { Encabezado, Icono, Vacio } from "@/components/ui";
import { marcarRecordado } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { cobrosAtrasados } from "@/lib/datos";
import { diasEntre, dinero, fechaCorta, hoyISO, linkWhatsApp, mensajeCobro } from "@/lib/formato";
import { urlBase } from "@/lib/suscripcion";

export const metadata: Metadata = { title: "Cobros atrasados" };

/**
 * Todos los que deben, en una sola pantalla, con un botón de WhatsApp para cada uno.
 * WhatsApp no deja mandar a varios de una vez: se toca uno por uno, y cada uno
 * queda marcado como "recordado hoy" para no repetir.
 */
export default async function CobrosAtrasados() {
  const { negocio } = await requerirSesion();
  const hoy = hoyISO();
  const [atrasados, base] = await Promise.all([cobrosAtrasados(negocio.id, hoy), urlBase()]);
  const pendientes = atrasados.filter((d) => d.ultimo_recordatorio !== hoy).length;
  const total = atrasados.filter((d) => d.moneda === "ARS").reduce((s, d) => s + d.total - d.pagado, 0);

  return (
    <>
      <Encabezado
        titulo="Cobros atrasados"
        volver={{ href: "/cobros", texto: "Cobros" }}
        bajada={
          atrasados.length > 0
            ? pendientes > 0
              ? `Tocá el botón verde de cada uno: se abre WhatsApp con el mensaje ya escrito. Te quedan ${pendientes} por recordar hoy.`
              : "Ya les recordaste a todos hoy. ¡Bien ahí!"
            : undefined
        }
      />

      {atrasados.length === 0 ? (
        <Vacio icono="check" titulo="Nadie está atrasado" texto="Cuando un cobro pase su fecha sin pagarse, va a aparecer acá para que se lo recuerdes.">
          <Link href="/cobros" className="btn btn-secundario">Ver todos los cobros</Link>
        </Vacio>
      ) : (
        <>
          {total > 0 && (
            <div className="mb-4 rounded-2xl bg-destacado p-4 text-white">
              <p className="text-white/80">Atrasado en total</p>
              <p className="text-3xl font-bold tracking-tight">{dinero(total)}</p>
            </div>
          )}
          <ul className="space-y-3">
            {atrasados.map((d) => {
              const recordado = d.ultimo_recordatorio === hoy;
              const dias = diasEntre(d.vence ?? hoy, hoy);
              return (
                <li key={d.id} className="tarjeta">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link href={`/cobros/${d.id}`} className="font-semibold text-marca-700 underline underline-offset-2">
                        {d.cliente_nombre}
                      </Link>
                      <p className="truncate text-sm text-suave">{d.titulo}</p>
                      <p className="text-sm text-red-800">
                        Venció el {fechaCorta(d.vence)} · hace {dias === 1 ? "1 día" : `${dias} días`}
                      </p>
                    </div>
                    <p className="text-lg font-bold whitespace-nowrap">{dinero(d.total - d.pagado, d.moneda)}</p>
                  </div>
                  {!d.cliente_telefono ? (
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                      Este cliente no tiene celular cargado.{" "}
                      <Link href={`/clientes/${d.cliente_id}/editar`} className="font-semibold text-marca-700 underline">Agregalo</Link>
                    </p>
                  ) : recordado ? (
                    <p className="mt-3 flex items-center gap-2 font-semibold text-emerald-900">
                      <Icono n="check" className="size-5" /> Ya le recordaste hoy
                    </p>
                  ) : (
                    <BotonWhatsApp
                      href={linkWhatsApp(d.cliente_telefono, mensajeCobro(d, negocio.nombre, `${base}/p/${d.token}`, hoy))}
                      alEnviar={marcarRecordado.bind(null, d.id)}
                      className="btn btn-wa mt-3 w-full"
                    >
                      <Icono n="whatsapp" /> Recordarle a {d.cliente_nombre.split(" ")[0]}
                    </BotonWhatsApp>
                  )}
                  {d.ultimo_recordatorio && !recordado && (
                    <p className="ayuda">Último recordatorio: {fechaCorta(d.ultimo_recordatorio)}</p>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
