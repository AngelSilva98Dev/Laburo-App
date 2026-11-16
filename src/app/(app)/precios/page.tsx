import type { Metadata } from "next";
import { BotonAccion, Formulario } from "@/components/formulario";
import { Encabezado, TituloSeccion } from "@/components/ui";
import { ajustarPrecios, borrarPrecio, guardarPrecio } from "@/lib/acciones";
import { requerirSesion } from "@/lib/auth";
import { listarPrecios } from "@/lib/datos";
import { dinero } from "@/lib/formato";

export const metadata: Metadata = { title: "Lista de precios" };

export default async function Precios() {
  const { negocio } = await requerirSesion();
  const precios = await listarPrecios(negocio.id);

  return (
    <>
      <Encabezado
        titulo="Lista de precios"
        bajada="Tus servicios y materiales más comunes. Después los elegís al armar un presupuesto, sin volver a escribirlos."
      />

      <div className="tarjeta">
        <h2 className="mb-3 text-lg font-bold">Agregar a la lista</h2>
        <Formulario accion={guardarPrecio} boton="Agregar" limpiarAlGuardar className="space-y-4">
          <div>
            <label htmlFor="nombre" className="etiqueta">Servicio o material</label>
            <input id="nombre" name="nombre" required maxLength={120} className="campo" autoComplete="off" placeholder="Ej: Hora de mano de obra" />
          </div>
          <div>
            <label htmlFor="precio" className="etiqueta">Precio ($)</label>
            <input id="precio" name="precio" type="number" inputMode="decimal" min="0" step="any" required className="campo" placeholder="0" />
          </div>
        </Formulario>
      </div>

      {precios.length > 0 && (
        <>
          <TituloSeccion>Tus precios ({precios.length})</TituloSeccion>
          <ul className="lista">
            {precios.map((p) => (
              <li key={p.id}>
                <details className="group">
                  <summary className="fila cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                    <span className="min-w-0 flex-1 font-semibold break-words">{p.nombre}</span>
                    <span className="font-bold whitespace-nowrap">{dinero(p.precio)}</span>
                    <span className="text-sm font-semibold text-marca-700 group-open:hidden">Cambiar</span>
                    <span className="hidden text-sm font-semibold text-marca-700 group-open:inline">Cerrar</span>
                  </summary>
                  <div className="space-y-3 border-t border-slate-200 bg-slate-50 p-4">
                    <Formulario accion={guardarPrecio} boton="Guardar" className="space-y-3" key={`${p.nombre}-${p.precio}`}>
                      <input type="hidden" name="id" value={p.id} />
                      <div>
                        <label htmlFor={`n-${p.id}`} className="etiqueta">Servicio o material</label>
                        <input id={`n-${p.id}`} name="nombre" required maxLength={120} className="campo" defaultValue={p.nombre} autoComplete="off" />
                      </div>
                      <div>
                        <label htmlFor={`p-${p.id}`} className="etiqueta">Precio ($)</label>
                        <input id={`p-${p.id}`} name="precio" type="number" inputMode="decimal" min="0" step="any" required className="campo" defaultValue={p.precio} />
                      </div>
                    </Formulario>
                    <form action={borrarPrecio}>
                      <input type="hidden" name="id" value={p.id} />
                      <BotonAccion className="btn btn-peligro w-full sm:w-auto" confirmar={`¿Seguro que querés quitar "${p.nombre}" de tu lista?`}>
                        Quitar de la lista
                      </BotonAccion>
                    </form>
                  </div>
                </details>
              </li>
            ))}
          </ul>

          <TituloSeccion>Actualizar todos los precios juntos</TituloSeccion>
          <div className="tarjeta border-2 border-amber-200 bg-amber-50">
            <p className="mb-4 text-amber-950">
              ¿Subieron los costos? Aumentá toda tu lista de una vez. Los presupuestos que ya mandaste no cambian.
            </p>
            <Formulario accion={ajustarPrecios} boton="Aumentar todos los precios" limpiarAlGuardar className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="porcentaje" className="etiqueta">¿Cuánto? (%)</label>
                  <input id="porcentaje" name="porcentaje" type="number" inputMode="decimal" step="any" required className="campo" placeholder="Ej: 10" />
                </div>
                <div>
                  <label htmlFor="redondeo" className="etiqueta">Redondear a</label>
                  <select id="redondeo" name="redondeo" className="campo" defaultValue="100">
                    <option value="1">$ 1</option>
                    <option value="10">$ 10</option>
                    <option value="100">$ 100</option>
                    <option value="1000">$ 1.000</option>
                  </select>
                </div>
              </div>
            </Formulario>
          </div>
        </>
      )}
    </>
  );
}
