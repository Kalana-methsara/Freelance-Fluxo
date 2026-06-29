import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="text-xs text-muted-foreground">Loading…</p>
      </div>
    </div>
  );
}

export function SkeletonLine({ width = "w-full", height = "h-3" }: { width?: string; height?: string }) {
  return <div className={cn(width, height, "bg-muted rounded-lg animate-pulse")} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-card border rounded-2xl p-5 space-y-3">
      <Skeleton height={20} width="60%" />
      <Skeleton height={14} count={2} />
      <div className="flex gap-2 pt-1">
        <Skeleton height={20} width={60} />
        <Skeleton height={20} width={60} />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border rounded-2xl p-5 space-y-3">
            <Skeleton height={12} width="50%" />
            <Skeleton height={24} width="75%" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}