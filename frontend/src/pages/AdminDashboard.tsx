// AdminDashboard.tsx — Professional Admin Panel with Top Navigation & Preview Image

import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dashboardService, {
  type DashboardStats,
  type User,
  type Job,
  type Report,
} from "../services/dashboardService";
import authService from "../services/authService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";
import type { RootState } from "../redux/store";


const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2", "#db2777"];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const NAV_ITEMS = [
  { id: "overview", label: "Overview", icon: OverviewIcon },
  { id: "users", label: "Users", icon: UsersIcon },
  { id: "jobs", label: "Jobs", icon: JobsIcon },
  { id: "reports", label: "Reports", icon: ReportsIcon },
];

const STATUS_PILL: Record<string, string> = {
  approved: "bg-green-100 text-green-800 ring-green-600/20",
  rejected: "bg-red-100 text-red-700 ring-red-600/20",
  pending: "bg-amber-100 text-amber-700 ring-amber-600/20",
  open: "bg-blue-100 text-blue-700 ring-blue-600/20",
  closed: "bg-gray-100 text-gray-600 ring-gray-400/20",
  active: "bg-green-100 text-green-800 ring-green-600/20",
};

// ─── Types ────────────────────────────────────────────────────────────────────

type UserDetail = User & {
  profileImage?: string;
  title?: string;
  companyName?: string;
  bio?: string;
  skills?: string[];
  hourlyRate?: number;
  createdAt?: string;
  updatedAt?: string;
};

type JobDetail = Job & {
  description?: string;
  clientId?: { _id?: string; firstName?: string; lastName?: string; companyName?: string; email?: string };
  freelancerId?: { _id?: string; firstName?: string; lastName?: string; email?: string; title?: string; skills?: string[]; hourlyRate?: number; rating?: number; reviewCount?: number };
  categoryId?: { title?: string; icon?: string };
  deadline?: string;
};

type ToastType = "success" | "error" | "info";

// ─── Toast ────────────────────────────────────────────────────────────────────

let toastFn: ((message: string, type?: ToastType) => void) | null = null;
export const setToastGlobal = (fn: typeof toastFn) => { toastFn = fn; };
const toast = (message: string, type: ToastType = "info") => toastFn?.(message, type);

// ─── SVG Icons ────────────────────────────────────────────────────────────────

function OverviewIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function UsersIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function JobsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  );
}
function ReportsIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function ChevronRight({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
function EyeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  );
}
function TrashIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function SearchIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function LogoutIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function ShieldIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
function MenuIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const h = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(h);
  }, [value, delay]);
  return debounced;
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

const StatusPill = ({ status }: { status: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${STATUS_PILL[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 ring-gray-400/20"}`}>
    {status}
  </span>
);

const Avatar = ({ id, name, size = 8 }: { id: string; name: string; size?: number }) => (
  <div
    className={`w-${size} h-${size} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-white/10`}
    style={{ background: avatarColor(id) }}
  >
    {getInitials(name)}
  </div>
);

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

// ─── Confirmation Modal ──────────────────────────────────────────────────────

const ConfirmModal = ({
  isOpen, onClose, onConfirm, title, message,
}: {
  isOpen: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <TrashIcon className="w-5 h-5 text-red-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────

const ToastProvider = () => {
  const [toasts, setToasts] = useState<{ id: number; message: string; type: ToastType }[]>([]);
  useEffect(() => {
    setToastGlobal((msg, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message: msg, type: type || "info" }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
    });
  }, []);
  const icons: Record<ToastType, string> = { success: "✓", error: "✕", info: "i" };
  const colors: Record<ToastType, string> = {
    success: "bg-green-50 border-green-200 text-green-800",
    error: "bg-red-50 border-red-200 text-red-800",
    info: "bg-blue-50 border-blue-200 text-blue-800",
  };
  return (
    <div className="fixed bottom-6 right-6 z-[70] space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm text-sm font-medium shadow-lg min-w-[240px] ${colors[t.type]}`}
        >
          <span className="w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold flex-shrink-0 border-current">
            {icons[t.type]}
          </span>
          {t.message}
        </div>
      ))}
    </div>
  );
};

// ─── Loading ──────────────────────────────────────────────────────────────────

const LoadingSkeleton = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 rounded-full border-2 border-green-600 border-t-transparent animate-spin" />
      <p className="text-gray-500 text-sm">Loading dashboard…</p>
    </div>
  </div>
);

