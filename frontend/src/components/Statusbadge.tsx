import { memo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

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

const statusVariantMap: Record<string, "default" | "secondary" | "destructive" | "success" | "warning"> = {
  open: "success",
  in_progress: "default",
  under_review: "warning",
  completed: "success",
  cancelled: "destructive",
  pending: "secondary",
  hired: "success",
  shortlisted: "default",
  rejected: "destructive",
  withdrawn: "secondary",
};

const sizeClassMap = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-2.5 py-0.5",
  lg: "text-base px-3 py-1",
};

const StatusBadge = memo(({ status, size = "md", showDot = true }: StatusBadgeProps) => {
  const variant = statusVariantMap[status] || "secondary";
  const label = status.replace(/_/g, " ");

  return (
    <Badge variant={variant} className={cn(sizeClassMap[size], "capitalize")}> 
      {showDot && <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </Badge>
  );
});

StatusBadge.displayName = "StatusBadge";
export default StatusBadge;