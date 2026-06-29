import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
  className?: string;
}

export default function StatCard({ label, value, icon, accent = false, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 transition hover:shadow-md",
        accent ? "bg-primary text-primary-foreground border-primary" : "bg-card text-card-foreground",
        className
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <p className={cn("text-xs font-medium", accent ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {label}
        </p>
        <div className={cn("p-2 rounded-xl", accent ? "bg-primary-foreground/20" : "bg-muted")}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}