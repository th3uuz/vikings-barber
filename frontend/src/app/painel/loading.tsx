export default function Loading() {
  return (
    <div className="grid gap-4" aria-busy="true" aria-live="polite">
      <div className="h-9 w-48 animate-pulse rounded-md bg-coal-800" />
      <div className="h-40 animate-pulse rounded-xl bg-coal-900" />
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
