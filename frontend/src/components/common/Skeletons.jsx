export function ProductCardSkeleton() {
  return (
    <div className="card animate-pulse">
      <div className="aspect-square bg-ink-100 rounded-t-2xl" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-ink-100 rounded-full w-16" />
        <div className="h-4 bg-ink-100 rounded-full w-3/4" />
        <div className="h-4 bg-ink-100 rounded-full w-1/2" />
        <div className="flex justify-between items-center">
          <div className="h-6 bg-ink-100 rounded-full w-20" />
          <div className="w-9 h-9 bg-ink-100 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="animate-pulse grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-7xl mx-auto px-4 py-12">
      <div className="aspect-square bg-ink-100 rounded-3xl" />
      <div className="space-y-5">
        <div className="h-5 bg-ink-100 rounded-full w-24" />
        <div className="h-10 bg-ink-100 rounded-2xl w-3/4" />
        <div className="h-8 bg-ink-100 rounded-full w-28" />
        <div className="space-y-2">
          <div className="h-4 bg-ink-100 rounded-full" />
          <div className="h-4 bg-ink-100 rounded-full" />
          <div className="h-4 bg-ink-100 rounded-full w-2/3" />
        </div>
        <div className="h-12 bg-ink-100 rounded-full" />
      </div>
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="card p-5 animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="h-5 bg-ink-100 rounded-full w-32" />
        <div className="h-5 bg-ink-100 rounded-full w-20" />
      </div>
      <div className="h-4 bg-ink-100 rounded-full w-48" />
      <div className="h-4 bg-ink-100 rounded-full w-24" />
    </div>
  );
}
