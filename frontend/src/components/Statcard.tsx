// ============================================================
// components/ui/StatusBadge.tsx
// Universal status pill used across Jobs, Proposals, Invoices.
// Replaces the 4+ local StatusBadge / StatusPill definitions.
// ============================================================

import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  icon?: React.ReactNode;
  accent?: boolean;
}

export default function StatCard({ label, value, icon, accent = false }: StatCardProps) {
  const iconBg = accent ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-600";

  return (
    <div className="rounded-2xl p-4 bg-white border border-gray-100 shadow-sm flex items-center gap-3">
      <div className={`w-10 h-10 flex items-center justify-center rounded-xl shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-xs text-gray-500">{label}</div>
        <div className="text-sm font-bold text-gray-900">{value}</div>
      </div>
    </div>
  );
}