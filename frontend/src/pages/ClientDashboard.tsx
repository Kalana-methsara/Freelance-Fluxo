// ================================================================
// ClientDashboard.tsx – Merged: Doc2 structure + Doc1 features + Top Nav
// ================================================================

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
  useRef,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import toast from "react-hot-toast";

import dashboardService from "../services/dashboardService";
import jobService from "../services/jobService";
import chatService from "../services/chatService";
import platformService from "../services/platformService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";
import ChatConversationList from "../components/ChatConversationList";
import ChatRoom from "../components/ChatRoom";

// ================================================================
// 1. TYPES
// ================================================================

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
  bio?: string;
  profileImage?: string;
  website?: string;
  industry?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface Project {
  _id: string;
  title: string;
  budget: number;
  spent: number;
  status: string;
  deadline: string;
  description?: string;
  createdAt?: string;
  postedBy?: string | { _id: string };
  clientId?: string | { _id: string };
  ownerId?: string | { _id: string };
  freelancerId?: { _id: string; firstName: string; lastName: string };
}

interface Applicant {
  _id: string;
  jobId?: { _id: string; title: string; budget?: number; status?: string };
  freelancerId?: {
    _id: string;
    firstName: string;
    lastName: string;
    title?: string;
    profileImage?: string;
    skills?: string[];
    hourlyRate?: number;
    rating?: number;
    reviewCount?: number;
  };
  bid: number;
  coverLetter?: string;
  status: string;
}

interface Invoice {
  _id: string;
  project: string;
  amount: number;
  paid: boolean;
  date: string;
}

interface DashboardData {
  user: User;
  stats: {
    totalBudget: number;
    totalSpent: number;
    activeProjects: number;
    pendingInvoices: number;
  };
  projects: Project[];
  applicants: Applicant[];
  invoices: Invoice[];
}

interface FreelancerPreview {
  _id: string;
  firstName: string;
  lastName: string;
  title?: string;
  rating?: number;
  reviewCount?: number;
  hourlyRate?: number;
  skills?: string[];
}

// ================================================================
// 2. CONSTANTS & HELPERS
// ================================================================

const NAV_ITEMS = [
  { label: "Overview",   id: "overview"   },
  { label: "Projects",   id: "projects"   },
  { label: "Applicants", id: "applicants" },
  { label: "Invoices",   id: "invoices"   },
  { label: "Messages",   id: "messages"   },
  { label: "Profile",    id: "profile"    },
] as const;

type NavId = (typeof NAV_ITEMS)[number]["id"];

const STATUS_STYLES: Record<string, string> = {
  active:       "bg-blue-50 text-blue-700",
  in_progress:  "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  completed:    "bg-emerald-50 text-emerald-700",
  draft:        "bg-gray-100 text-gray-500",
  open:         "bg-blue-50 text-blue-700",
  pending:      "bg-amber-50 text-amber-600",
  shortlisted:  "bg-emerald-50 text-emerald-700",
};

const AVATAR_COLORS = ["#10b981","#3b82f6","#f59e0b","#ef4444","#8b5cf6","#06b6d4"];

function getStatusStyle(s: string) { return STATUS_STYLES[s] || "bg-gray-100 text-gray-600"; }
function renderStars(r: number) { const n = Math.round(r); return "★".repeat(n) + "☆".repeat(5 - n); }
function formatCurrency(n: number) { return `$${(n || 0).toLocaleString()}`; }

function getProjectOwnerId(p: Project): string {
  const x = (f: any) => (f && typeof f === "object" ? f._id ?? "" : String(f ?? ""));
  return x(p.postedBy) || x(p.clientId) || x(p.ownerId) || "";
}

// ================================================================
// 3. ICONS
// ================================================================

const Icons = {
  Overview:   () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  Projects:   () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>,
  Applicants: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Invoices:   () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z"/></svg>,
  Messages:   () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  Message:    () => <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>,
  Logout:     () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Profile:    () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg>,
  Trash:      () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>,
  Plus:       () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 5v14M5 12h14"/></svg>,
  Menu:       () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  X:          () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  ChevronRight: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 18l6-6-6-6"/></svg>,
  Budget:     () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>,
  Spent:      () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/></svg>,
  Briefcase:  () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>,
  InvoiceDoc: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>,
};

const NAV_ICON_MAP: Record<NavId, React.ElementType> = {
  overview:   Icons.Overview,
  projects:   Icons.Projects,
  applicants: Icons.Applicants,
  invoices:   Icons.Invoices,
  messages:   Icons.Messages,
  profile:    Icons.Profile,
};

