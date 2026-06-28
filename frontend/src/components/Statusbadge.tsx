// =============================================================
// src/components/ui/StatusBadge.tsx
// =============================================================
// Single source of truth for all status pills.
// Usage:
//   <StatusBadge status="in_progress" />
//   <StatusBadge status="hired" size="lg" />
// =============================================================

import { memo } from "react";

type Status =
  | "open"
  | "in_progress"
  | "under_review"
  | "completed"
  | "cancelled"
  | "pending"
  | "hired"
  | "shortlisted"
  | "rejected"
  | "withdrawn";

interface StatusBadgeProps {
  status: Status | string;
  size?: "sm" | "md" | "lg";
  showDot?: boolean;
}

const CONFIG: Record<string, { label: string; classes: string; dot: string }> = {
  open:         { label: "Open",          classes: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
  in_progress:  { label: "In Progress",   classes: "bg-blue-50 text-blue-700 border-blue-100",          dot: "bg-blue-500" },
  under_review: { label: "Under Review",  classes: "bg-amber-50 text-amber-700 border-amber-100",       dot: "bg-amber-500" },
  completed:    { label: "Completed",     classes: "bg-teal-50 text-teal-700 border-teal-100",           dot: "bg-teal-500" },
  cancelled:    { label: "Cancelled",     classes: "bg-gray-100 text-gray-500 border-gray-200",         dot: "bg-gray-400" },
  pending:      { label: "Pending",       classes: "bg-gray-100 text-gray-600 border-gray-200",         dot: "bg-gray-400" },
  hired:        { label: "Hired",         classes: "bg-violet-50 text-violet-700 border-violet-100",    dot: "bg-violet-500" },
  shortlisted:  { label: "Shortlisted",   classes: "bg-sky-50 text-sky-700 border-sky-100",             dot: "bg-sky-500" },
  rejected:     { label: "Rejected",      classes: "bg-red-50 text-red-600 border-red-100",             dot: "bg-red-400" },
  withdrawn:    { label: "Withdrawn",     classes: "bg-gray-100 text-gray-500 border-gray-200",         dot: "bg-gray-400" },
};

const SIZE_CLASSES = {
  sm: "px-2 py-0.5 text-[10px]",
  md: "px-2.5 py-0.5 text-xs",
  lg: "px-3 py-1 text-sm",
};

const DOT_SIZES = { sm: "w-1 h-1", md: "w-1.5 h-1.5", lg: "w-2 h-2" };

const StatusBadge = memo(({ status, size = "md", showDot = true }: StatusBadgeProps) => {
  const cfg = CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    classes: "bg-gray-100 text-gray-600 border-gray-200",
    dot: "bg-gray-400",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border capitalize ${cfg.classes} ${SIZE_CLASSES[size]}`}
    >
      {showDot && (
        <span className={`rounded-full shrink-0 ${cfg.dot} ${DOT_SIZES[size]}`} />
      )}
      {cfg.label}
    </span>
  );
});

StatusBadge.displayName = "StatusBadge";
export default StatusBadge;