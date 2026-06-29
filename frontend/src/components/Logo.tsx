import { cn } from "@/lib/utils";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function Logo({ size = "md", className = "" }: LogoProps) {
  const cls = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl sm:text-3xl",
  }[size];

  return (
    <span className={cn(cls, "font-bold tracking-tight", className)}>
      <span className="text-primary">freelance</span>
      <span className="text-foreground">fluxo</span>
    </span>
  );
}