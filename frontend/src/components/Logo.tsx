// ============================================================
// components/ui/Logo.tsx
// Brand wordmark — used in Navbar, Footer, auth pages.
// ============================================================

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
    <span className={`${cls} font-bold tracking-tight ${className}`}>
      <span className="text-emerald-600">freelance</span>
      <span className="text-gray-900">fluxo</span>
    </span>
  );
}