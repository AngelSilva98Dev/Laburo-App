import { notFound } from "next/navigation";
import { guardarCliente } from "@/lib/acciones";
import { requerirAcceso } from "@/lib/auth";
import { obtenerCliente } from "@/lib/datos";
import { Formulario } from "./formulario";
import { Encabezado } from "./ui";

export async function FormularioCliente({ id }: { id?: string }) {
  const { negocio } = await requerirAcceso();
  const c = id ? await obtenerCliente(negocio.id, id) : null;
  if (id && !c) notFound();
  const volver = id ? `/clientes/${id}` : "/clientes";

  return (
    <>
      <Encabezado titulo={id ? "Editar cliente" : "Agregar un cliente"} volver={{ href: volver, texto: "Volver" }} />
      <Formulario accion={guardarCliente} boton={id ? "Guardar cambios" : "Guardar cliente"} cancelar={volver}>
        {id && <input type="hidden" name="id" value={id} />}
        <div className="tarjeta space-y-5">
          <div>
            <label htmlFor="nombre" className="etiqueta">Nombre</label>
            <input id="nombre" name="nombre" required maxLength={100} className="campo" defaultValue={c?.nombre} autoComplete="off" placeholder="Ej: Laura Gómez o Consorcio Yerbal 2350" />
          </div>
          <div>
            <label htmlFor="telefono" className="etiqueta">
              Celular <span className="opcional">(para mandarle WhatsApp)</span>
            </label>
            <input id="telefono" name="telefono" type="tel" inputMode="tel" maxLength={40} className="campo" defaultValue={c?.telefono} autoComplete="off" placeholder="Ej: 11 5555 1234" />
            <p className="ayuda">Con el código de área, sin el 0 y sin el 15.</p>
          </div>
          <div>
            <label htmlFor="direccion" className="etiqueta">
              Dirección <span className="opcional">(opcional)</span>
            </label>
            <input id="direccion" name="direccion" maxLength={160} className="campo" defaultValue={c?.direccion} autoComplete="off" placeholder="Calle, número y localidad" />
          </div>
        </div>

        <details className="desplegable tarjeta py-0" open={!!(c?.email || c?.documento || c?.notas)}>
          <summary>Más datos (email, CUIT, notas)</summary>
          <div className="space-y-5 pb-4">
            <div>
              <label htmlFor="email" className="etiqueta">Email</label>
              <input id="email" name="email" type="email" inputMode="email" maxLength={120} className="campo" defaultValue={c?.email} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="documento" className="etiqueta">CUIT, CUIL o DNI</label>
              <input id="documento" name="documento" inputMode="numeric" maxLength={20} className="campo" defaultValue={c?.documento} autoComplete="off" />
            </div>
            <div>
              <label htmlFor="notas" className="etiqueta">Notas</label>
              <textarea id="notas" name="notas" rows={3} maxLength={1000} className="campo" defaultValue={c?.notas} placeholder="Ej: Tiene perro. Prefiere que vayamos a la tarde." />
            </div>
          </div>
        </details>
      </Formulario>
    </>
  );
}
