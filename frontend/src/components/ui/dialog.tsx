import React from "react";

interface DialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

export function Dialog({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function DialogContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return <h2>{children}</h2>;
}

export function DialogTrigger({ children }: DialogTriggerProps) {
  return <>{children}</>;
}