// ================================================================
// 4. HOOKS
// ================================================================

function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getClientDashboard();
      setData(result);
    } catch {
      toast.error("Failed to load dashboard. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  return { data, loading, refetch: fetchDashboard };
}

function useChatConnection(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
    chatService.connect(userId, token);
    return () => { chatService.disconnect(); };
  }, [userId]);
}

function useActiveNav(): [NavId, (id: NavId) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = (searchParams.get("tab") as NavId) || "overview";
  const setActive = useCallback((id: NavId) => setSearchParams({ tab: id }), [setSearchParams]);
  return [active, setActive];
}

// ================================================================
// 5. SHARED UI COMPONENTS
// ================================================================

const Logo = memo(() => (
  <span className="font-serif text-xl tracking-tight text-gray-900">
    freelance<em className="italic text-emerald-600">fluxo</em>
  </span>
));

const StatusBadge = memo(({ status }: { status: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusStyle(status)}`}>
    {status.replace(/_/g, " ")}
  </span>
));

const EmptyState = memo(({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="text-center py-16 px-4">
    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
    </div>
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-xs mx-auto">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
));

const StatCard = memo(({ label, value, icon: Icon, sub, accent = false }: {
  label: string; value: string; icon: React.ElementType; sub?: string; accent?: boolean;
}) => (
  <div className={`rounded-2xl border p-5 transition hover:shadow-md ${accent ? "bg-emerald-600 border-emerald-600" : "bg-white border-gray-100"}`}>
    <div className="flex items-center justify-between mb-3">
      <p className={`text-xs font-medium ${accent ? "text-emerald-100" : "text-gray-500"}`}>{label}</p>
      <div className={`p-2 rounded-xl ${accent ? "bg-emerald-500/40" : "bg-gray-50"}`}>
        <Icon />
      </div>
    </div>
    <p className={`text-2xl font-bold ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
    {sub && <p className={`text-xs mt-1 ${accent ? "text-emerald-200" : "text-gray-400"}`}>{sub}</p>}
  </div>
));

// ================================================================
// 6. MODALS
// ================================================================

const ConfirmModal = memo(({ isOpen, title, message, onCancel, onConfirm }: {
  isOpen: boolean; title: string; message: string; onCancel: () => void; onConfirm: () => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isOpen) { ref.current?.focus(); document.body.style.overflow = "hidden"; }
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={onCancel} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div ref={ref} tabIndex={-1} className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-gray-100" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center"><Icons.Trash /></div>
          <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">{message}</p>
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition">Delete</button>
        </div>
      </div>
    </div>
  );
});

