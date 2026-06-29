import React from "react";
import { cn } from "@/lib/utils";

export function ScrollArea({ className = "", children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("overflow-auto", className)}>
      {children}
    </div>
  );
}