// ─── Stat Cards ───────────────────────────────────────────────────────────────

const StatCard = ({
  label, value, sub, accent = false, trend,
}: {
  label: string; value: number | string; sub?: string; accent?: boolean; trend?: string;
}) => (
  <div className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col gap-3 transition-all hover:shadow-md group
    ${accent
      ? "bg-green-600 border-green-500 text-white"
      : "bg-white border-gray-200 text-gray-900"
    }`}
  >
    {accent && (
      <div className="absolute -top-6 -right-6 w-28 h-28 rounded-full bg-white/20 blur-2xl pointer-events-none" />
    )}
    <p className={`text-xs font-medium uppercase tracking-widest ${accent ? "text-green-100" : "text-gray-500"}`}>
      {label}
    </p>
    <p className={`text-3xl font-bold tabular-nums ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
    {sub && (
      <p className={`text-xs ${accent ? "text-green-100" : "text-gray-500"}`}>{sub}</p>
    )}
    {trend && (
      <span className="text-[10px] font-semibold bg-green-100 text-green-700 px-2 py-0.5 rounded-full w-fit">
        {trend}
      </span>
    )}
  </div>
);

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab = ({ data }: { data: DashboardStats | null }) => (
  <div className="space-y-8">
  

    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Total Users" value={data?.totalUsers || 0} accent trend="+12% this month" />
      <StatCard label="Total Jobs" value={data?.totalJobs || 0} sub="Active listings" />
      <StatCard label="Open Reports" value={data?.openReports || 0} sub={data?.openReports ? "Requires attention" : "All clear"} />
      <StatCard label="Flagged Jobs" value={data?.flaggedJobs || 0} sub="Under review" />
    </div>

    <div className="grid lg:grid-cols-2 gap-6">
      <MiniList title="Recent Users" items={data?.recentUsers?.slice(0, 5)} type="user" />
      <MiniList title="Recent Jobs" items={data?.recentJobs?.slice(0, 5)} type="job" />
    </div>
  </div>
);

