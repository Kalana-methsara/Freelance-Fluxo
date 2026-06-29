// ============================================================
// FreelancerDashboard.tsx – Refactored: Top Nav + Clean Tab Layout
// All original logic preserved. Matches ClientDashboard pattern.
// ============================================================

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  memo,
} from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../features/authSlice";
import platformService from "../services/platformService";
import dashboardService from "../services/dashboardService";
import jobService from "../services/jobService";
import chatService from "../services/chatService";
import ChatConversationList from "../components/ChatConversationList";
import ChatRoom from "../components/ChatRoom";
import { formatDate, getInitials } from "../utils/auth";
import TechStack from "../components/Skills";
import Slide from "../components/Slide";
import CatCard from "../components/CatCard";
import { cards } from "../../data";
import api from "../services/api";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { MapPin, Code2, DollarSign, Award, Clock } from "lucide-react";

// ============================================================
// 1. TYPES
// ============================================================

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  hourlyRate?: number;
  bio?: string;
  skills?: string[];
  profileImage?: string;
  companyName?: string;
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

interface PendingProposalPayload {
  jobId: string;
  payload: { bid: number; coverLetter: string };
}

interface Job {
  _id: string;
  title: string;
  budget: number;
  status: string;
  deadline: string;
  description?: string;
  skills?: string[];
  clientId: { _id: string; firstName: string; companyName?: string };
}

interface Proposal {
  _id: string;
  jobId: { _id: string; title: string };
  bid: number;
  status: string;
  createdAt?: string;
  estimatedDays?: number;
}

interface Transaction {
  _id: string;
  jobTitle: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  user: User;
  stats: {
    totalEarnings: number;
    activeJobs: number;
    openProposals: number;
    profileViews: number;
  };
  activeJobs: Job[];
  proposals: Proposal[];
  earnings: { month: string; amount: number }[];
  transactions: Transaction[];
}

type NavId = "overview" | "find_work" | "proposals" | "active" | "earnings" | "messages" | "profile";
type ToastMessage = { type: "success" | "error"; text: string } | null;

// ============================================================
// 2. CONSTANTS
// ============================================================

