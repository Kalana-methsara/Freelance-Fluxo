import React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "destructive" | "success" | "warning";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-muted text-foreground",
  secondary: "bg-secondary text-secondary-foreground",
  destructive: "bg-red-500 text-white",
  success: "bg-emerald-500 text-white",
  warning: "bg-amber-500 text-white",
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return <span {...props} className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", variantClasses[variant], className)} />;
}