const ProjectDetailDrawer = memo(({ project, canDelete, onClose, onMessage, onDelete }: {
  project: Project | null; canDelete: boolean;
  onClose: () => void; onMessage: (f: string, j: string) => void; onDelete: (id: string) => void;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (project) { ref.current?.focus(); document.body.style.overflow = "hidden"; }
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [project]);

  if (!project) return null;
  const progress = project.budget > 0 ? Math.min(100, ((project.spent || 0) / project.budget) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"/>
      <div ref={ref} tabIndex={-1} className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-100 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Project Details</p>
            <h3 className="text-base font-bold text-gray-900">{project.title}</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 transition"><Icons.X /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status}/>
            {project.createdAt && <span className="text-xs text-gray-400">Posted {formatDate(project.createdAt)}</span>}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[["Budget", formatCurrency(project.budget)],["Spent", formatCurrency(project.spent || 0)],["Deadline", formatDate(project.deadline)]].map(([l,v]) => (
              <div key={l} className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">{l}</p>
                <p className="text-sm font-semibold text-gray-800">{v}</p>
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }}/>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Freelancer</p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-between">
              {project.freelancerId ? (
                <>
                  <p className="text-sm font-medium text-gray-800">{project.freelancerId.firstName} {project.freelancerId.lastName}</p>
                  <button onClick={() => onMessage(project.freelancerId!._id, project._id)} className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition"><Icons.Message /> Message</button>
                </>
              ) : <p className="text-sm text-gray-400">No freelancer assigned yet</p>}
            </div>
          </div>
          {project.description && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-2">Description</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{project.description}</p>
              </div>
            </div>
          )}
          {canDelete && (
            <div className="pt-2 border-t border-gray-100">
              <button onClick={() => onDelete(project._id)} className="flex items-center gap-2 text-sm font-medium text-red-500 hover:text-red-700 transition">
                <Icons.Trash /> Delete this project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ================================================================
// 7. TAB CONTENT COMPONENTS
// ================================================================

// ── OVERVIEW TAB ─────────────────────────────────────────────────
const OverviewTab = memo(({ data, freelancers, navigate, onSelectNav, onViewProject }: {
  data: DashboardData | null; freelancers: FreelancerPreview[];
  navigate: any;
  onSelectNav: (id: NavId) => void; onViewProject: (p: Project) => void;
}) => {
  const stats = data?.stats;
  const applicants: Applicant[] = (data?.applicants ?? []).slice(0, 3);
  const projects: Project[] = data?.projects ?? [];

  return (
    <div className="p-5 md:p-8 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-gray-900">
          Welcome back, {data?.user?.firstName} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">Here's what's happening with your projects today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Budget"     value={formatCurrency(stats?.totalBudget ?? 0)}  icon={Icons.Budget}    accent />
        <StatCard label="Total Spent"      value={formatCurrency(stats?.totalSpent ?? 0)}   icon={Icons.Spent}     />
        <StatCard label="Active Projects"  value={String(stats?.activeProjects ?? 0)}        icon={Icons.Briefcase} sub={stats?.activeProjects ? "In progress" : undefined} />
        <StatCard label="Pending Invoices" value={String(stats?.pendingInvoices ?? 0)}       icon={Icons.InvoiceDoc} sub={stats?.pendingInvoices ? "Awaiting payment" : undefined} />
      </div>

      {/* Recent projects */}
      <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-bold text-gray-900">Recent Projects</h2>
          <button onClick={() => onSelectNav("projects")} className="text-xs font-medium text-emerald-600 hover:underline">View all →</button>
        </div>
        {projects.length === 0 ? (
          <EmptyState title="No projects yet" description="Post your first job to start receiving proposals." action={<Link to="/post-job" className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">Post a job</Link>} />
        ) : (
          <div className="divide-y divide-gray-50">
            {projects.slice(0, 5).map(p => (
              <div key={p._id} onClick={() => onViewProject(p)} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 cursor-pointer group transition">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition">{p.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.freelancerId ? `${p.freelancerId.firstName} ${p.freelancerId.lastName}` : "Unassigned"} · Due {formatDate(p.deadline)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <span className="text-xs text-gray-400 hidden sm:block">{formatCurrency(p.spent || 0)} / {formatCurrency(p.budget)}</span>
                  <StatusBadge status={p.status}/>
                  <Icons.ChevronRight />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* New proposals preview */}
      {applicants.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-gray-900">New Proposals</h2>
            <button onClick={() => onSelectNav("applicants")} className="text-xs font-medium text-emerald-600 hover:underline">View all →</button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {applicants.map(a => a.freelancerId && (
              <div key={a._id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex gap-3 items-start">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 shrink-0">
                  {a.freelancerId.profileImage
                    ? <img src={a.freelancerId.profileImage} alt="" className="w-full h-full rounded-full object-cover"/>
                    : getInitials(`${a.freelancerId.firstName} ${a.freelancerId.lastName}`)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">{a.freelancerId.firstName} {a.freelancerId.lastName}</p>
                  <p className="text-xs text-gray-500">{a.freelancerId.title || "Freelancer"}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1">${a.bid}/hr</p>
                </div>
                <StatusBadge status={a.status}/>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Top freelancers */}
      {freelancers.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-900 mb-3">Top Freelancers</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {freelancers.slice(0, 4).map((fl, i) => (
              <button key={fl._id} onClick={() => navigate(`/freelancers/${fl._id}`)} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-left hover:border-emerald-400 hover:shadow-md transition-all group">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white mb-3 shadow-sm" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {getInitials(`${fl.firstName} ${fl.lastName}`)}
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition">{fl.firstName} {fl.lastName}</p>
                <p className="text-xs text-gray-400 mb-2 truncate">{fl.title || "Freelancer"}</p>
                <p className="text-amber-400 text-xs mb-1">{renderStars(fl.rating || 5)} <span className="text-gray-400">({fl.reviewCount || 0})</span></p>
                <p className="text-sm font-bold text-gray-900">${fl.hourlyRate || 0}/hr</p>
                {fl.skills && fl.skills.length > 0 && (
                  <div className="flex gap-1 flex-wrap mt-3">
                    {fl.skills.slice(0, 3).map(s => (
                      <span key={s} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded-md font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
});

// ── PROJECTS TAB ─────────────────────────────────────────────────
const ProjectsTab = memo(({ data, userId, onViewProject, onDeleteProject, onMessage }: {
  data: DashboardData | null; userId?: string;
  onViewProject: (p: Project) => void; onDeleteProject: (id: string) => void; onMessage: (f: string, j: string) => void;
}) => {
  const projects: Project[] = data?.projects ?? [];

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-gray-900">My Projects</h2>
        <Link to="/post-job" className="flex items-center gap-1.5 text-sm font-semibold bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-700 transition shadow-sm">
          <Icons.Plus /> Post a job
        </Link>
      </div>
      {projects.length === 0 ? (
        <EmptyState title="No projects yet" description="Post your first job to start receiving proposals from skilled freelancers."
          action={<Link to="/post-job" className="px-5 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition">Post a job</Link>} />
      ) : (
        <div className="space-y-3">
          {projects.map(p => {
            const progress = p.budget > 0 ? Math.min(100, ((p.spent || 0) / p.budget) * 100) : 0;
            const canDel = getProjectOwnerId(p) === userId;
            return (
              <div key={p._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition cursor-pointer group" onClick={() => onViewProject(p)}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-emerald-700 transition">{p.title}</h3>
                    {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
                  </div>
                  <StatusBadge status={p.status}/>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${progress}%` }}/>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="font-bold text-gray-900">{formatCurrency(p.budget)}</span>
                  <span>·</span>
                  <span>Spent {formatCurrency(p.spent || 0)}</span>
                  <span>·</span>
                  <span>Due {formatDate(p.deadline)}</span>
                  {p.freelancerId && <><span>·</span><span>{p.freelancerId.firstName} {p.freelancerId.lastName}</span></>}
                </div>
                <div className="flex items-center gap-2 pt-3 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                  {p.freelancerId && (
                    <button onClick={() => onMessage(p.freelancerId!._id, p._id)} className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-50 transition">
                      <Icons.Message /> Message freelancer
                    </button>
                  )}
                  {canDel && (
                    <button onClick={() => onDeleteProject(p._id)} className="flex items-center gap-1.5 text-xs font-medium text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50 transition ml-auto">
                      <Icons.Trash /> Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

// ── APPLICANTS TAB ────────────────────────────────────────────────
const ApplicantsTab = memo(({ data, navigate, onHireApplicant, hiringId }: {
  data: DashboardData | null; navigate: any;
  onHireApplicant: (a: Applicant) => void; hiringId: string | null;
}) => {
  const applicants: Applicant[] = data?.applicants ?? [];

  // Group by job
  const byJob = useMemo(() => {
    const map: Record<string, Applicant[]> = {};
    applicants.forEach(a => {
      const jid = typeof a.jobId === "object" ? a.jobId?._id ?? "unknown" : "unknown";
      if (!map[jid]) map[jid] = [];
      map[jid].push(a);
    });
    return map;
  }, [applicants]);

  if (applicants.length === 0) {
    return (
      <div className="p-5 md:p-8 max-w-4xl mx-auto">
        <h2 className="text-lg font-bold text-gray-900 mb-6">Proposals</h2>
        <EmptyState title="No proposals yet" description="Once freelancers apply to your jobs, their proposals will appear here."/>
      </div>
    );
  }

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Proposals</h2>
      <div className="space-y-8">
        {Object.entries(byJob).map(([jobId, apps]) => {
          const job = apps[0]?.jobId;
          return (
            <div key={jobId}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{job?.title || "Untitled job"}</h3>
                  <p className="text-xs text-gray-400">{apps.length} proposal{apps.length > 1 ? "s" : ""}</p>
                </div>
                {job?.status && <StatusBadge status={job.status}/>}
              </div>
              <div className="space-y-3">
                {apps.map(a => {
                  const fl = a.freelancerId;
                  if (!fl) return null;
                  const fullName = `${fl.firstName} ${fl.lastName}`;
                  return (
                    <div key={a._id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
                      <div className="flex items-start gap-4">
                        <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center text-sm font-bold text-emerald-700 shrink-0 overflow-hidden">
                          {fl.profileImage ? <img src={fl.profileImage} alt={fullName} className="w-full h-full object-cover"/> : getInitials(fullName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{fullName}</p>
                              <p className="text-xs text-gray-500">{fl.title || "Freelancer"}</p>
                              {fl.rating && <p className="text-amber-400 text-xs mt-0.5">{renderStars(fl.rating)} <span className="text-gray-400">({fl.reviewCount})</span></p>}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-bold text-emerald-700">${a.bid}/hr</p>
                              <StatusBadge status={a.status}/>
                            </div>
                          </div>
                          {a.coverLetter && (
                            <div className="mt-3 bg-gray-50 rounded-xl border border-gray-100 p-3">
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Proposal</p>
                              <p className="text-xs text-gray-700 leading-relaxed line-clamp-4">{a.coverLetter}</p>
                            </div>
                          )}
                          {fl.skills && fl.skills.length > 0 && (
                            <div className="flex gap-1.5 flex-wrap mt-3">
                              {fl.skills.slice(0, 5).map(s => (
                                <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md font-medium">{s}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-50" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => onHireApplicant(a)}
                          disabled={hiringId === a._id || ["accepted","rejected"].includes(a.status)}
                          className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                        >
                          {hiringId === a._id ? "Hiring…" : "Hire Freelancer"}
                        </button>
                        <button onClick={() => navigate(`/freelancers/${fl._id}`)} className="px-4 py-2 border border-gray-200 text-gray-600 text-xs font-medium rounded-xl hover:bg-gray-50 transition">View profile</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ── INVOICES TAB ─────────────────────────────────────────────────
const InvoicesTab = memo(({ data }: { data: DashboardData | null }) => {
  const invoices: Invoice[] = data?.invoices ?? [];
  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <h2 className="text-lg font-bold text-gray-900 mb-6">Invoices</h2>
      {invoices.length === 0 ? (
        <EmptyState title="No invoices" description="Invoices from completed projects will appear here."/>
      ) : (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-50">
              <tr>
                {["Project","Date","Amount","Status"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-gray-50/50 transition">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{inv.project}</td>
                  <td className="px-5 py-3.5 text-xs text-gray-500">{formatDate(inv.date)}</td>
                  <td className="px-5 py-3.5 font-bold text-gray-900">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={inv.paid ? "completed" : "pending"}/></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
});

// ── MESSAGES TAB ─────────────────────────────────────────────────
const MessagesTab = memo(({ userId, selectedConvId, selectedParticipant, onSelectConversation }: {
  userId?: string; selectedConvId: string | null; selectedParticipant: any;
  onSelectConversation: (id: string, conv: any) => void;
}) => (
  <div className="h-[calc(100vh-4rem)] flex overflow-hidden">
    <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50/30">
      <ChatConversationList
        currentUserId={userId}
        selectedId={selectedConvId || undefined}
        onSelectConversation={onSelectConversation}
      />
    </div>
    <div className="flex-1 overflow-hidden bg-white">
      {selectedConvId && selectedParticipant ? (
        <ChatRoom conversationId={selectedConvId} currentUserId={userId} conversation={selectedParticipant}/>
      ) : (
        <EmptyState title="Select a conversation" description="Choose a conversation from the left to start messaging."/>
      )}
    </div>
  </div>
));

// ================================================================
// 8. CLIENT PROFILE EDITOR MODAL
// ================================================================

const ClientProfileEditor = memo(({ user, onSave, onCancel }: {
  user: User;
  onSave: (fields: Partial<User>) => Promise<void>;
  onCancel: () => void;
}) => {
  const [form, setForm] = useState({
    firstName:   user.firstName  || "",
    lastName:    user.lastName   || "",
    companyName: user.companyName || "",
    bio:         user.bio        || "",
    website:     user.website    || "",
    industry:    user.industry   || "",
    city:        user.location?.city    || "",
    country:     user.location?.country || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = async () => {
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("First name and last name are required."); return; }
    setSaving(true); setError(null);
    try {
      await onSave({
        firstName:   form.firstName.trim(),
        lastName:    form.lastName.trim(),
        companyName: form.companyName.trim() || undefined,
        bio:         form.bio.trim()     || undefined,
        location: (form.city.trim() || form.country.trim()) ? {
          address:     user.location?.address || "",
          city:        form.city.trim()       || "",
          province:    user.location?.province || "",
          country:     form.country.trim()    || "Sri Lanka",
          coordinates: user.location?.coordinates || { lat: 6.0329, lng: 80.217 },
        } : undefined,
      });
    } catch { setError("Failed to save. Please try again."); setSaving(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 bg-white";
  const labelCls = "block text-xs font-semibold text-gray-700 mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900">Edit Profile</h2>
            <p className="text-xs text-gray-400 mt-0.5">Update your client profile information</p>
          </div>
          <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>First Name *</label>
              <input value={form.firstName} onChange={set("firstName")} className={inputCls} placeholder="John"/>
            </div>
            <div>
              <label className={labelCls}>Last Name *</label>
              <input value={form.lastName} onChange={set("lastName")} className={inputCls} placeholder="Doe"/>
            </div>
          </div>

          <div>
            <label className={labelCls}>Company Name</label>
            <input value={form.companyName} onChange={set("companyName")} className={inputCls} placeholder="Acme Corp (optional)"/>
          </div>

          <div>
            <label className={labelCls}>Industry</label>
            <select value={form.industry} onChange={set("industry")} className={inputCls}>
              <option value="">Select industry</option>
              {["Technology", "Healthcare", "Finance", "Education", "E-commerce", "Marketing", "Design", "Real Estate", "Media", "Other"].map(i => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Bio</label>
            <textarea rows={4} value={form.bio} onChange={set("bio")}
              placeholder="Tell freelancers a bit about yourself and the kind of work you typically hire for…"
              className={`${inputCls} resize-none`}/>
          </div>

          <div>
            <label className={labelCls}>Website</label>
            <input value={form.website} onChange={set("website")} className={inputCls} placeholder="https://yourcompany.com"/>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>City</label>
              <input value={form.city} onChange={set("city")} className={inputCls} placeholder="Colombo"/>
            </div>
            <div>
              <label className={labelCls}>Country</label>
              <input value={form.country} onChange={set("country")} className={inputCls} placeholder="Sri Lanka"/>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6 flex justify-end gap-3 sticky bottom-0 bg-white border-t border-gray-50 pt-4">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60 flex items-center gap-2">
            {saving && <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>}
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
});

// ================================================================
// 9. PROFILE TAB
// ================================================================

const ProfileTab = memo(({ user, onEdit }: { user: User; onEdit: () => void }) => {
  const name = user.companyName || `${user.firstName} ${user.lastName}`.trim();
  const initials = getInitials(name);

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Header banner */}
        <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500 relative">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "24px 24px" }}/>
        </div>

        <div className="px-6 pb-8">
          {/* Avatar + Edit button */}
          <div className="flex items-end justify-between -mt-12 mb-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-white flex items-center justify-center">
                {user.profileImage ? (
                  <img src={user.profileImage} alt={name} className="w-full h-full object-cover"/>
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-500 to-emerald-800 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{initials}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"/>
                </span>
                Active Client
              </span>
              <button onClick={onEdit}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 text-xs font-medium rounded-full hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                Edit Profile
              </button>
            </div>
          </div>

          {/* Name & company */}
          <div className="mb-5">
            <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
            {user.companyName && (
              <p className="text-sm text-gray-500 mt-0.5">{user.firstName} {user.lastName}</p>
            )}
            {user.industry && (
              <p className="text-xs font-medium text-emerald-600 mt-1">{user.industry}</p>
            )}
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="text-sm text-gray-500 leading-relaxed mb-6 max-w-2xl">{user.bio}</p>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6 max-w-sm">
            {[
              { label: "Projects", value: String((0)) },
              { label: "Rating",   value: (user.rating || 5.0).toFixed(1) },
              { label: "Reviews",  value: String(user.reviewCount || 0) },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          <hr className="border-gray-100 mb-5"/>

          {/* Details */}
          <div className="space-y-3 text-sm text-gray-500">
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"/></svg>
              <span>{user.email}</span>
            </div>
            {user.location?.city && user.location?.country && (
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"/></svg>
                <span>{user.location.city}, {user.location.country}</span>
              </div>
            )}
            {user.website && (
              <div className="flex items-center gap-2.5">
                <svg className="w-4 h-4 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"/></svg>
                <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">{user.website}</a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// ================================================================
// 9. MAIN COMPONENT
// ================================================================

export default function ClientDashboard() {
  const navigate   = useNavigate();
  const dispatch   = useDispatch();
  const [activeNav, setActiveNav] = useActiveNav();
  const { data, loading, refetch } = useDashboard();

  const [mobileOpen, setMobileOpen]         = useState(false);
  const [freelancers, setFreelancers]        = useState<FreelancerPreview[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteModal, setDeleteModal]        = useState<{ open: boolean; id: string | null }>({ open: false, id: null });
  const [selectedConvId, setSelectedConvId]  = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [hiringApplicationId, setHiringApplicationId] = useState<string | null>(null);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [pendingOffers, setPendingOffers]    = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [editingProfile, setEditingProfile]  = useState(false);

  // Auth guard
  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) navigate("/login");
  }, [navigate]);

  // Chat
  useChatConnection(data?.user?._id);

  // Freelancers
  useEffect(() => {
    platformService.getFreelancers()
      .then(r => setFreelancers((r || []).slice(0, 4)))
      .catch(() => setFreelancers([]));
  }, []);

  // Contracts
  useEffect(() => {
    setContractsLoading(true);
    platformService.getMyContracts()
      .then(all => {
        setActiveContracts(all.filter((c: any) => c.status === "accepted"));
        setPendingOffers(all.filter((c: any) => c.status === "pending"));
      })
      .catch(() => {})
      .finally(() => setContractsLoading(false));
  }, []);

  const handleLogout = useCallback(() => {
    chatService.disconnect();
    dispatch(logout());
    navigate("/login");
  }, [dispatch, navigate]);

  const handleSaveProfile = useCallback(async (updatedFields: Partial<User>) => {
    await platformService.updateProfile(updatedFields);
    setEditingProfile(false);
    refetch();
    toast.success("Profile updated.");
  }, [refetch]);

  const handleMessageFreelancer = useCallback(async (freelancerId: string, jobId: string) => {
    try {
      const conv = await jobService.createConversation(freelancerId, jobId);
      setSelectedConvId(conv._id);
      setSelectedParticipant(conv.participant);
      setActiveNav("messages");
    } catch {
      toast.error("Could not start conversation");
    }
  }, [setActiveNav]);

  const handleDeleteProject = useCallback((projectId: string) => {
    setDeleteModal({ open: true, id: projectId });
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!deleteModal.id) return;
    try {
      await dashboardService.deleteJob(deleteModal.id);
      toast.success("Project deleted");
      setSelectedProject(null);
      refetch();
    } catch {
      toast.error("Could not delete project");
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  }, [deleteModal.id, refetch]);

  const handleHireApplicant = useCallback(async (application: Applicant) => {
    const freelancerId = application.freelancerId?._id;
    const jobId = typeof application.jobId === "object" ? application.jobId?._id : application.jobId as string | undefined;
    if (!freelancerId || !jobId) { toast.error("Missing freelancer or job details."); return; }

    setHiringApplicationId(application._id);
    try {
      const result = await jobService.hireApplicant(jobId, application._id);
      const conversation = result.conversation;
      setSelectedConvId(conversation._id);
      setSelectedParticipant(conversation);
      setActiveNav("messages");
      toast.success("Freelancer hired! Chat opened.");
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not hire freelancer.");
    } finally {
      setHiringApplicationId(null);
    }
  }, [setActiveNav]);

  const user = data?.user;
  const name = user?.companyName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Client";

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200"/>
          <div className="h-4 w-32 bg-gray-200 rounded"/>
          <div className="h-2 w-48 bg-gray-200 rounded"/>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">

      {/* ── TOP NAVIGATION BAR ─────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="shrink-0"><Logo /></Link>

            {/* Desktop nav tabs */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map(item => {
                const Icon = NAV_ICON_MAP[item.id];
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-current={active ? "page" : undefined}
                  >
                    <Icon />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop right actions */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/search")} className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:border-emerald-500 hover:text-emerald-700 transition">
                Find freelancers
              </button>
              <Link to="/post-job" className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition shadow-sm">
                <Icons.Plus /> Post a job
              </Link>
              {/* User chip */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                  {getInitials(name)}
                </div>
                <div className="hidden lg:block min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{name}</p>
                  <p className="text-[10px] text-gray-400">Client</p>
                </div>
                <button onClick={handleLogout} title="Sign out" className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition" aria-label="Sign out">
                  <Icons.Logout />
                </button>
              </div>
            </div>

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600"
              aria-label="Open menu"
            >
              <Icons.Menu />
            </button>
          </div>
        </div>
      </header>

      {/* ── MOBILE DRAWER ──────────────────────────────────────── */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)}/>
          <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col shadow-2xl">
            <div className="px-5 py-5 border-b border-gray-50 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-700"><Icons.X /></button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {NAV_ITEMS.map(item => {
                const Icon = NAV_ICON_MAP[item.id];
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => { setActiveNav(item.id); setMobileOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                      active ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <Icon /> {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-50 space-y-2">
              <button onClick={() => { navigate("/search"); setMobileOpen(false); }} className="w-full px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:border-emerald-500 transition">Find freelancers</button>
              <Link to="/post-job" onClick={() => setMobileOpen(false)} className="flex items-center justify-center gap-1.5 w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition">
                <Icons.Plus /> Post a job
              </Link>
              <button onClick={() => { handleLogout(); setMobileOpen(false); }} className="w-full flex items-center justify-center gap-2 text-sm text-red-500 hover:text-red-700 py-2 px-3 rounded-xl hover:bg-red-50 transition">
                <Icons.Logout /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ──────────────────────────────────────── */}
      <main className="flex-1 pt-16">
        {activeNav === "overview" && (
          <OverviewTab
            data={data}
            freelancers={freelancers}
            navigate={navigate}
            onSelectNav={setActiveNav}
            onViewProject={setSelectedProject}
          />
        )}
        {activeNav === "projects" && (
          <>
            <ProjectsTab
              data={data}
              userId={user?._id}
              onViewProject={setSelectedProject}
              onDeleteProject={handleDeleteProject}
              onMessage={handleMessageFreelancer}
            />
            {/* Contracts section under projects */}
            <div className="px-5 md:px-8 pb-8 max-w-4xl mx-auto space-y-6 mt-2">
              <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-900">Active Contracts</h2>
                  <span className="text-xs font-semibold text-emerald-700">{activeContracts.length} in progress</span>
                </div>
                {contractsLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">Loading contracts…</div>
                ) : activeContracts.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {activeContracts.map(c => (
                      <div key={c._id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <span className="inline-flex h-5 items-center rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 uppercase tracking-wider mb-1.5">In Progress</span>
                          <h3 className="text-sm font-bold text-gray-900">{c.contractTitle}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Freelancer: {typeof c.freelancerId === "object" ? `${c.freelancerId.firstName || ""} ${c.freelancerId.lastName || ""}`.trim() : c.freelancerId}
                          </p>
                          <div className="flex gap-4 text-xs text-gray-500 mt-1.5">
                            <span>Budget: <strong className="text-emerald-600">{formatCurrency(c.totalAmount)}</strong></span>
                            <span>Deadline: <strong>{new Date(c.deadline).toLocaleDateString()}</strong></span>
                          </div>
                        </div>
                        <button onClick={() => navigate(`/dashboard/freelancer/contracts/${c._id}`)} className="text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition shrink-0">
                          View details
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">No active contracts.</div>
                )}
              </section>

              <section className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                  <h2 className="text-sm font-bold text-gray-900">Sent Offers</h2>
                  <span className="text-xs font-semibold text-amber-600">{pendingOffers.length} waiting</span>
                </div>
                {contractsLoading ? (
                  <div className="p-6 text-center text-sm text-gray-400">Loading offers…</div>
                ) : pendingOffers.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {pendingOffers.map(o => (
                      <div key={o._id} className="px-5 py-4 flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-sm font-bold text-gray-900">{o.contractTitle}</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Sent {new Date(o.createdAt).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full animate-pulse">Waiting for Freelancer</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-400">No pending offers.</div>
                )}
              </section>
            </div>
          </>
        )}
        {activeNav === "applicants" && (
          <ApplicantsTab
            data={data}
            navigate={navigate}
            onHireApplicant={handleHireApplicant}
            hiringId={hiringApplicationId}
          />
        )}
        {activeNav === "invoices" && <InvoicesTab data={data}/>}
        {activeNav === "messages" && user && (
          <MessagesTab
            userId={user._id}
            selectedConvId={selectedConvId}
            selectedParticipant={selectedParticipant}
            onSelectConversation={(id, conv) => { setSelectedConvId(id); setSelectedParticipant(conv); }}
          />
        )}
        {activeNav === "profile" && user && (
          <ProfileTab user={user} onEdit={() => setEditingProfile(true)} />
        )}
      </main>

      {/* ── CLIENT PROFILE EDITOR ─────────────────────────────── */}
      {editingProfile && user && (
        <ClientProfileEditor
          user={user}
          onSave={handleSaveProfile}
          onCancel={() => setEditingProfile(false)}
        />
      )}

      {/* ── PROJECT DETAIL DRAWER ─────────────────────────────── */}
      <ProjectDetailDrawer
        project={selectedProject}
        canDelete={!!selectedProject && getProjectOwnerId(selectedProject) === user?._id}
        onClose={() => setSelectedProject(null)}
        onMessage={handleMessageFreelancer}
        onDelete={handleDeleteProject}
      />

      {/* ── DELETE CONFIRM MODAL ──────────────────────────────── */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete project"
        message="This will permanently delete this project. This action cannot be undone."
        onCancel={() => setDeleteModal({ open: false, id: null })}
        onConfirm={confirmDelete}
      />
    </div>
  );
}