const NAV_ITEMS: { id: NavId; label: string; icon: React.ReactNode }[] = [
  { id: "overview",   label: "Overview",   icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/></svg> },
  { id: "find_work",  label: "Find Work",  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg> },
  { id: "proposals",  label: "Proposals",  icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"/></svg> },
  { id: "active",     label: "My Jobs",    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006-3.75 3.75m0 0-3.75-3.75m3.75 3.75V8.75"/></svg> },
  { id: "earnings",   label: "Earnings",   icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"/></svg> },
  { id: "messages",   label: "Messages",   icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"/></svg> },
  { id: "profile",    label: "Profile",    icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/></svg> },
];

const SKILL_POOL: Record<string, string[]> = {
  "Development": ["React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "Spring Boot", "Express", "MongoDB", "PostgreSQL", "Next.js", "Docker"],
  "Design & Creative": ["UI/UX Design", "Figma", "Adobe Photoshop", "Illustrator", "Web Design", "Graphic Design"],
  "Writing & Translation": ["Content Writing", "Technical Writing", "Copywriting", "Translation", "SEO Writing"],
  "Marketing & Sales": ["SEO", "Digital Marketing", "Social Media Management", "Google Analytics", "Lead Generation"],
};

const HOW_IT_WORKS = [
  { n: "1", title: "Post your job", desc: "Tell us about your project requirements, timeline, and budget in just a few minutes." },
  { n: "2", title: "Browse proposals", desc: "Review profiles and proposals from top-rated freelancers who match your needs." },
  { n: "3", title: "Hire & collaborate", desc: "Work securely with built-in tools for messaging, payments, and progress tracking." },
];

const POPULAR_TAGS = ["Web Design", "React Developer", "UI/UX Design", "Node.js", "WordPress"];
const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#d97706", "#dc2626", "#059669", "#c026d3"];

const STATUS_STYLES: Record<string, string> = {
  in_progress:  "bg-blue-50 text-blue-700 border border-blue-100",
  under_review: "bg-amber-50 text-amber-700 border border-amber-100",
  completed:    "bg-emerald-50 text-emerald-700 border border-emerald-100",
  pending:      "bg-gray-100 text-gray-600 border border-gray-200",
  shortlisted:  "bg-emerald-50 text-emerald-700 border border-emerald-100",
  rejected:     "bg-red-50 text-red-600 border border-red-100",
  open:         "bg-blue-50 text-blue-700 border border-blue-100",
  hired:        "bg-emerald-50 text-emerald-700 border border-emerald-100",
};

// ============================================================
// 3. UTILS
// ============================================================

function avatarColor(id: string): string {
  if (!id) return AVATAR_COLORS[0];
  return AVATAR_COLORS[id.charCodeAt(id.length - 1) % AVATAR_COLORS.length];
}

function useActiveNav(): [NavId, (id: NavId) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = (searchParams.get("tab") as NavId) || "overview";
  const setActive = useCallback((id: NavId) => setSearchParams({ tab: id }), [setSearchParams]);
  return [active, setActive];
}

// ============================================================
// 4. SHARED UI COMPONENTS
// ============================================================

const Logo = memo(() => (
  <span className="font-serif text-xl tracking-tight text-gray-900">
    freelance<em className="italic text-emerald-600">fluxo</em>
  </span>
));

const StatusBadge = memo(({ status, size = "md" }: { status: string; size?: "sm" | "md" }) => (
  <span className={`inline-flex items-center rounded-full font-medium capitalize ${
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
  } ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600 border border-gray-200"}`}>
    {status ? status.replace(/_/g, " ") : ""}
  </span>
));

const StatCard = memo(({ label, value, sub, colorClass, icon }: {
  label: string; value: string; sub?: string; colorClass: string; icon: React.ReactNode;
}) => (
  <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-3 hover:shadow-md transition-shadow shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colorClass}`}>{icon}</div>
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  </div>
));

const EmptyState = memo(({ title, description, action }: {
  title: string; description: string; action?: React.ReactNode;
}) => (
  <div className="text-center py-14 px-4">
    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
      <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
      </svg>
    </div>
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <p className="text-xs text-gray-400 mt-1 max-w-xs mx-auto">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
));

// ============================================================
// 5. EARNINGS CHART (unchanged)
// ============================================================

function EarningsChart({ data }: { data: { month: string; amount: number }[] }) {
  const chartData = data?.length
    ? data
    : [{ month: "Jan", amount: 0 }, { month: "Feb", amount: 0 }, { month: "Mar", amount: 0 }];

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false}/>
          <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`}/>
          <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3"/>
          <Tooltip contentStyle={{ background: "#fff", borderRadius: "12px", borderColor: "#e5e7eb", fontSize: 12 }}
            formatter={(v: any) => [`$${v ?? 0}`, "Earnings"]}/>
          <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)"/>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// 6. JOB CARDS (unchanged)
// ============================================================

const BrowseJobCard = memo(({ job, onApply }: { job: Job; onApply: (job: Job) => void }) => {
  const daysLeft = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md hover:border-emerald-200 transition-all group shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700 transition line-clamp-2">{job.title}</h3>
        <StatusBadge status={job.status} size="sm"/>
      </div>
      {job.description && <p className="text-xs text-gray-500 leading-relaxed line-clamp-3">{job.description}</p>}
      {job.skills && job.skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {job.skills.slice(0, 4).map((s) => (
            <span key={s} className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-medium text-gray-600">{s}</span>
          ))}
          {job.skills.length > 4 && (
            <span className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-md text-[10px] font-medium text-gray-400">+{job.skills.length - 4}</span>
          )}
        </div>
      )}
      <div className="flex items-center justify-between pt-1 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <span className="font-bold text-gray-800 text-sm">${job.budget}</span>
          <span>·</span>
          <span>{daysLeft}d left</span>
        </div>
        <button onClick={() => onApply(job)}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition">
          Apply
        </button>
      </div>
    </div>
  );
});

const ActiveJobCard = memo(({ job, onMessage, onSubmit }: {
  job: Job; onMessage: (clientId: string, jobId: string) => void; onSubmit: (jobId: string) => void;
}) => {
  const daysLeft = Math.max(0, Math.ceil((new Date(job.deadline).getTime() - Date.now()) / 86400000));
  const urgency = daysLeft <= 3 ? "text-red-500" : daysLeft <= 7 ? "text-amber-500" : "text-gray-400";
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 flex flex-col gap-4 hover:shadow-md transition-shadow shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 truncate">{job.title}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{job.clientId?.companyName || job.clientId?.firstName || "Client"}</p>
        </div>
        <StatusBadge status={job.status}/>
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="font-bold text-gray-800">${job.budget}</span>
        <span className={`font-medium ${urgency}`}>{daysLeft === 0 ? "Due today" : `${daysLeft}d remaining`}</span>
      </div>
      {job.status === "in_progress" && (
        <div className="flex gap-2 pt-2 border-t border-gray-50">
          <button onClick={() => onSubmit(job._id)}
            className="flex-1 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition">
            Submit work
          </button>
          <button onClick={() => onMessage(job.clientId._id, job._id)}
            className="flex-1 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg hover:bg-blue-100 transition">
            Message client
          </button>
        </div>
      )}
    </div>
  );
});

// ============================================================
// 7. APPLY MODAL (unchanged)
// ============================================================

interface ApplyModalProps {
  job: Job;
  onClose: () => void;
  onSubmit: (jobId: string, data: { bid: number; coverLetter: string }) => Promise<void>;
}

const ApplyModal = memo(({ job, onClose, onSubmit }: ApplyModalProps) => {
  const [bid, setBid] = useState<number>(job.budget);
  const [coverLetter, setCoverLetter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!coverLetter.trim()) { setError("Cover letter is required."); return; }
    if (bid < 1) { setError("Bid must be at least $1."); return; }
    setError(null); setLoading(true);
    try {
      await onSubmit(job._id, { bid, coverLetter });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Failed to submit proposal. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Submit a Proposal</h2>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{job.title}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl">{error}</div>}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Your Bid ($)</label>
            <input type="number" min={1} value={bid} onChange={(e) => setBid(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"/>
            <p className="text-[10px] text-gray-400 mt-1">Client budget: ${job.budget}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Cover Letter</label>
            <textarea rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself and explain why you're the best fit for this project…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 resize-none"/>
          </div>
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold transition disabled:opacity-60">
            {loading ? "Submitting…" : "Submit Proposal"}
          </button>
        </div>
      </div>
    </div>
  );
});

// ============================================================
// 8. WORK SUBMISSION MODAL (unchanged)
// ============================================================

function WorkSubmissionModal({ jobId, onClose, onSuccess, onError }: {
  jobId: string; onClose: () => void; onSuccess: () => void; onError: (msg: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) { onError("Please attach a file."); return; }
    if (!description.trim()) { onError("Please provide a description."); return; }
    setSubmitting(true);
    const formData = new FormData();
    formData.append("description", description);
    formData.append("file", file);
    try {
      await jobService.submitWork(jobId, formData);
      onSuccess();
      onClose();
    } catch {
      onError("Submission failed. Please try again.");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-start justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Submit Work</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Description</label>
            <textarea rows={4} required value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you've completed…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Attach File</label>
            <input type="file" required onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"/>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50">
              {submitting ? "Uploading…" : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 9. PROFILE EDITOR (unchanged logic)
// ============================================================

function ProfileEditor({ user, onSave, onCancel, onError }: {
  user: User; onSave: (data: Partial<User>) => void; onCancel: () => void; onError: (msg: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customSkill, setCustomSkill] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills || []);
  const [form, setForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    profileImage: user?.profileImage || "",
    title: user?.title || "",
    hourlyRate: user?.hourlyRate || 0,
    bio: user?.bio || "",
    companyName: user?.companyName || "",
    address: user?.location?.address || "",
    city: user?.location?.city || "",
    province: user?.location?.province || "",
    country: user?.location?.country || "",
  });

  const toggleSkill = (skill: string) =>
    setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);

  const handleAddCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSkill.trim()) {
      e.preventDefault();
      if (!selectedSkills.includes(customSkill.trim()))
        setSelectedSkills((prev) => [...prev, customSkill.trim()]);
      setCustomSkill("");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const data = new FormData();
    data.append("image", file);
    setIsUploadingImage(true);
    try {
      const res = await api.post("/upload/upload-avatar", data, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data?.url) {
        setForm((f) => ({ ...f, profileImage: res.data.url }));
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.profileImage = res.data.url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch { onError("Failed to upload image."); }
    finally { setIsUploadingImage(false); }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { onError("First and last name are required."); return; }
    if (selectedSkills.length === 0) { onError("Please select at least one skill."); return; }
    onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      profileImage: form.profileImage,
      title: form.title.trim(),
      hourlyRate: Number(form.hourlyRate),
      bio: form.bio,
      companyName: form.companyName.trim(),
      skills: selectedSkills,
      location: {
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
        coordinates: user?.location?.coordinates || { lat: 6.0329, lng: 80.217 },
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden max-w-2xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
        <h3 className="text-base font-bold">Edit Profile</h3>
        <p className="text-xs text-emerald-100 mt-0.5">Keep your profile up to date to attract more clients.</p>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {/* Avatar */}
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {form.profileImage ? (
              <img src={form.profileImage} alt="Avatar" className="w-16 h-16 rounded-xl object-cover border-2 border-emerald-500"/>
            ) : (
              <div className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-bold text-white" style={{ background: "#059669" }}>
                {form.firstName?.[0]?.toUpperCase() || "U"}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-[10px] text-white font-medium">Change</span>
            </div>
          </div>
          <div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage}
              className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold rounded-lg hover:bg-gray-50 text-gray-700 transition">
              {isUploadingImage ? "Uploading…" : "Upload Photo"}
            </button>
            <p className="text-[10px] text-gray-400 mt-1">JPG or PNG, max 2MB</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange}/>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {(["firstName", "lastName"] as const).map((field) => (
            <div key={field}>
              <label className="block text-xs font-semibold text-gray-600 mb-1 capitalize">{field === "firstName" ? "First Name *" : "Last Name *"}</label>
              <input type="text" required value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Professional Title *</label>
            <input type="text" required placeholder="e.g. Full Stack Developer" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hourly Rate ($)</label>
            <input type="number" required min="1" value={form.hourlyRate}
              onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Bio</label>
          <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Describe your experience and what you bring to clients…"
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-2">Skills * (select at least one)</label>
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-44 overflow-y-auto">
            {Object.entries(SKILL_POOL).map(([category, skills]) => (
              <div key={category}>
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400 mb-1.5">{category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => {
                    const selected = selectedSkills.includes(skill);
                    return (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${
                          selected ? "bg-emerald-600 text-white border-emerald-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}>
                        {skill} {selected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <input type="text" placeholder="Add custom skill — press Enter" value={customSkill}
            onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={handleAddCustomSkill}
            className="mt-2 w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-emerald-500"/>
        </div>

        {/* Location */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location</p>
          <input type="text" required placeholder="Street address" value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
          <div className="grid grid-cols-3 gap-3">
            {(["city", "province", "country"] as const).map((field) => (
              <input key={field} type="text" required placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"/>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">Cancel</button>
          <button type="submit" disabled={isUploadingImage}
            className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition disabled:opacity-50">
            Save Profile
          </button>
        </div>
      </form>
    </div>
  );
}

// ============================================================
// 10. PROFILE COMPLETION MODAL (unchanged)
// ============================================================

function ProfileCompletionModal({ user, onSave, onCancel, onError }: {
  user: User; onSave: (data: Partial<User>) => void; onCancel: () => void; onError: (msg: string) => void;
}) {
  const [form, setForm] = useState({
    title: user?.title || "",
    hourlyRate: user?.hourlyRate || 0,
    bio: user?.bio || "",
    skills: (user?.skills || []).join(", "),
    address: user?.location?.address || "",
    city: user?.location?.city || "",
    province: user?.location?.province || "",
    country: user?.location?.country || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { onError("Please add a title."); return; }
    if (!form.skills.trim()) { onError("Please add at least one skill."); return; }
    if (!form.address.trim() || !form.city.trim() || !form.province.trim() || !form.country.trim()) {
      onError("Please complete your location."); return;
    }
    onSave({
      title: form.title.trim(),
      hourlyRate: form.hourlyRate,
      bio: form.bio,
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      location: { address: form.address.trim(), city: form.city.trim(), province: form.province.trim(), country: form.country.trim() },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-xl overflow-y-auto max-h-[90vh] bg-white rounded-2xl p-6 shadow-2xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h2 className="text-base font-bold text-gray-900">Complete your profile</h2>
            <p className="text-xs text-gray-500 mt-0.5">Required before submitting a proposal.</p>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Hourly Rate ($)</label>
              <input type="number" min="0" value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"/>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Bio</label>
            <textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"/>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Skills (comma separated)</label>
            <input value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="React, Node.js, UI/UX"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"/>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {(["address", "city", "province", "country"] as const).map((f) => (
              <div key={f}>
                <label className="block text-xs font-semibold text-gray-700 mb-1 capitalize">{f}</label>
                <input value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"/>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-semibold hover:bg-emerald-700">Save and apply</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 11. MAIN COMPONENT
// ============================================================

export default function FreelancerDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeNav, setActiveNav] = useActiveNav();
  const [searchParams, setSearchParams] = useSearchParams();

  // UI state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Find Work
  const [jobSearch, setJobSearch] = useState("");
  const [browseJobs, setBrowseJobs] = useState<Job[]>([]);
  const [applyingTo, setApplyingTo] = useState<Job | null>(null);

  // Modals
  const [editingProfile, setEditingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<PendingProposalPayload | null>(null);
  const [showWorkModal, setShowWorkModal] = useState<string | null>(null);

  // Offers
  const [offers, setOffers] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const activeTab = (searchParams.get("view") === "offers" ? "offers" : "dashboard") as "dashboard" | "offers";

  // Chat
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  // Hero search
  const [searchQuery, setSearchQuery] = useState("");
  const [isVideoPlaying, setIsVideoPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState<ToastMessage>(null);
  const showToast = useCallback((type: "success" | "error", text: string) => {
    setToastMsg({ type, text });
    const t = setTimeout(() => setToastMsg(null), 4000);
    return () => clearTimeout(t);
  }, []);

  // Fetch dashboard
  const fetchDashboardData = useCallback(() => {
    setLoadingDashboard(true);
    dashboardService.getFreelancerDashboard()
      .then((data) => { setDashboardData(data); setLoadingDashboard(false); })
      .catch(() => { setDashboardData(null); setLoadingDashboard(false); showToast("error", "Failed to load dashboard."); });
  }, [showToast]);

  useEffect(() => {
    platformService.getFreelancers().catch(() => {});
    fetchDashboardData();
    platformService.getPendingOffers().then(setOffers).catch(() => {});
  }, [fetchDashboardData]);

  useEffect(() => {
    if (activeNav === "find_work" && browseJobs.length === 0) {
      jobService.getOpenJobs?.()
        .then((jobs: Job[]) => setBrowseJobs(jobs))
        .catch(() => showToast("error", "Could not load open jobs."));
    }
  }, [activeNav, browseJobs.length, showToast]);

  useEffect(() => {
    if (dashboardData?.user?._id) {
      const token = localStorage.getItem("token") || "";
      chatService.connect(dashboardData.user._id, token);
      return () => { chatService.disconnect(); };
    }
  }, [dashboardData?.user?._id]);

  // Handlers
  const handleHeroSearch = useCallback(() => {
    navigate(searchQuery.trim() ? `/search?q=${encodeURIComponent(searchQuery.trim())}` : "/search");
  }, [searchQuery, navigate]);

  const toggleVideo = useCallback(() => {
    if (!videoRef.current) return;
    if (isVideoPlaying) { videoRef.current.pause(); setIsVideoPlaying(false); }
    else { videoRef.current.play(); setIsVideoPlaying(true); }
  }, [isVideoPlaying]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate("/login");
  }, [dispatch, navigate]);

  const isProfileComplete = useCallback((u?: User | null) => {
    if (!u) return false;
    return Boolean(u.title?.trim() && u.skills?.length && u.hourlyRate && u.hourlyRate > 0 &&
      u.location?.address?.trim() && u.location?.city?.trim() &&
      u.location?.province?.trim() && u.location?.country?.trim());
  }, []);

  const handleSaveProfile = useCallback(async (updatedFields: Partial<User>) => {
    try {
      const responseData = await platformService.updateProfile(updatedFields);
      const fullUpdatedUser = { ...(dashboardData?.user || {}), ...responseData, ...updatedFields };
      localStorage.setItem("user", JSON.stringify(fullUpdatedUser));
      setDashboardData((prev) => prev ? { ...prev, user: fullUpdatedUser as User } : prev);
      setEditingProfile(false);
      showToast("success", "Profile updated successfully.");
    } catch { showToast("error", "Something went wrong while saving your profile."); }
  }, [dashboardData?.user, showToast]);

  const handleSaveProfileAndApply = useCallback(async (updated: Partial<User>) => {
    if (!dashboardData?.user?._id || !pendingProposal) return;
    try {
      await jobService.updateFreelancerProfile(dashboardData.user._id, updated);
      await fetchDashboardData();
      setShowProfileModal(false);
      const { jobId, payload } = pendingProposal;
      await jobService.submitProposal(jobId, payload);
      setPendingProposal(null);
      setApplyingTo(null);
      setActiveNav("proposals");
      await fetchDashboardData();
      showToast("success", "Profile updated and proposal submitted.");
    } catch { showToast("error", "Could not save profile or submit proposal."); }
  }, [dashboardData?.user?._id, fetchDashboardData, pendingProposal, showToast]);

  const handleApplyToJob = useCallback(async (jobId: string, payload: { bid: number; coverLetter: string }) => {
    if (!isProfileComplete(dashboardData?.user)) {
      setPendingProposal({ jobId, payload });
      setShowProfileModal(true);
      showToast("error", "Complete your profile before applying.");
      return;
    }
    try {
      await jobService.submitProposal(jobId, payload);
      setApplyingTo(null);
      setActiveNav("proposals");
      fetchDashboardData();
      showToast("success", "Proposal submitted.");
    } catch (error) {
      showToast("error", "Could not submit proposal. Please try again.");
      throw error;
    }
  }, [dashboardData?.user, fetchDashboardData, isProfileComplete, showToast]);

  const handleWithdrawProposal = useCallback(async (proposalId: string) => {
    if (!confirm("Withdraw this proposal?")) return;
    try {
      await jobService.withdrawProposal(proposalId);
      fetchDashboardData();
      showToast("success", "Proposal withdrawn.");
    } catch { showToast("error", "Withdrawal failed."); }
  }, [fetchDashboardData, showToast]);

  const handleMessageClient = useCallback(async (clientId: string, jobId: string) => {
    try {
      const conversation = await jobService.createConversation(clientId, jobId);
      setSelectedConvId(conversation._id);
      setSelectedParticipant(conversation.participant);
      setActiveNav("messages");
    } catch { showToast("error", "Could not open chat."); }
  }, [showToast]);

  const handleOfferResponse = useCallback(async (contractId: string, action: "accept" | "decline") => {
    setProcessingId(contractId);
    try {
      const res = await platformService.respondToOffer(contractId, action);
      if (res?.success) {
        showToast("success", `Offer ${action}ed successfully.`);
        setOffers((prev) => prev.filter((o) => o._id !== contractId));
      } else throw new Error();
    } catch { showToast("error", "Failed to respond to offer."); }
    finally { setProcessingId(null); }
  }, [showToast]);

  // Derived
  const user = dashboardData?.user;
  const stats = dashboardData?.stats || { totalEarnings: 0, activeJobs: 0, openProposals: 0, profileViews: 0 };
  const userFullName = user ? `${user.firstName} ${user.lastName}` : "Freelancer";
  const earnings = dashboardData?.earnings || [];
  const transactions = dashboardData?.transactions || [];
  const filteredJobs = browseJobs.filter((j) => {
    const q = jobSearch.toLowerCase();
    return !q || j.title.toLowerCase().includes(q) || j.skills?.some((s) => s.toLowerCase().includes(q));
  });

  if (loadingDashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"/>
          <p className="text-sm text-gray-400">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      <style>{`
        @keyframes tabFadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .animate-tab-in { animation: tabFadeIn 0.2s ease-out; }
        @media (prefers-reduced-motion: reduce) { .animate-tab-in { animation: none; } }
      `}</style>

      {/* ── Toast ── */}
      {toastMsg && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 px-5 py-3 rounded-full shadow-xl text-sm font-semibold ${
          toastMsg.type === "success" ? "bg-emerald-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toastMsg.type === "success" ? "✓" : "✕"} {toastMsg.text}
        </div>
      )}

      {/* ================================================================
          TOP NAVIGATION BAR — matches ClientDashboard pattern
      ================================================================ */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo */}
            <Link to="/" className="shrink-0"><Logo /></Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
              {NAV_ITEMS.map(({ id, label, icon }) => {
                const active = activeNav === id;
                return (
                  <button key={id} type="button" onClick={() => setActiveNav(id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                    aria-current={active ? "page" : undefined}>
                    {icon}{label}
                  </button>
                );
              })}
            </nav>

            {/* Desktop right */}
            <div className="hidden md:flex items-center gap-3">
              <button onClick={() => navigate("/search")}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-full hover:border-emerald-500 hover:text-emerald-700 transition">
                Find work
              </button>
              {/* Offers badge */}
              {offers.length > 0 && (
                <button
                  onClick={() => setSearchParams((prev) => { const p = new URLSearchParams(prev); p.set("view", "offers"); return p; })}
                  className="relative px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-semibold rounded-full hover:bg-amber-100 transition">
                  Offers
                  <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] font-bold">{offers.length}</span>
                </button>
              )}
              {/* User chip */}
              <div className="flex items-center gap-2.5 px-3 py-1.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer" onClick={() => setActiveNav("profile")}>
                {user?.profileImage ? (
                  <img src={user.profileImage} alt={userFullName} className="w-8 h-8 rounded-full object-cover"/>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: avatarColor(user?._id || "") }}>
                    {getInitials(userFullName)}
                  </div>
                )}
                <div className="hidden lg:block min-w-0">
                  <p className="text-xs font-semibold text-gray-800 truncate max-w-[120px]">{userFullName}</p>
                  <p className="text-[10px] text-gray-400">Freelancer</p>
                </div>
              </div>
              <button onClick={handleLogout}
                className="px-3 py-1.5 border border-gray-200 text-gray-500 text-sm font-medium rounded-full hover:border-red-300 hover:text-red-500 transition">
                Sign out
              </button>
            </div>

            {/* Mobile hamburger */}
            <button type="button" onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600" aria-label="Menu">
              <span className="block w-5 h-4 relative">
                <span className={`absolute left-0 top-0 w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${mobileMenuOpen ? "top-1.5 rotate-45" : ""}`}/>
                <span className={`absolute left-0 top-1.5 w-5 h-0.5 bg-gray-700 rounded-full transition-all ${mobileMenuOpen ? "opacity-0" : "opacity-100"}`}/>
                <span className={`absolute left-0 bottom-0 w-5 h-0.5 bg-gray-700 rounded-full transition-all duration-300 ${mobileMenuOpen ? "bottom-1.5 -rotate-45" : ""}`}/>
              </span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        <div className={`md:hidden border-t bg-white overflow-hidden transition-all duration-300 ease-out ${mobileMenuOpen ? "max-h-[28rem] opacity-100 border-gray-100" : "max-h-0 opacity-0 border-t-0"}`}>
          <div className="px-4 pb-4 pt-2 flex flex-col gap-1">
            {NAV_ITEMS.map(({ id, label, icon }, i) => (
              <button key={id}
                className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
                  activeNav === id ? "bg-emerald-50 text-emerald-700" : "text-gray-700 hover:bg-gray-50"
                } ${mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"}`}
                style={{ transitionDelay: mobileMenuOpen ? `${i * 20}ms` : "0ms" }}
                onClick={() => { setMobileMenuOpen(false); setActiveNav(id); }}>
                {icon}{label}
              </button>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
              <button onClick={handleLogout}
                className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-full text-sm font-medium hover:border-red-300 hover:text-red-500 transition">
                Sign out
              </button>
              <button onClick={() => { setMobileMenuOpen(false); navigate("/search"); }}
                className="flex-1 py-2 bg-emerald-600 text-white rounded-full text-sm font-semibold hover:bg-emerald-700 transition">
                Find work
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ================================================================
          HERO SECTION (preserved from original)
      ================================================================ */}
      <section className="relative overflow-hidden min-h-96 sm:min-h-[520px] flex flex-col justify-between py-12 sm:py-20 px-6 sm:px-12 mt-16">
        <div className="sm:hidden absolute inset-0 z-0 bg-gradient-to-br from-emerald-900 via-emerald-700 to-teal-600"/>
        <video ref={videoRef} autoPlay loop muted playsInline
          className="hidden sm:block absolute inset-0 w-full h-full object-cover z-0 brightness-75">
          <source src="/DesktopHeader.webm" type="video/webm"/>
        </video>
        <div className="absolute inset-0 z-10 bg-black/25"/>

        <div className="max-w-5xl w-full mx-auto relative z-20 flex-1 flex flex-col justify-center">
          <p className="text-emerald-300 text-xs font-semibold uppercase tracking-widest mb-3">Your workspace</p>
          <h1 className="text-3xl sm:text-5xl font-light text-white leading-tight mb-8 tracking-tight max-w-2xl">
            Welcome back, <span className="font-bold">{user?.firstName || "Freelancer"}</span>
          </h1>
          <div className="flex bg-white rounded-xl p-1.5 max-w-xl shadow-2xl items-center">
            <input type="search" placeholder="Search for jobs or skills…"
              className="flex-1 border-none outline-none pl-4 pr-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 bg-transparent"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleHeroSearch()}/>
            <button onClick={handleHeroSearch}
              className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-emerald-700 transition">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 1 5.196 5.196a7.5 7.5 0 0 1 10.603 10.603Z"/>
              </svg>
            </button>
          </div>
          <div className="flex gap-2 flex-wrap mt-5">
            {POPULAR_TAGS.map((tag) => (
              <button key={tag}
                className="px-3 py-1.5 border border-white/30 rounded-lg text-xs font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-gray-900 transition"
                onClick={() => { setSearchQuery(tag); navigate(`/search?q=${encodeURIComponent(tag)}`); }}>
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl w-full mx-auto relative z-20 mt-8 flex items-center justify-between">
          <div className="flex items-center gap-6 flex-wrap text-xs font-semibold text-white/60 select-none">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider">Trusted by</span>
            {["Meta", "Google", "NETFLIX", "P&G", "PayPal"].map((b) => (
              <span key={b} className="text-white/70 hover:text-white transition">{b}</span>
            ))}
          </div>
          <button onClick={toggleVideo}
            className="hidden sm:flex w-8 h-8 rounded-full border border-white/20 bg-black/30 items-center justify-center text-white/70 hover:bg-white/20 transition text-xs"
            aria-label={isVideoPlaying ? "Pause video" : "Play video"}>
            {isVideoPlaying ? "Ⅱ" : "▶"}
          </button>
        </div>
      </section>

      {/* ================================================================
          MAIN CONTENT
      ================================================================ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 w-full">

     

        {/* ── Offers tab ── */}
        {activeTab === "offers" && (
          <section className="space-y-4 animate-tab-in">
            {offers.length > 0 ? offers.map((offer) => {
              const processing = processingId === offer._id;
              return (
                <div key={offer._id}
                  className="bg-white border border-amber-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-50 text-amber-700 px-2 py-0.5 rounded-lg">{offer.budgetType} Contract</span>
                    <h3 className="text-sm font-bold text-gray-900 mt-1.5">{offer.contractTitle}</h3>
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">"{offer.message}"</p>
                    <p className="text-xs font-semibold text-gray-700 mt-2">
                      Budget: <span className="text-emerald-600">${offer.totalAmount}</span> · Deadline: {new Date(offer.deadline).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto shrink-0">
                    <button onClick={() => handleOfferResponse(offer._id, "decline")} disabled={processing}
                      className="flex-1 md:flex-none text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition disabled:opacity-50">
                      Decline
                    </button>
                    <button onClick={() => handleOfferResponse(offer._id, "accept")} disabled={processing}
                      className="flex-1 md:flex-none text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-sm transition disabled:opacity-50">
                      {processing ? "Processing…" : "Accept Offer"}
                    </button>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
                <p className="text-sm text-gray-400 mb-4">No pending offers right now.</p>
                <button onClick={() => navigate("/search")}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition">
                  Browse jobs
                </button>
              </div>
            )}
          </section>
        )}

        {/* ── Dashboard tab ── */}
        {activeTab === "dashboard" && (
          <div key={activeNav} className="animate-tab-in space-y-8">

            {/* OVERVIEW */}
            {activeNav === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total Earned" value={`$${(stats.totalEarnings || 0).toLocaleString()}`} sub="All time" colorClass="bg-emerald-50"
                    icon={<svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33"/></svg>}
                  />
                  <StatCard label="Active Jobs" value={String(stats.activeJobs || 0)} sub={stats.activeJobs > 0 ? "In progress" : undefined} colorClass="bg-blue-50"
                    icon={<svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006-3.75 3.75m0 0-3.75-3.75m3.75 3.75V8.75"/></svg>}
                  />
                  <StatCard label="Proposals Sent" value={String(stats.openProposals || 0)} sub="Awaiting response" colorClass="bg-violet-50"
                    icon={<svg className="w-4 h-4 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12"/></svg>}
                  />
                  <StatCard label="Profile Views" value={String(stats.profileViews || 0)} sub="This month" colorClass="bg-amber-50"
                    icon={<svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>}
                  />
                </div>

                {(dashboardData?.activeJobs?.length ?? 0) > 0 && (
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                      <h2 className="text-sm font-bold text-gray-900">Active Jobs</h2>
                      <button onClick={() => setActiveNav("active")} className="text-xs text-emerald-600 font-semibold hover:underline">View all →</button>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {dashboardData!.activeJobs.slice(0, 3).map((job) => (
                        <div key={job._id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Due {formatDate(job.deadline)}</p>
                          </div>
                          <div className="flex items-center gap-3 ml-4">
                            <span className="text-sm font-bold text-gray-800">${job.budget}</span>
                            <StatusBadge status={job.status} size="sm"/>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <h2 className="text-sm font-bold text-gray-900">Recent Proposals</h2>
                    <button onClick={() => setActiveNav("proposals")} className="text-xs text-emerald-600 font-semibold hover:underline">View all →</button>
                  </div>
                  {(dashboardData?.proposals?.length ?? 0) > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {dashboardData!.proposals.slice(0, 3).map((p) => (
                        <div key={p._id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/60 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.jobId?.title || "Job Application"}</p>
                            <p className="text-xs text-gray-400 mt-0.5">Bid: ${p.bid}</p>
                          </div>
                          <StatusBadge status={p.status} size="sm"/>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState title="No proposals yet" description="Apply to open jobs to see your proposals here."
                      action={<button onClick={() => setActiveNav("find_work")} className="text-xs text-emerald-600 font-semibold hover:underline">Browse jobs →</button>}
                    />
                  )}
                </div>
              </div>
            )}

            {/* FIND WORK */}
            {activeNav === "find_work" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Find Work</h1>
                  <p className="text-xs text-gray-400 mt-1">Browse open projects that match your skills.</p>
                </div>
                <div className="relative max-w-md">
                  <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/></svg>
                  <input type="text" placeholder="Search by title or skill…" value={jobSearch}
                    onChange={(e) => setJobSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm placeholder:text-gray-400 focus:outline-none focus:border-emerald-400 bg-white shadow-sm"/>
                </div>
                {filteredJobs.length === 0 ? (
                  <EmptyState title="No open jobs found" description="Try a different search term or check back later."/>
                ) : (
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredJobs.map((job) => <BrowseJobCard key={job._id} job={job} onApply={setApplyingTo}/>)}
                  </div>
                )}
              </div>
            )}

            {/* PROPOSALS */}
            {activeNav === "proposals" && (
              <div className="space-y-6">
                <h1 className="text-xl font-bold text-gray-900">My Proposals</h1>
                {(dashboardData?.proposals?.length ?? 0) === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <EmptyState title="No proposals yet" description="Start applying to jobs to track your proposals here."
                      action={<button onClick={() => setActiveNav("find_work")} className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition">Browse open jobs</button>}
                    />
                  </div>
                ) : (
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="divide-y divide-gray-50">
                      {dashboardData!.proposals.map((p) => (
                        <div key={p._id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{p.jobId?.title || "Job Application"}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                              <span>Bid: <span className="font-semibold text-gray-700">${p.bid}</span></span>
                              {p.estimatedDays && <><span>·</span><span>{p.estimatedDays}d delivery</span></>}
                              {p.createdAt && <><span>·</span><span>{new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></>}
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <StatusBadge status={p.status}/>
                            {p.status === "pending" && (
                              <button onClick={() => handleWithdrawProposal(p._id)}
                                className="text-xs text-red-500 hover:text-red-700 font-medium transition">
                                Withdraw
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* MY JOBS */}
            {activeNav === "active" && (
              <div className="space-y-6">
                <h1 className="text-xl font-bold text-gray-900">My Jobs</h1>
                {(dashboardData?.activeJobs?.length ?? 0) === 0 ? (
                  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
                    <EmptyState title="No active jobs" description="Once a client hires you, your jobs will appear here."
                      action={<button onClick={() => setActiveNav("find_work")} className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-full hover:bg-emerald-700 transition">Find work</button>}
                    />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {dashboardData!.activeJobs.map((job) => (
                      <ActiveJobCard key={job._id} job={job} onMessage={handleMessageClient} onSubmit={setShowWorkModal}/>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* EARNINGS */}
            {activeNav === "earnings" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Earnings</h1>
                  <p className="text-3xl font-extrabold text-gray-900 mt-1">${(stats.totalEarnings || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Total earned across all jobs</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Monthly Overview</h3>
                  <EarningsChart data={earnings}/>
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="text-sm font-semibold text-gray-800">Recent Transactions</h3>
                  </div>
                  {transactions.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="border-b bg-gray-50 text-gray-400 text-xs">
                          <tr>
                            {["Date", "Job", "Amount", "Status"].map(h => (
                              <th key={h} className="py-3 px-5 font-semibold uppercase tracking-wider">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {transactions.slice(0, 8).map((tx) => (
                            <tr key={tx._id} className="hover:bg-gray-50/60 transition-colors">
                              <td className="py-3 px-5 text-gray-500 text-xs">{new Date(tx.createdAt).toLocaleDateString()}</td>
                              <td className="py-3 px-5 font-medium text-gray-800 truncate max-w-[160px]">{tx.jobTitle}</td>
                              <td className="py-3 px-5 font-bold text-gray-900">${tx.amount}</td>
                              <td className="py-3 px-5"><StatusBadge status={tx.status} size="sm"/></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState title="No transactions yet" description="Completed jobs will appear here."/>
                  )}
                </div>
              </div>
            )}

            {/* MESSAGES */}
            {activeNav === "messages" && user && (
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="grid md:grid-cols-3 h-full">
                  <div className="border-r border-gray-100 overflow-y-auto bg-gray-50/40">
                    <ChatConversationList
                      onSelectConversation={(convId, conversation) => { setSelectedConvId(convId); setSelectedParticipant(conversation); }}
                      selectedId={selectedConvId || undefined}
                    />
                  </div>
                  <div className="md:col-span-2">
                    {selectedConvId && selectedParticipant ? (
                      <ChatRoom conversationId={selectedConvId} currentUserId={user._id} conversation={selectedParticipant}/>
                    ) : (
                      <EmptyState title="Select a conversation" description="Choose a conversation from the left to start messaging."/>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROFILE */}
            {activeNav === "profile" && user && (
              <section className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
                <div className="flex justify-end mb-6">
                  <button onClick={() => setEditingProfile(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-500 text-xs font-medium rounded-full hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300 transition">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    Edit Profile
                  </button>
                </div>
                <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
                  {/* Avatar */}
                  <div className="flex-none flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-20 blur-sm"/>
                      <div className="relative w-48 aspect-square rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                        {user.profileImage ? (
                          <img src={user.profileImage} alt={userFullName} className="w-full h-full object-cover"/>
                        ) : (
                          <span className="text-4xl font-semibold text-gray-300">{getInitials(userFullName)}</span>
                        )}
                      </div>
                    </div>
                    <div className="w-full px-1">
                      <div className="flex justify-between text-[10px] text-gray-400 mb-1.5 uppercase tracking-wider">
                        <span>Availability</span>
                        <span className="text-emerald-500">72%</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full w-[72%] bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"/>
                      </div>
                    </div>
                  </div>
                  {/* Info */}
                  <div className="flex-1 space-y-5 text-center lg:text-left w-full">
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"/>
                        </span>
                        Available for work
                      </span>
                      {user.hourlyRate && user.hourlyRate > 0 && (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-700">
                          <DollarSign className="h-3 w-3"/>${user.hourlyRate}/hr
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-700">
                        <Award className="h-3 w-3"/>{(user.rating || 5.0).toFixed(1)} ({user.reviewCount || 0} reviews)
                      </span>
                    </div>
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{user.firstName} {user.lastName}</h1>
                      {user.title && <p className="text-sm font-medium text-emerald-600 mt-0.5">{user.title}</p>}
                    </div>
                    {user.bio && <p className="text-sm text-gray-500 leading-relaxed max-w-xl mx-auto lg:mx-0">{user.bio}</p>}
                    <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto lg:mx-0">
                      {[{ label: "Projects", value: "12" }, { label: "Avg. Rating", value: (user.rating || 5.0).toFixed(1) }, { label: "Reviews", value: String(user.reviewCount || 0) }].map(({ label, value }) => (
                        <div key={label} className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                          <p className="text-lg font-bold text-gray-900">{value}</p>
                          <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">{label}</p>
                        </div>
                      ))}
                    </div>
                    {user.skills && user.skills.length > 0 && (
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-2">Expertise</p>
                        <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                          {user.skills.map((skill) => (
                            <span key={skill} className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 hover:border-gray-300 transition">{skill}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <hr className="border-gray-100"/>
                    <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-gray-400">
                      {user.location?.city && user.location?.country && (
                        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-gray-300"/>{user.location.city}, {user.location.country}</span>
                      )}
                      {user.title && (
                        <span className="flex items-center gap-1.5"><Code2 className="h-3.5 w-3.5 text-gray-300"/>{user.title}</span>
                      )}
                      <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-300"/>UTC+5:30</span>
                    </div>
                  </div>
                </div>
              </section>
            )}

          </div>
        )}
      </main>

      {/* ── Marketing sections (preserved from original) ── */}
      <Slide slidesToShow={5} arrowsScroll={5}>
        {cards.map((card) => <CatCard key={card.id} card={card}/>)}
      </Slide>

      <TechStack/>

      <section className="py-12 px-4 sm:px-6 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-10">
            How it works
            <div className="w-10 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full mx-auto mt-3"/>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ n, title, desc }) => (
              <div key={n} className="group flex sm:flex-col items-start sm:items-center gap-5 p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-emerald-200 transition-all hover:-translate-y-1">
                <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-br from-emerald-600 to-teal-500 text-white text-sm font-bold flex items-center justify-center shadow-md shadow-emerald-500/20">{n}</div>
                <div className="sm:text-center">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1.5">{title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 py-8 px-4 sm:px-6 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-3">Contracts</h4>
              <button onClick={() => setActiveNav("active")} className="block text-xs text-gray-500 mb-2 hover:text-emerald-600">Active Jobs</button>
              <button onClick={() => navigate("/search")} className="block text-xs text-gray-500 mb-2 hover:text-emerald-600">Find Work</button>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-3">Finance</h4>
              <button onClick={() => setActiveNav("earnings")} className="block text-xs text-gray-500 mb-2 hover:text-emerald-600">Earnings</button>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-3">Legal</h4>
              <Link to="/terms" className="block text-xs text-gray-500 mb-2 hover:text-emerald-600">Terms of Service</Link>
              <Link to="/privacy" className="block text-xs text-gray-500 mb-2 hover:text-emerald-600">Privacy Policy</Link>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-gray-900 uppercase tracking-wider mb-3">Workspace</h4>
              <Link to="/" className="block text-xs text-gray-500 mb-2 hover:text-emerald-600">Portal Hub</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200">
            <Link to="/"><Logo/></Link>
            <span className="text-xs text-gray-400">© {new Date().getFullYear()} FreelanceFluxo. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* ── Modals ── */}
      {applyingTo && (
        <ApplyModal job={applyingTo} onClose={() => setApplyingTo(null)} onSubmit={handleApplyToJob}/>
      )}
      {showWorkModal && (
        <WorkSubmissionModal
          jobId={showWorkModal}
          onClose={() => setShowWorkModal(null)}
          onSuccess={() => { fetchDashboardData(); showToast("success", "Work submitted successfully."); }}
          onError={(msg) => showToast("error", msg)}
        />
      )}
      {showProfileModal && user && (
        <ProfileCompletionModal
          user={user}
          onSave={handleSaveProfileAndApply}
          onCancel={() => { setShowProfileModal(false); setPendingProposal(null); }}
          onError={(msg) => showToast("error", msg)}
        />
      )}
      {editingProfile && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setEditingProfile(false)}/>
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <ProfileEditor
              user={user}
              onSave={handleSaveProfile}
              onCancel={() => setEditingProfile(false)}
              onError={(msg) => showToast("error", msg)}
            />
          </div>
        </div>
      )}
    </div>
  );
}