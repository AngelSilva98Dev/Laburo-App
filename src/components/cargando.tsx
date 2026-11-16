/** Se muestra al instante mientras llegan los datos, para que nunca parezca trabado. */
export default function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="animate-pulse space-y-4">
      <div className="h-9 w-48 rounded-lg bg-slate-200" />
      <div className="h-24 rounded-2xl bg-slate-200" />
      <div className="h-16 rounded-2xl bg-slate-200" />
      <div className="h-16 rounded-2xl bg-slate-200" />
    </div>
  );
}
