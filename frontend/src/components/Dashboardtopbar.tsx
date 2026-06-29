interface DashboardTopbarProps {
  title: string;
  onOpenMenu: () => void;
  rightSlot?: React.ReactNode;
}

export default function DashboardTopbar({ title, onOpenMenu, rightSlot }: DashboardTopbarProps) {
  return (
    <header className="md:hidden sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b px-4 h-14 flex items-center justify-between gap-3">
      <button
        onClick={onOpenMenu}
        className="p-2 rounded-xl hover:bg-muted transition text-muted-foreground"
        aria-label="Open navigation"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path d="M3 12h18M3 6h18M3 18h18" />
        </svg>
      </button>
      <span className="text-sm font-semibold flex-1">{title}</span>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </header>
  );
}