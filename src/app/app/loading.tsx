export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-5 pt-14 sm:px-8 lg:px-12" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-40 animate-pulse rounded-xs bg-white/[0.06]" />
      <div className="mt-5 h-12 w-3/4 animate-pulse rounded-sm bg-white/[0.05]" />
      <div className="mt-10 h-40 animate-pulse rounded-xl bg-white/[0.04]" />
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <div className="h-40 animate-pulse rounded-card bg-white/[0.035]" />
        <div className="h-40 animate-pulse rounded-card bg-white/[0.035]" />
      </div>
    </div>
  );
}
