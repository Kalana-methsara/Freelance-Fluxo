import { memo } from "react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Menu, Moon, Sun, LogOut } from "lucide-react";
import Logo from "./Logo";

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

interface DashboardNavProps {
  items: NavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  user?: { firstName: string; lastName: string; email: string };
  onLogout?: () => void;
  topAction?: React.ReactNode;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const DashboardNav = memo(({
  items,
  activeId,
  onSelect,
  user,
  onLogout,
  topAction,
  mobileOpen,
  onCloseMobile,
}: DashboardNavProps) => {
  const { theme, setTheme } = useTheme();

  const NavContent = () => (
    <div className="flex h-full flex-col">
      <div className="border-b px-5 py-4 flex items-center justify-between">
        <Logo size="md" />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {topAction && <div className="px-4 pt-4">{topAction}</div>}

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-0.5">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <TooltipProvider key={item.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => {
                        onSelect(item.id);
                        onCloseMobile?.();
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <span className={cn("shrink-0", isActive && "text-primary")}>
                        {item.icon}
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span className="ml-auto text-[10px] bg-primary text-primary-foreground font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {item.badge > 99 ? "99+" : item.badge}
                        </span>
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{item.label}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </nav>
      </ScrollArea>

      {user && (
        <div className="border-t px-4 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
              {(user.firstName[0] ?? "") + (user.lastName[0] ?? "")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
            </div>
            {onLogout && (
              <Button variant="ghost" size="icon" onClick={onLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 h-screen sticky top-0 flex-col border-r bg-background overflow-hidden">
        <NavContent />
      </aside>

      {/* Mobile drawer */}
      <Sheet open={mobileOpen} onOpenChange={onCloseMobile}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <NavContent />
        </SheetContent>
      </Sheet>
    </>
  );
});

DashboardNav.displayName = "DashboardNav";
export default DashboardNav;