import type { Metadata } from "next";
import Link from "next/link";
import { Encabezado, Icono, Vacio } from "@/components/ui";
import { requerirSesion } from "@/lib/auth";
import { listarClientes } from "@/lib/datos";

export const metadata: Metadata = { title: "Clientes" };

export default async function Clientes({ searchParams }: { searchParams: Promise<{ buscar?: string }> }) {
  const { negocio } = await requerirSesion();
  const buscar = ((await searchParams).buscar ?? "").slice(0, 60);
  const clientes = await listarClientes(negocio.id, buscar);
  const hayClientes = clientes.length > 0 || buscar !== "";

  return (
    <>
      <Encabezado titulo="Clientes">
        {hayClientes && (
          <Link href="/clientes/nuevo" className="btn btn-primario w-full sm:w-auto">
            <Icono n="mas" /> Agregar cliente
          </Link>
        )}
      </Encabezado>

      {!hayClientes ? (
        <Vacio
          icono="clientes"
          titulo="Todavía no cargaste clientes"
          texto="Guardá acá a tus clientes con su celular y dirección. Después les mandás presupuestos por WhatsApp con un toque."
        >
          <Link href="/clientes/nuevo" className="btn btn-primario"><Icono n="mas" /> Agregar mi primer cliente</Link>
        </Vacio>
      ) : (
        <>
          <form role="search" className="mb-4 flex gap-2">
            <label htmlFor="buscar" className="sr-only">Buscar cliente</label>
            <input
              id="buscar"
              name="buscar"
              type="search"
              defaultValue={buscar}
              className="campo"
              placeholder="Buscar por nombre, celular o dirección"
              autoComplete="off"
            />
            <button type="submit" className="btn btn-secundario">Buscar</button>
          </form>

          {clientes.length === 0 ? (
            <div className="tarjeta py-8 text-center">
              <p className="text-suave">No encontramos ningún cliente con “{buscar}”.</p>
              <Link href="/clientes" className="btn btn-secundario mt-4">Ver todos</Link>
            </div>
          ) : (
            <ul className="lista">
              {clientes.map((c) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="fila">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-marca-100 text-lg font-bold text-marca-900" aria-hidden="true">
                      {c.nombre.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{c.nombre}</p>
                      <p className="truncate text-sm text-suave">{c.direccion || c.telefono || "Sin más datos"}</p>
                    </div>
                    <Icono n="derecha" className="size-5 text-slate-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
