// ============================================================
// components/layout/DashboardNav.tsx
// Vertical sidebar navigation shared by ClientDashboard and
// FreelancerDashboard. Replaces two separate near-identical
// nav implementations. Accepts items + activeId as props.
// ============================================================

import { memo } from "react";
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
  /** User pill at the bottom */
  user?: { firstName: string; lastName: string; email: string };
  onLogout?: () => void;
  /** Extra items (e.g. "Post a job" CTA) shown above nav items */
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
  const content = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <Logo size="md" />
        {onCloseMobile && (
          <button onClick={onCloseMobile} className="md:hidden p-1 rounded text-gray-400 hover:text-gray-700">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      {/* Top action slot */}
      {topAction && <div className="px-4 pt-4">{topAction}</div>}

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => { onSelect(item.id); onCloseMobile?.(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className={`shrink-0 ${isActive ? "text-emerald-600" : "text-gray-400"}`}>
                {item.icon}
              </span>
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto text-[10px] bg-emerald-600 text-white font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User pill */}
      {user && (
        <div className="border-t border-gray-100 px-4 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center shrink-0">
              {(user.firstName[0] ?? "") + (user.lastName[0] ?? "")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-900 truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user.email}</p>
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Log out"
                className="text-gray-300 hover:text-red-500 transition shrink-0 p-1"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 shrink-0 h-screen sticky top-0 flex-col border-r border-gray-100 bg-white overflow-hidden">
        {content}
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
            onClick={onCloseMobile}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl md:hidden flex flex-col">
            {content}
          </aside>
        </>
      )}
    </>
  );
});

DashboardNav.displayName = "DashboardNav";
export default DashboardNav;