const MiniList = ({
  title, items, type,
}: {
  title: string; items?: any[]; type: "user" | "job";
}) => (
  <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
    <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
      <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
      <span className="text-xs text-gray-500">{items?.length ?? 0} entries</span>
    </div>
    <div className="divide-y divide-gray-100">
      {items?.length
        ? items.map((item: any) => (
          <div key={item._id} className="px-5 py-3 flex items-center justify-between gap-4 hover:bg-gray-50 transition">
            <div className="flex items-center gap-3 min-w-0">
              {type === "user" && (
                <Avatar id={item._id} name={`${item.firstName} ${item.lastName}`} size={8} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {type === "user" ? `${item.firstName} ${item.lastName}` : item.title}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {type === "user" ? item.email : `$${item.budget}`}
                </p>
              </div>
            </div>
            <StatusPill status={type === "user" ? item.approvalStatus : item.status} />
          </div>
        ))
        : (
          <div className="px-5 py-10 text-center text-gray-400 text-sm">No {type}s to show</div>
        )}
    </div>
  </div>
);

// ─── Users Tab ────────────────────────────────────────────────────────────────

const UsersTab = ({
  users, loading, search, setSearch, onApproval, onRoleChange, onDelete, onViewUser, isSuperAdmin,
}: {
  users: User[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  onApproval: (id: string, status: "approved" | "rejected") => void;
  onRoleChange: (id: string, role: "SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER", action: "add" | "remove") => void;
  onDelete: (id: string) => void;
  onViewUser: (id: string) => void;
  isSuperAdmin: boolean;
}) => (
  <div className="space-y-6">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-sm text-gray-500 mt-1">{users.length} users found</p>
      </div>
      <div className="relative w-full sm:w-72">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          placeholder="Search name or email…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 text-sm text-gray-800 placeholder-gray-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50 transition"
        />
      </div>
    </div>

    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              {["User", "Email", "Role", "Status", "Actions", ""].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-[10px] uppercase tracking-widest font-semibold text-gray-500">
                  {h}
                </th>
              ))}
             </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading
              ? Array(4).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-2.5 w-48" />
                      </div>
                    </div>
                   </td>
                 </tr>
              ))
              : users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <Avatar id={u._id} name={`${u.firstName} ${u.lastName}`} size={8} />
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                        {u.firstName} {u.lastName}
                      </span>
                    </div>
                   </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500 truncate max-w-[180px]">{u.email}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600 capitalize">{u.userRole.join(", ")}</td>
                  <td className="px-5 py-3.5"><StatusPill status={u.approvalStatus} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {u.approvalStatus !== "approved" && (
                        <ActionBtn color="green" onClick={() => onApproval(u._id, "approved")}>Approve</ActionBtn>
                      )}
                      {u.approvalStatus !== "rejected" && (
                        <ActionBtn color="red" onClick={() => onApproval(u._id, "rejected")}>Reject</ActionBtn>
                      )}
                      {isSuperAdmin &&
                        (["CLIENT", "FREELANCER", "ADMIN", "SUPER_ADMIN"] as const)
                          .filter(r => !u.userRole.includes(r))
                          .map(role => (
                            <ActionBtn key={`add-${role}`} color="blue" onClick={() => onRoleChange(u._id, role, "add")}>
                              +{role}
                            </ActionBtn>
                          ))
                      }
                      {isSuperAdmin && u.userRole.length > 1 &&
                        (u.userRole as ("SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER")[]).map(role => (
                          <ActionBtn key={`rm-${role}`} color="gray" onClick={() => onRoleChange(u._id, role, "remove")}>
                            −{role}
                          </ActionBtn>
                        ))
                      }
                    </div>
                   </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <IconBtn title="View details" onClick={() => onViewUser(u._id)}>
                        <EyeIcon className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn title="Delete user" danger onClick={() => onDelete(u._id)}>
                        <TrashIcon className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                   </td>
                </tr>
              ))
            }
          </tbody>
         </table>
      </div>
    </div>
  </div>
);

// ─── Jobs Tab ─────────────────────────────────────────────────────────────────

