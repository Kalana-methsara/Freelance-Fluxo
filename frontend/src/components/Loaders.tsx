// ============================================================
// components/ui/Loaders.tsx
// Replaces scattered inline skeleton / spinner JSX.
// ============================================================

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="text-xs text-gray-400">Loading…</p>
      </div>
    </div>
  );
}

export function SkeletonLine({ width = "w-full", height = "h-3" }: { width?: string; height?: string }) {
  return <div className={`${width} ${height} bg-gray-100 rounded-lg animate-pulse`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3 animate-pulse">
      <SkeletonLine width="w-2/3" height="h-4" />
      <SkeletonLine width="w-full" height="h-3" />
      <SkeletonLine width="w-4/5" height="h-3" />
      <div className="flex gap-2 pt-1">
        <SkeletonLine width="w-16" height="h-5" />
        <SkeletonLine width="w-16" height="h-5" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 space-y-3">
            <SkeletonLine width="w-1/2" height="h-3" />
            <SkeletonLine width="w-3/4" height="h-6" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => <CardSkeleton key={i} />)}
      </div>
    </div>
  );
}