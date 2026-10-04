export function PageLoading() {
  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-8" aria-busy="true" aria-label="Đang tải dữ liệu">
      <div className="mb-8 space-y-3">
        <div className="h-9 w-64 animate-pulse rounded-lg bg-foreground/10" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded bg-foreground/5" />
      </div>
      <div className="space-y-4">
        {[0, 1, 2].map(item => (
          <div key={item} className="h-24 animate-pulse rounded-xl border border-border bg-card-bg/50" />
        ))}
      </div>
    </div>
  )
}
