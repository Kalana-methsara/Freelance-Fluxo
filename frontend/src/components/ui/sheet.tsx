import React from "react";

interface SheetProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  side?: string;
}

interface SheetTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: string;
}

export function Sheet({ children, className = "", ...props }: SheetProps) {
  return (
    <div {...props} className={className}>
      {children}
    </div>
  );
}

export function SheetTrigger({ children }: SheetTriggerProps) {
  return <>{children}</>;
}

export function SheetContent({ children, className = "", ...props }: SheetContentProps) {
  return (
    <div {...props} className={className}>
      {children}
    </div>
  );
}
