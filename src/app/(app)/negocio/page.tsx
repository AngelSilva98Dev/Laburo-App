import type { Metadata } from "next";
import { Formulario } from "@/components/formulario";
import { Encabezado } from "@/components/ui";
import { guardarNegocio } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { CONDICIONES_IVA } from "@/lib/formato";

export const metadata: Metadata = { title: "Mi negocio" };

export default async function MiNegocio() {
  const { negocio: n, usuario } = await requerirSesion();

  return (
    <>
      <Encabezado titulo="Mi negocio" bajada="Estos datos aparecen en los presupuestos y cobros que ven tus clientes." />

      <Formulario accion={guardarNegocio} boton="Guardar cambios">
        <div className="tarjeta space-y-5">
          <h2 className="text-lg font-bold">Datos de contacto</h2>
          <div>
            <label htmlFor="nombre" className="etiqueta">Nombre del negocio</label>
            <input id="nombre" name="nombre" required maxLength={80} className="campo" defaultValue={n.nombre} />
          </div>
          <div>
            <label htmlFor="rubro" className="etiqueta">¿A qué te dedicás? <span className="opcional">(opcional)</span></label>
            <input id="rubro" name="rubro" maxLength={80} className="campo" defaultValue={n.rubro} placeholder="Ej: Plomería y gas" />
          </div>
          <div>
            <label htmlFor="telefono" className="etiqueta">Tu celular con WhatsApp</label>
            <input id="telefono" name="telefono" type="tel" inputMode="tel" maxLength={40} className="campo" defaultValue={n.telefono} placeholder="Ej: 11 5555 1234" />
            <p className="ayuda">Tus clientes van a poder escribirte desde el presupuesto.</p>
          </div>
          <div>
            <label htmlFor="direccion" className="etiqueta">Dirección o zona <span className="opcional">(opcional)</span></label>
            <input id="direccion" name="direccion" maxLength={160} className="campo" defaultValue={n.direccion} placeholder="Ej: Caballito, CABA" />
          </div>
        </div>

        <div className="tarjeta space-y-5">
          <h2 className="text-lg font-bold">Para que te paguen</h2>
          <div>
            <label htmlFor="alias" className="etiqueta">Alias o CVU para transferencias</label>
            <input id="alias" name="alias" maxLength={60} className="campo" defaultValue={n.alias} autoCapitalize="none" autoCorrect="off" placeholder="Ej: rivera.instalaciones" />
            <p className="ayuda">El cliente lo ve en el cobro y lo copia con un toque. Sirve de cualquier banco o billetera.</p>
          </div>
          <div>
            <label htmlFor="link_pago" className="etiqueta">Link de pago de Mercado Pago <span className="opcional">(opcional)</span></label>
            <input id="link_pago" name="link_pago" type="url" inputMode="url" maxLength={300} className="campo" defaultValue={n.link_pago} placeholder="https://link.mercadopago.com.ar/…" />
            <p className="ayuda">Si tenés un link de pago, el cliente va a ver un botón para pagarte con tarjeta o dinero en cuenta.</p>
          </div>
        </div>

        <div className="tarjeta space-y-5">
          <h2 className="text-lg font-bold">Presupuestos</h2>
          <div>
            <label htmlFor="validez_dias" className="etiqueta">¿Cuántos días valen tus presupuestos?</label>
            <input id="validez_dias" name="validez_dias" type="number" inputMode="numeric" min="1" max="90" required className="campo" defaultValue={n.validez_dias} />
            <p className="ayuda">Lo podés cambiar en cada presupuesto. Lo más común es entre 5 y 15 días.</p>
          </div>
          <div>
            <label htmlFor="nota_pie" className="etiqueta">Texto que va al pie <span className="opcional">(opcional)</span></label>
            <textarea id="nota_pie" name="nota_pie" rows={3} maxLength={400} className="campo" defaultValue={n.nota_pie} placeholder="Ej: Trabajos con garantía de 6 meses. Gasista matriculado N° 1234." />
          </div>
        </div>

        <div className="tarjeta space-y-5">
          <h2 className="text-lg font-bold">Datos fiscales</h2>
          <div>
            <label htmlFor="condicion_iva" className="etiqueta">¿Cómo estás inscripto en ARCA (ex AFIP)?</label>
            <select id="condicion_iva" name="condicion_iva" className="campo" defaultValue={n.condicion_iva}>
              {Object.entries(CONDICIONES_IVA).map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
            <p className="ayuda">Si sos Responsable Inscripto, vas a poder sumar el IVA en tus presupuestos.</p>
          </div>
          <div>
            <label htmlFor="cuit" className="etiqueta">CUIT <span className="opcional">(opcional)</span></label>
            <input id="cuit" name="cuit" inputMode="numeric" maxLength={20} className="campo" defaultValue={n.cuit} placeholder="20-12345678-9" />
          </div>
        </div>
      </Formulario>

      <p className="mt-8 text-sm text-suave">Cuenta: {usuario.email}</p>
    </>
  );
}
