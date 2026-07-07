
export const BRAND = {
  primary: "emerald",        
  primaryHex: "#059669",
  dark: "#001e00",           
  accent: "#10b981",
} as const;


const AVATAR_PALETTE = [
  "#059669", 
  "#7c3aed", 
  "#dc2626", 
  "#d97706", 
  "#0891b2", 
  "#db2777", 
  "#2563eb", 
];
export function avatarColorFor(id: string): string {
  if (!id) return AVATAR_PALETTE[0];
  const code = Array.from(id).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return AVATAR_PALETTE[code % AVATAR_PALETTE.length];
}


export const STATUS_STYLES: Record<string, string> = {
  open:          "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  active:        "bg-blue-50   text-blue-700    ring-blue-600/20",
  in_progress:   "bg-blue-50   text-blue-700    ring-blue-600/20",
  under_review:  "bg-amber-50  text-amber-700   ring-amber-600/20",
  completed:     "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  draft:         "bg-gray-100  text-gray-500    ring-gray-400/20",
  pending:       "bg-gray-100  text-gray-600    ring-gray-400/20",
  shortlisted:   "bg-violet-50 text-violet-700  ring-violet-600/20",
  approved:      "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  rejected:      "bg-red-50    text-red-700     ring-red-600/20",
  closed:        "bg-gray-100  text-gray-500    ring-gray-400/20",
};

export function getStatusStyle(status: string): string {
  return STATUS_STYLES[status?.toLowerCase()] ?? "bg-gray-100 text-gray-500 ring-gray-400/20";
}


export function formatDeadline(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const diff = Math.ceil((d.getTime() - Date.now()) / 86_400_000);
    if (diff < 0)  return "Overdue";
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    if (diff <= 7)  return `${diff}d left`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}