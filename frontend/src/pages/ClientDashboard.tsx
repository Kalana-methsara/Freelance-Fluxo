// ============================================================
// ClientDashboard.tsx – Top Nav Bar Layout (matches AdminDashboard pattern)
// ============================================================

import { useEffect, useState, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import dashboardService from '../services/dashboardService';
import jobService from '../services/jobService';
import chatService from '../services/chatService';
import ChatConversationList from '../components/ChatConversationList';
import ChatRoom from '../components/ChatRoom';
import { logout } from '../features/authSlice';
import { formatDate, getInitials } from '../utils/auth';

// ============================================================
// 1. TYPES & INTERFACES
// ============================================================

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  companyName?: string;
  email: string;
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
  // ⚠️ Confirm this is the field your API actually returns to identify the
  // poster (could be `clientId`, `userId`, `ownerId`, etc.) and rename below.
  postedBy?: string;
  freelancerId?: { _id: string; firstName: string; lastName: string };
}

interface Applicant {
  _id: string;
  jobId?: { _id: string; title: string };
  freelancerId?: { _id: string; firstName: string; lastName: string };
  bid: number;
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

// ============================================================
// 2. ICONS
// ============================================================

function OverviewNavIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}
function ProjectsNavIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  );
}
function ApplicantsNavIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function InvoicesNavIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    </svg>
  );
}
function MessagesNavIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}
function MenuIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}
function XIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
function LogoutIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function TrashIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}
function ChevronRight({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

const Icons = {
  Budget: () => (
    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Spent: () => (
    <svg className="w-5 h-5 text-emerald-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Projects: () => (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Invoices: () => (
    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Message: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

// ============================================================
// 3. CONSTANTS
// ============================================================

const NAV_ITEMS = [
  { label: 'Overview', icon: OverviewNavIcon, id: 'overview' },
  { label: 'Projects', icon: ProjectsNavIcon, id: 'projects' },
  { label: 'Applicants', icon: ApplicantsNavIcon, id: 'applicants' },
  { label: 'Invoices', icon: InvoicesNavIcon, id: 'invoices' },
  { label: 'Messages', icon: MessagesNavIcon, id: 'messages' },
];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700',
  in_progress: 'bg-blue-50 text-blue-700',
  under_review: 'bg-amber-50 text-amber-700',
  completed: 'bg-emerald-50 text-emerald-700',
  draft: 'bg-gray-100 text-gray-500',
  open: 'bg-blue-50 text-blue-700',
  pending: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-emerald-50 text-emerald-700',
};

// ============================================================
// 4. UTILITY FUNCTIONS
// ============================================================

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
}

// ============================================================
// 5. PRESENTATIONAL COMPONENTS (memoized)
// ============================================================

const Logo = memo(() => (
  <span className="font-serif text-xl tracking-tight text-gray-900">
    freelance<em className="italic text-emerald-600">fluxo</em>
  </span>
));

const StatusBadge = memo(({ status }: { status: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusStyle(status)}`}>
    {status.replace('_', ' ')}
  </span>
));

// ── Enhanced Stat Card ──
const EnhancedStatCard = memo(({ label, value, icon: Icon, sub, accent }: { label: string; value: string; icon: React.ElementType; sub?: string; accent?: boolean }) => (
  <div className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${accent ? 'bg-emerald-700 border-emerald-700' : 'bg-white border-gray-200'}`}>
    <div className="flex items-center justify-between">
      <p className={`text-xs font-medium ${accent ? 'text-emerald-200' : 'text-gray-500'}`}>{label}</p>
      <div className={`p-2 rounded-lg ${accent ? 'bg-emerald-600/30' : 'bg-gray-50'}`}>
        <Icon />
      </div>
    </div>
    <p className={`text-2xl font-bold mt-2 ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-emerald-200' : 'text-gray-500'}`}>{sub}</p>}
  </div>
));

// ── Empty State ──
const EmptyState = memo(({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="text-center py-12 px-4">
    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
));

// ── Project Card ──
const ProjectCard = memo(({
  project,
  canDelete,
  onMessage,
  onView,
  onDelete,
}: {
  project: Project;
  canDelete: boolean;
  onMessage: (freelancerId: string, jobId: string) => void;
  onView: (project: Project) => void;
  onDelete: (projectId: string) => void;
}) => {
  const progress = project.budget > 0 ? Math.min(100, ((project.spent || 0) / project.budget) * 100) : 0;

  return (
    <div
      className="px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 cursor-pointer group"
      onClick={() => onView(project)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate group-hover:text-emerald-700 transition">{project.title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {project.freelancerId
              ? `${project.freelancerId.firstName} ${project.freelancerId.lastName}`
              : 'No freelancer assigned'}
            {' · '}Due {formatDate(project.deadline)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
          <span className="text-xs text-gray-500">${project.spent || 0} / ${project.budget}</span>
          <StatusBadge status={project.status} />
          {canDelete && (
            <button
              title="Delete project"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project._id);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <TrashIcon className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="w-full sm:max-w-xs">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
        </div>
        {project.freelancerId && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMessage(project.freelancerId!._id, project._id);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition"
          >
            <Icons.Message />
            Message freelancer
          </button>
        )}
      </div>
    </div>
  );
});

// ── Confirm Delete Modal ──
const ConfirmModal = memo(({
  isOpen,
  title,
  message,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
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
            onClick={onCancel}
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
});

// ── Project Detail Drawer ──
const ProjectDetailDrawer = memo(({
  project,
  canDelete,
  onClose,
  onMessage,
  onDelete,
}: {
  project: Project | null;
  canDelete: boolean;
  onClose: () => void;
  onMessage: (freelancerId: string, jobId: string) => void;
  onDelete: (projectId: string) => void;
}) => {
  if (!project) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Project Details</p>
            <h3 className="text-lg font-semibold text-gray-900">{project.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.createdAt && <span className="text-xs text-gray-500">Posted {formatDate(project.createdAt)}</span>}
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Budget</p>
              <p className="text-sm font-medium text-gray-800">${project.budget}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Spent</p>
              <p className="text-sm font-medium text-gray-800">${project.spent || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Deadline</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(project.deadline)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Freelancer</p>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center justify-between gap-3">
              {project.freelancerId ? (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {project.freelancerId.firstName} {project.freelancerId.lastName}
                    </p>
                  </div>
                  <button
                    onClick={() => onMessage(project.freelancerId!._id, project._id)}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition flex-shrink-0"
                  >
                    <Icons.Message />
                    Message
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">No freelancer assigned yet</p>
              )}
            </div>
          </div>

          {project.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Description</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{project.description}</p>
              </div>
            </div>
          )}

          {canDelete && (
            <div className="pt-2 border-t border-gray-100">
              <button
                onClick={() => onDelete(project._id)}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                <TrashIcon className="w-4 h-4" />
                Delete this project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ── Applicant Item ──
const ApplicantItem = memo(({ applicant }: { applicant: Applicant }) => (
  <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900 truncate">
        {applicant.freelancerId?.firstName} {applicant.freelancerId?.lastName}
      </p>
      <p className="text-xs text-gray-500 mt-0.5 truncate">
        {applicant.jobId?.title || 'Untitled job'} · Bid ${applicant.bid}
      </p>
    </div>
    <StatusBadge status={applicant.status} />
  </div>
));

// ── Invoice Item ──
const InvoiceItem = memo(({ invoice }: { invoice: Invoice }) => (
  <div className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
    <div className="min-w-0 flex-1">
      <p className="font-medium text-gray-900 truncate">{invoice.project}</p>
      <p className="text-xs text-gray-500 mt-0.5">{formatDate(invoice.date)}</p>
    </div>
    <div className="flex items-center gap-4 flex-shrink-0">
      <span className="font-semibold text-gray-900">${invoice.amount}</span>
      <span className={`text-xs font-medium ${invoice.paid ? 'text-emerald-600' : 'text-amber-600'}`}>
        {invoice.paid ? 'Paid' : 'Pending'}
      </span>
    </div>
  </div>
));

// ============================================================
// 6. MAIN COMPONENT
// ============================================================

export default function ClientDashboard() {
  const [activeNav, setActiveNav] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // Chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  // Project detail / delete state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ── Fetch dashboard ──
  const fetchDashboard = useCallback(() => {
    setLoading(true);
    dashboardService
      .getClientDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchDashboard();
  }, [fetchDashboard]);

  // ── WebSocket connection ──
  useEffect(() => {
    if (data?.user?._id) {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      chatService.connect(data.user._id, token);
      return () => {
        chatService.disconnect();
      };
    }
  }, [data?.user?._id]);

  // ── Handlers ──
  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const handleMessageFreelancer = useCallback(async (freelancerId: string, jobId: string) => {
    try {
      const conversation = await jobService.createConversation(freelancerId, jobId);
      setSelectedConvId(conversation._id);
      setSelectedParticipant(conversation.participant);
      setActiveNav('messages');
    } catch (err) {
      // toast would be better; fallback to alert for now
      alert('Could not start conversation');
    }
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await dashboardService.deleteJob(projectId);
      setSelectedProject(null);
      fetchDashboard();
    } catch (err) {
      alert('Could not delete project');
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  }, [fetchDashboard]);

  // ── Derived data ──
  const user = data?.user;
  const stats = data?.stats || { totalBudget: 0, totalSpent: 0, activeProjects: 0, pendingInvoices: 0 };
  const name = user?.companyName || `${user?.firstName} ${user?.lastName}` || 'Client';
  const projects = data?.projects || [];
  const applicants = data?.applicants || [];
  const invoices = data?.invoices || [];

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm animate-pulse">Loading dashboard…</p>
      </div>
    );
  }

  // ── Render ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans flex flex-col">
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map(item => {
                const Icon = item.icon;
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={() => navigate('/post-job')}
                className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition shadow-sm hover:shadow"
              >
                + Post a job
              </button>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate max-w-[150px]">{name}</p>
                  <p className="text-[10px] text-gray-500">Client</p>
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
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 transition"
            >
              <MenuIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU DRAWER ===== */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl">
            <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
              <Logo />
              <button onClick={() => setMobileMenuOpen(false)} className="text-gray-500 hover:text-gray-700">
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
                    onClick={() => {
                      setActiveNav(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
            <div className="px-4 py-4 border-t border-gray-100 space-y-3">
              <button
                onClick={() => {
                  navigate('/post-job');
                  setMobileMenuOpen(false);
                }}
                className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition"
              >
                + Post a job
              </button>
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-xs font-bold flex items-center justify-center">
                  {getInitials(name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                  <p className="text-[10px] text-gray-500">Client</p>
                </div>
              </div>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 transition"
              >
                <LogoutIcon className="w-4 h-4" /> Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 pt-20 px-4 sm:px-6 lg:px-8 pb-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Preview Image */}
        <div className="rounded-2xl overflow-hidden shadow-sm border border-gray-200">
          <img src="/web_page.png" alt="Dashboard preview" className="w-full h-auto object-cover" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 capitalize -mb-2">{activeNav}</h1>

        {/* ===== OVERVIEW / PROJECTS ===== */}
        {(activeNav === 'overview' || activeNav === 'projects') && (
          <>
            {activeNav === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <EnhancedStatCard
                  label="Total budget"
                  value={`$${(stats.totalBudget || 0).toLocaleString()}`}
                  icon={Icons.Budget}
                />
                <EnhancedStatCard
                  label="Total spent"
                  value={`$${(stats.totalSpent || 0).toLocaleString()}`}
                  icon={Icons.Spent}
                  accent
                />
                <EnhancedStatCard
                  label="Active projects"
                  value={String(stats.activeProjects || 0)}
                  icon={Icons.Projects}
                  sub={stats.activeProjects > 0 ? 'In progress' : undefined}
                />
                <EnhancedStatCard
                  label="Pending invoices"
                  value={String(stats.pendingInvoices || 0)}
                  icon={Icons.Invoices}
                  sub={stats.pendingInvoices > 0 ? 'Awaiting payment' : undefined}
                />
              </div>
            )}

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Projects</h2>
                {activeNav === 'overview' && (
                  <button
                    onClick={() => setActiveNav('projects')}
                    className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                  >
                    View all →
                  </button>
                )}
              </div>
              {projects.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {projects.map((project) => (
                    <ProjectCard
                      key={project._id}
                      project={project}
                      canDelete={!!project.postedBy && project.postedBy === user?._id}
                      onView={setSelectedProject}
                      onMessage={handleMessageFreelancer}
                      onDelete={(id) => setDeleteModal({ open: true, id })}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No projects yet"
                  description="Start by posting your first job to find the perfect freelancer."
                  action={
                    <button
                      onClick={() => navigate('/post-job')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-full hover:bg-emerald-700 transition"
                    >
                      Post a job
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  }
                />
              )}
            </section>
          </>
        )}

        {/* ===== APPLICANTS ===== */}
        {(activeNav === 'overview' || activeNav === 'applicants') && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Recent applicants</h2>
              {activeNav === 'overview' && (
                <button
                  onClick={() => setActiveNav('applicants')}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
            {applicants.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {applicants.slice(0, 10).map((applicant) => (
                  <ApplicantItem key={applicant._id} applicant={applicant} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No applicants yet"
                description="Once freelancers apply to your jobs, they will appear here."
              />
            )}
          </section>
        )}

        {/* ===== INVOICES ===== */}
        {(activeNav === 'overview' || activeNav === 'invoices') && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">Invoices</h2>
              {activeNav === 'overview' && (
                <button
                  onClick={() => setActiveNav('invoices')}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
            {invoices.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {invoices.map((invoice) => (
                  <InvoiceItem key={invoice._id} invoice={invoice} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="No invoices yet"
                description="When you hire freelancers, invoices will be generated here."
              />
            )}
          </section>
        )}

        {/* ===== MESSAGES ===== */}
        {activeNav === 'messages' && user && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-3 h-[650px]">
              <div className="border-r border-gray-200 overflow-y-auto bg-gray-50/30">
                <ChatConversationList
                  onSelectConversation={(convId, participant) => {
                    setSelectedConvId(convId);
                    setSelectedParticipant(participant);
                  }}
                  selectedId={selectedConvId || undefined}
                />
              </div>
              <div className="md:col-span-2 bg-white">
                {selectedConvId && selectedParticipant ? (
                  <ChatRoom
                    conversationId={selectedConvId}
                    currentUserId={user._id}
                    otherUser={selectedParticipant}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                    <span className="text-6xl">💬</span>
                    <p className="text-sm font-light">Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ===== PROJECT DETAIL DRAWER ===== */}
      <ProjectDetailDrawer
        project={selectedProject}
        canDelete={!!selectedProject?.postedBy && selectedProject.postedBy === user?._id}
        onClose={() => setSelectedProject(null)}
        onMessage={handleMessageFreelancer}
        onDelete={(id) => setDeleteModal({ open: true, id })}
      />

      {/* ===== DELETE CONFIRM MODAL ===== */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete project"
        message="This will permanently delete this project. This action cannot be undone."
        onCancel={() => setDeleteModal({ open: false, id: null })}
        onConfirm={() => deleteModal.id && handleDeleteProject(deleteModal.id)}
      />
    </div>
  );
}