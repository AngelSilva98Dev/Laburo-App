export default function Cargando() {
  return (
    <div role="status" className="mx-auto max-w-2xl animate-pulse space-y-4 px-4 py-8">
      <span className="sr-only">Cargando…</span>
      <div className="h-10 w-56 rounded-lg bg-slate-200" />
      <div className="h-72 rounded-2xl bg-slate-200" />
    </div>
  );
}