const JobsTab = ({
  jobs, loading, onDelete, onViewJob,
}: {
  jobs: Job[]; loading: boolean; onDelete: (id: string) => void; onViewJob: (id: string) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Job Listings</h1>
      <p className="text-sm text-gray-500 mt-1">{jobs.length} total jobs</p>
    </div>
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="divide-y divide-gray-100">
        {jobs.length
          ? jobs.map(j => (
            <div
              key={j._id}
              className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition cursor-pointer group"
              onClick={() => onViewJob(j._id)}
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-800 truncate group-hover:text-green-600 transition">{j.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Client: {(j.clientId as any)?.firstName || (j.clientId as any)?.companyName || "Anonymous"}
                  &nbsp;·&nbsp;Budget: ${j.budget}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusPill status={j.status} />
                <IconBtn
                  title="Delete job"
                  danger
                  onClick={e => { e.stopPropagation(); onDelete(j._id); }}
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </IconBtn>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition" />
              </div>
            </div>
          ))
          : <p className="text-center text-gray-400 text-sm py-12">No jobs to display</p>
        }
      </div>
    </div>
  </div>
);

// ─── Reports Tab ──────────────────────────────────────────────────────────────

const ReportsTab = ({
  reports, loading, onResolve,
}: {
  reports: Report[]; loading: boolean; onResolve: (id: string) => void;
}) => (
  <div className="space-y-6">
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Reported Issues</h1>
      <p className="text-sm text-gray-500 mt-1">{reports.filter(r => !r.resolved).length} open · {reports.filter(r => r.resolved).length} resolved</p>
    </div>
    <div className="grid gap-4">
      {reports.length
        ? reports.map(r => (
          <div key={r._id} className={`bg-white rounded-2xl border p-5 transition ${r.resolved ? "border-gray-200 opacity-70" : "border-amber-200 shadow-sm"}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 ring-1 ring-amber-600/20 px-2.5 py-0.5 rounded-full">
                  {r.type}
                </span>
                <span className="text-xs text-gray-500">{formatDate(r.createdAt)}</span>
              </div>
              {r.resolved
                ? <span className="text-xs font-medium text-green-600 flex items-center gap-1">✓ Resolved</span>
                : (
                  <button
                    onClick={() => onResolve(r._id)}
                    className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition flex-shrink-0"
                  >
                    Mark Resolved
                  </button>
                )
              }
            </div>
            <p className="text-sm text-gray-700 mt-3 leading-relaxed">{r.description}</p>
          </div>
        ))
        : <p className="text-center text-gray-400 text-sm py-12">No reports to display</p>
      }
    </div>
  </div>
);

// ─── Detail Drawer ────────────────────────────────────────────────────────────

const DetailDrawer = ({
  user, job, loading, onClose,
}: {
  user: UserDetail | null; job: JobDetail | null; loading: boolean; onClose: () => void;
}) => {
  if (!user && !job) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">
              {user ? "User Details" : "Job Details"}
            </p>
            <h3 className="text-lg font-semibold text-gray-900">
              {user ? `${user.firstName} ${user.lastName}` : job?.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl w-full" />)}
            </div>
          ) : user ? (
            <>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <Avatar id={user._id} name={`${user.firstName} ${user.lastName}`} size={14} />
                <div>
                  <p className="text-base font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusPill status={user.approvalStatus} />
                    {user.userRole.map(r => (
                      <span key={r} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{r}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <DetailField label="Title" value={user.title || "—"} />
                <DetailField label="Company" value={user.companyName || "—"} />
                <DetailField label="Joined" value={user.createdAt || "—"} />
                {user.hourlyRate != null && (
                  <DetailField label="Hourly Rate" value={`$${user.hourlyRate}/hr`} />
                )}
              </div>

              {user.bio && (
                <DrawerSection title="Bio">
                  <p className="text-sm text-gray-700 leading-relaxed">{user.bio}</p>
                </DrawerSection>
              )}
              {user.skills?.length ? (
                <DrawerSection title="Skills">
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map(s => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg">{s}</span>
                    ))}
                  </div>
                </DrawerSection>
              ) : null}
            </>
          ) : job ? (
            <>
              <div className="grid sm:grid-cols-2 gap-3">
                <DetailField label="Status" value={job.status} />
                <DetailField label="Budget" value={`$${job.budget}`} />
                <DetailField label="Deadline" value={job.deadline || "—"} />
                <DetailField label="Created" value={job.createdAt || "—"} />
              </div>
              <DrawerSection title="Client">
                <p className="text-sm text-gray-800 font-medium">
                  {job.clientId?.firstName
                    ? `${job.clientId.firstName} ${job.clientId.lastName || ""}`.trim()
                    : job.clientId?.companyName || "Unknown"}
                </p>
                <p className="text-xs text-gray-500 mt-1">{job.clientId?.email || "No email"}</p>
              </DrawerSection>
              {job.freelancerId && (
                <DrawerSection title="Freelancer">
                  <p className="text-sm text-gray-800 font-medium">
                    {job.freelancerId.firstName
                      ? `${job.freelancerId.firstName} ${job.freelancerId.lastName || ""}`.trim()
                      : job.freelancerId.title || "Freelancer"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{job.freelancerId.email || "No email"}</p>
                  {job.freelancerId.skills?.length ? (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {job.freelancerId.skills.map(s => (
                        <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  ) : null}
                </DrawerSection>
              )}
              {job.description && (
                <DrawerSection title="Description">
                  <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
                </DrawerSection>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const DetailField = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
    <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value || "—"}</p>
  </div>
);

const DrawerSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">{title}</p>
    <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">{children}</div>
  </div>
);

// ─── Small Button Helpers ─────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  green: "bg-green-100 text-green-700 hover:bg-green-200 ring-green-600/20",
  red: "bg-red-100 text-red-700 hover:bg-red-200 ring-red-600/20",
  blue: "bg-blue-100 text-blue-700 hover:bg-blue-200 ring-blue-600/20",
  gray: "bg-gray-100 text-gray-600 hover:bg-gray-200 ring-gray-400/20",
};

const ActionBtn = ({
  color = "gray", onClick, children,
}: {
  color?: string; onClick: () => void; children: React.ReactNode;
}) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ring-1 ring-inset transition ${ACTION_COLORS[color]}`}
  >
    {children}
  </button>
);

const IconBtn = ({
  onClick, title, danger = false, children,
}: {
  onClick?: (e: React.MouseEvent) => void; title?: string; danger?: boolean; children: React.ReactNode;
}) => (
  <button
    title={title}
    onClick={onClick}
    className={`w-7 h-7 flex items-center justify-center rounded-lg transition
      ${danger
        ? "text-gray-400 hover:bg-red-50 hover:text-red-600"
        : "text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      }`}
  >
    {children}
  </button>
);

// ─── Main Dashboard with Top Navigation & Preview Image ───────────────────────

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalState, setModalState] = useState<{
    open: boolean; id: string | null; type: string;
  }>({ open: false, id: null, type: "" });

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.roles?.some(r => String(r).toUpperCase() === "SUPER_ADMIN") ?? false;

  const debouncedSearch = useDebounce(searchTerm, 400);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setData(await dashboardService.getAdminDashboard());
    } catch {
      toast("Failed to load dashboard", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => {
    if (!data?.recentUsers) return [];
    if (!debouncedSearch) return data.recentUsers;
    const q = debouncedSearch.toLowerCase();
    return data.recentUsers.filter(u =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  }, [data?.recentUsers, debouncedSearch]);

  const handleLogout = () => { dispatch(logout()); navigate("/login"); };

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    try {
      await authService.updateUserApproval(userId, status);
      toast(`User ${status}`, "success");
      loadData();
    } catch { toast("Action failed", "error"); }
  };

  const handleRoleChange = async (
    userId: string,
    role: "SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER",
    action: "add" | "remove"
  ) => {
    if (action === "add" && role === "SUPER_ADMIN" && !isSuperAdmin) {
      return toast("Only super admin can assign this role", "error");
    }
    try {
      await authService.updateUserRole(userId, role, action);
      toast(`Role ${action === "add" ? "added" : "removed"}`, "success");
      loadData();
    } catch { toast("Role update failed", "error"); }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUser?.(userId);
      toast("User deleted", "success");
      loadData();
    } catch { toast("Delete failed", "error"); }
    setModalState({ open: false, id: null, type: "" });
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await dashboardService.deleteJob?.(jobId);
      toast("Job deleted", "success");
      loadData();
    } catch { toast("Delete failed", "error"); }
    setModalState({ open: false, id: null, type: "" });
  };

  const handleViewUser = async (userId: string) => {
    setDetailLoading(true);
    try { setSelectedUser(await authService.getUserById(userId)); }
    catch { toast("Could not load user", "error"); }
    finally { setDetailLoading(false); }
  };

  const handleViewJob = async (jobId: string) => {
    setDetailLoading(true);
    try { setSelectedJob(await dashboardService.getJobById(jobId)); }
    catch { toast("Could not load job", "error"); }
    finally { setDetailLoading(false); }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await dashboardService.resolveReport?.(reportId);
      toast("Report resolved", "success");
      loadData();
    } catch { toast("Failed to resolve", "error"); }
  };

  if (loading && !data) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <ToastProvider />
      <ConfirmModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, id: null, type: "" })}
        onConfirm={() => {
          if (modalState.type === "user") handleDeleteUser(modalState.id!);
          else if (modalState.type === "job") handleDeleteJob(modalState.id!);
        }}
        title={`Delete ${modalState.type}`}
        message={`This will permanently delete this ${modalState.type}. This action cannot be undone.`}
      />

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
                <ShieldIcon className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-bold text-gray-900 tracking-tight">
                freelance<span className="text-green-600">fluxo</span>
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveNav(item.id); setSearchTerm(""); }}
                    className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? "bg-green-50 text-green-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.id === "reports" && (data?.openReports ?? 0) > 0 && (
                      <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-4 px-1 text-[10px] font-bold bg-amber-100 text-amber-700 rounded-full ring-1 ring-white">
                        {data!.openReports}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                  {currentUser?.email?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate max-w-[150px]">{currentUser?.email}</p>
                  <p className="text-[10px] text-gray-500">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                >
                  <LogoutIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 transition"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile Sidebar Drawer ──────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl">
            <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">freelance<span className="text-green-600">fluxo</span></span>
              <button onClick={() => setSidebarOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => { setActiveNav(item.id); setSidebarOpen(false); setSearchTerm(""); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-green-50 text-green-700" : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                    {item.id === "reports" && (data?.openReports ?? 0) > 0 && (
                      <span className="ml-auto text-[10px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full">
                        {data!.openReports}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-100">
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50 mb-3">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                  {currentUser?.email?.[0]?.toUpperCase() ?? "A"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{currentUser?.email}</p>
                  <p className="text-[10px] text-gray-500">{isSuperAdmin ? "Super Admin" : "Admin"}</p>
                </div>
              </div>
              <button
                onClick={() => { handleLogout(); setSidebarOpen(false); }}
                className="w-full flex items-center gap-2 text-sm text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 transition"
              >
                <LogoutIcon className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="flex-1 pt-20 px-4 sm:px-6 lg:px-8 pb-8 max-w-screen-2xl mx-auto w-full">
        {/* Preview Image - Added as requested */}
        <div className="mb-8 rounded-2xl overflow-hidden shadow-sm border border-gray-200">
          <img 
            src="/web_page.png" 
            alt="Web page preview" 
            className="w-full h-auto object-cover"
          />
        </div>

        {activeNav === "overview" && <OverviewTab data={data} />}
        {activeNav === "users" && (
          <UsersTab
            users={filteredUsers}
            loading={loading}
            search={searchTerm}
            setSearch={setSearchTerm}
            onApproval={handleApproval}
            onRoleChange={handleRoleChange}
            onDelete={id => setModalState({ open: true, id, type: "user" })}
            onViewUser={handleViewUser}
            isSuperAdmin={isSuperAdmin}
          />
        )}
        {activeNav === "jobs" && (
          <JobsTab
            jobs={data?.recentJobs || []}
            loading={loading}
            onDelete={id => setModalState({ open: true, id, type: "job" })}
            onViewJob={handleViewJob}
          />
        )}
        {activeNav === "reports" && (
          <ReportsTab reports={data?.reports || []} loading={loading} onResolve={handleResolveReport} />
        )}
      </main>

      {/* ── Detail Drawer ───────────────────────────────────────────────── */}
      <DetailDrawer
        user={selectedUser}
        job={selectedJob}
        loading={detailLoading}
        onClose={() => { setSelectedUser(null); setSelectedJob(null); }}
      />
    </div>
  );
}