import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { TablaLineas } from "@/components/documentos";
import { BotonAccion, BotonCopiar, BotonImprimir, BotonWhatsApp, Formulario } from "@/components/formulario";
import { Icono } from "@/components/ui";
import { clienteAvisaPago, clienteAvisaPagoForm, responderPresupuesto } from "@/lib/acciones";
import { docPorToken, lineasDe, type Negocio } from "@/lib/datos";
import { fila } from "@/lib/db";
import { CONDICIONES_IVA, dinero, fechaCorta, hoyISO, linkWhatsApp, numeroDoc } from "@/lib/formato";

/** Página que ve el cliente desde el link de WhatsApp. No necesita cuenta ni instalar nada. */

export const metadata: Metadata = { title: "Tu presupuesto", robots: { index: false, follow: false } };

export default async function DocumentoPublico({ params }: { params: Promise<{ token: string }> }) {
  await connection();
  const { token } = await params;
  if (!/^[a-f0-9]{32}$/.test(token)) notFound();
  const doc = await docPorToken(token);
  if (!doc) notFound();
  const [negocio, lineas] = await Promise.all([
    fila<Negocio>("SELECT * FROM negocios WHERE id = ?", [doc.negocio_id]),
    lineasDe(doc.id),
  ]);
  if (!negocio) notFound();

  const hoy = hoyISO();
  const esPresupuesto = doc.tipo === "presupuesto";
  const nombreDoc = `${esPresupuesto ? "Presupuesto" : "Detalle de pago"} N° ${numeroDoc(doc.numero)}`;
  const saldo = Math.max(doc.total - doc.pagado, 0);
  const pagado = !esPresupuesto && saldo <= 0.005;
  const vencido = !!doc.vence && doc.vence < hoy;
  const puedeResponder = esPresupuesto && (doc.estado === "borrador" || doc.estado === "enviado") && !vencido;
  const aceptado = esPresupuesto && doc.estado === "aprobado";
  const consulta = linkWhatsApp(
    negocio.telefono,
    aceptado
      ? `Hola! Acepté el ${nombreDoc.toLowerCase()} de "${doc.titulo}". ¿Cuándo podemos coordinar?`
      : `Hola! Te escribo por el ${nombreDoc.toLowerCase()} de "${doc.titulo}".`,
  );
  const avisoPago = linkWhatsApp(negocio.telefono, `Hola! Ya hice el pago de "${doc.titulo}" (${dinero(saldo, doc.moneda)}). Te paso el comprobante.`);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6 sm:py-10">
      {/* Mensaje de estado: lo primero que ve el cliente */}
      {esPresupuesto && doc.estado === "aprobado" && (
        <p className="aviso-ok no-imprimir mb-4 flex items-center gap-2 text-lg"><Icono n="check" /> ¡Listo! Aceptaste este presupuesto. {negocio.nombre} se va a comunicar con vos para coordinar.</p>
      )}
      {esPresupuesto && doc.estado === "rechazado" && (
        <p className="aviso-error no-imprimir mb-4">Este presupuesto fue rechazado. Si cambiaste de idea, escribile a {negocio.nombre}.</p>
      )}
      {esPresupuesto && vencido && doc.estado !== "aprobado" && doc.estado !== "rechazado" && (
        <p className="no-imprimir mb-4 rounded-xl border-2 border-amber-200 bg-amber-50 px-4 py-3 font-medium text-amber-950">
          Este presupuesto venció el {fechaCorta(doc.vence)}. Pedile a {negocio.nombre} que te pase los precios actualizados.
        </p>
      )}
      {pagado && <p className="aviso-ok no-imprimir mb-4 flex items-center gap-2 text-lg"><Icono n="check" /> Este trabajo ya está pago. ¡Gracias!</p>}

      <article className="tarjeta p-5 sm:p-8">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b-2 border-slate-200 pb-5">
          <div>
            <p className="text-2xl font-bold tracking-tight">{negocio.nombre}</p>
            {negocio.rubro && <p className="text-suave">{negocio.rubro}</p>}
            <p className="mt-1 text-sm text-suave">
              {[negocio.telefono && `Tel. ${negocio.telefono}`, negocio.direccion].filter(Boolean).join(" · ")}
            </p>
            {negocio.cuit && (
              <p className="text-sm text-suave">
                CUIT {negocio.cuit}
                {negocio.condicion_iva !== "ninguna" && ` · ${CONDICIONES_IVA[negocio.condicion_iva] ?? ""}`}
              </p>
            )}
          </div>
          <div className="sm:text-right">
            <h1 className="text-lg font-bold">{nombreDoc}</h1>
            <p className="text-sm text-suave">Fecha: {fechaCorta(doc.fecha)}</p>
            {doc.vence && <p className="text-sm text-suave">{esPresupuesto ? "Válido hasta" : "Vence"}: {fechaCorta(doc.vence)}</p>}
          </div>
        </header>

        <div className="py-5">
          <p className="text-sm text-suave">Para</p>
          <p className="font-semibold">{doc.cliente_nombre}</p>
          <p className="mt-3 text-xl font-bold">{doc.titulo}</p>
        </div>

        <TablaLineas doc={doc} lineas={lineas} />

        {!esPresupuesto && doc.pagado > 0 && !pagado && (
          <dl className="mt-3 space-y-1">
            <div className="flex justify-between text-suave"><dt>Ya pagaste</dt><dd>– {dinero(doc.pagado, doc.moneda)}</dd></div>
            <div className="flex items-baseline justify-between text-xl font-bold text-marca-700"><dt>Falta pagar</dt><dd>{dinero(saldo, doc.moneda)}</dd></div>
          </dl>
        )}

        {doc.notas && <p className="mt-5 rounded-xl bg-slate-50 p-4 whitespace-pre-line">{doc.notas}</p>}
        {negocio.nota_pie && <p className="mt-4 text-sm whitespace-pre-line text-suave">{negocio.nota_pie}</p>}
        <p className="mt-6 border-t border-slate-200 pt-4 text-center text-xs tracking-wide text-suave uppercase">
          Documento no válido como factura
        </p>
      </article>

      {/* Qué puede hacer el cliente: una acción principal, bien clara */}
      <div className="no-imprimir mt-5 space-y-3">
        {puedeResponder && (
          <form action={responderPresupuesto}>
            <input type="hidden" name="token" value={doc.token} />
            <input type="hidden" name="respuesta" value="aprobado" />
            <BotonAccion className="btn btn-primario w-full text-lg" confirmar={`¿Confirmás que aceptás el presupuesto por ${dinero(doc.total, doc.moneda)}?`}>
              <Icono n="check" /> Aceptar presupuesto
            </BotonAccion>
          </form>
        )}

        {!esPresupuesto && !pagado && (negocio.alias || negocio.link_pago) && (
          <section className="tarjeta border-2 border-marca-200">
            <h2 className="text-lg font-bold">¿Cómo pagar?</h2>
            {negocio.alias && (
              <div className="mt-3">
                <p className="text-suave">Por transferencia, a este alias o CVU:</p>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-marca-50 p-3">
                  <p className="text-xl font-bold break-all">{negocio.alias}</p>
                  <BotonCopiar texto={negocio.alias}><Icono n="copiar" className="size-5" /> Copiar</BotonCopiar>
                </div>
              </div>
            )}
            {negocio.link_pago && (
              <a href={negocio.link_pago} target="_blank" rel="noopener noreferrer" className="btn btn-primario mt-4 w-full">
                Pagar con Mercado Pago
              </a>
            )}
            {negocio.telefono ? (
              <BotonWhatsApp href={avisoPago} alEnviar={clienteAvisaPago.bind(null, doc.token)} className="btn btn-wa mt-3 w-full">
                <Icono n="whatsapp" /> Avisar que ya pagué
              </BotonWhatsApp>
            ) : (
              <Formulario accion={clienteAvisaPagoForm} boton="Avisar que ya pagué" claseBoton="btn btn-wa w-full" className="mt-3 space-y-3">
                <input type="hidden" name="token" value={doc.token} />
              </Formulario>
            )}
          </section>
        )}

        {negocio.telefono && (
          <a href={consulta} target="_blank" rel="noopener noreferrer" className={`btn w-full ${puedeResponder || !esPresupuesto ? "btn-secundario" : "btn-wa"}`}>
            <Icono n="whatsapp" /> {aceptado ? `Avisarle a ${negocio.nombre} por WhatsApp` : "Tengo una consulta"}
          </a>
        )}
        <BotonImprimir><Icono n="imprimir" /> Imprimir o guardar como PDF</BotonImprimir>

        {puedeResponder && (
          <form action={responderPresupuesto} className="pt-2 text-center">
            <input type="hidden" name="token" value={doc.token} />
            <input type="hidden" name="respuesta" value="rechazado" />
            <BotonAccion className="min-h-11 cursor-pointer px-3 font-semibold text-suave underline underline-offset-2" confirmar="¿Seguro que no querés este presupuesto?">
              No me interesa este presupuesto
            </BotonAccion>
          </form>
        )}
      </div>

      <p className="no-imprimir mt-8 text-center text-sm text-suave">Hecho con Laburo</p>
    </main>
  );
}
