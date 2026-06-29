import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: number | string;
  width?: number | string;
  count?: number;
  className?: string;
}

export function Skeleton({ className = "", height = 16, width = "100%", count = 1, ...props }: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      {...props}
      className={cn("rounded-md bg-muted animate-pulse", className)}
      style={{ width, height }}
    />
  ));

  return <>{skeletons}</>;
}
