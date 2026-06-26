// ================================================================
// ClientDashboard.tsx – Professional & Advanced Implementation
// ================================================================

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  memo,
  useRef,
} from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';

// Services
import dashboardService from '../services/dashboardService';
import jobService from '../services/jobService';
import chatService from '../services/chatService';
import platformService from '../services/platformService';

// Redux
import { logout } from '../features/authSlice';

// Utils
import { formatDate, getInitials } from '../utils/auth';
import ChatConversationList from '../components/ChatConversationList';
import ChatRoom from '../components/ChatRoom';

// ================================================================
// 1. TYPES & INTERFACES
// ================================================================

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
  { label: 'Overview', icon: 'OverviewNavIcon', id: 'overview' },
  { label: 'Projects', icon: 'ProjectsNavIcon', id: 'projects' },
  { label: 'Applicants', icon: 'ApplicantsNavIcon', id: 'applicants' },
  { label: 'Invoices', icon: 'InvoicesNavIcon', id: 'invoices' },
  { label: 'Messages', icon: 'MessagesNavIcon', id: 'messages' },
] as const;

type NavId = typeof NAV_ITEMS[number]['id'];

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

const AVATAR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
}

function renderStars(rating: number) {
  return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
}

function getProjectOwnerId(project: Project): string {
  const extractId = (field: any): string => {
    if (!field) return '';
    return typeof field === 'object' ? field._id || '' : String(field);
  };
  return (
    extractId(project.postedBy) ||
    extractId(project.clientId) ||
    extractId(project.ownerId) ||
    ''
  );
}

function canDeleteProject(project: Project, userId: string | undefined): boolean {
  if (!project || !userId) return false;
  return getProjectOwnerId(project) === userId;
}

// ================================================================
// 3. ICONS (SVG components)
// ================================================================

const Icons = {
  OverviewNavIcon: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  ProjectsNavIcon: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" />
    </svg>
  ),
  ApplicantsNavIcon: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  InvoicesNavIcon: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    </svg>
  ),
  MessagesNavIcon: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Budget: ({ className = 'text-emerald-600' }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Spent: ({ className = 'text-emerald-600' }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
  Projects: ({ className = 'text-blue-600' }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Invoices: ({ className = 'text-orange-600' }) => (
    <svg className={`w-5 h-5 ${className}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Message: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Menu: ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  ),
  X: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Logout: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Trash: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
    </svg>
  ),
  ChevronRight: ({ className = 'w-4 h-4' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path d="M9 18l6-6-6-6" />
    </svg>
  ),
};

// ================================================================
// 4. CUSTOM HOOKS
// ================================================================

function useDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await dashboardService.getClientDashboard();
      setData(result);
    } catch (err) {
      setError(err as Error);
      toast.error('Failed to load dashboard. Please refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}

function useChatConnection(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
    chatService.connect(userId, token);
    return () => {
      chatService.disconnect();
    };
  }, [userId]);
}

function useProjectActions(refetch: () => void) {
  const handleMessageFreelancer = useCallback(async (freelancerId: string, jobId: string) => {
    try {
      const conversation = await jobService.createConversation(freelancerId, jobId);
      return { conversationId: conversation._id, participant: conversation.participant };
    } catch (err) {
      toast.error('Could not start conversation');
      throw err;
    }
  }, []);

  const handleDeleteProject = useCallback(async (projectId: string) => {
    try {
      await dashboardService.deleteJob(projectId);
      toast.success('Project deleted successfully');
      refetch();
    } catch (err) {
      toast.error('Could not delete project');
      throw err;
    }
  }, [refetch]);

  return { handleMessageFreelancer, handleDeleteProject };
}

function useActiveNav(): [NavId, (id: NavId) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = (searchParams.get('tab') as NavId) || 'overview';

  const setActive = useCallback((id: NavId) => {
    setSearchParams({ tab: id });
  }, [setSearchParams]);

  return [active, setActive];
}

// ================================================================
// 5. PRESENTATIONAL COMPONENTS (memoized)
// ================================================================

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

const StatCard = memo(({
  label,
  value,
  icon: Icon,
  sub,
  accent = false,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  sub?: string;
  accent?: boolean;
}) => (
  <div
    className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md ${
      accent ? 'bg-emerald-700 border-emerald-700' : 'bg-white border-gray-200'
    }`}
  >
    <div className="flex items-center justify-between">
      <p className={`text-xs font-medium ${accent ? 'text-emerald-200' : 'text-gray-500'}`}>{label}</p>
      <div className={`p-2 rounded-lg ${accent ? 'bg-emerald-600/30' : 'bg-gray-50'}`}>
        <Icon className={accent ? 'text-emerald-100' : undefined} />
      </div>
    </div>
    <p className={`text-2xl font-bold mt-2 ${accent ? 'text-white' : 'text-gray-900'}`}>{value}</p>
    {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-emerald-200' : 'text-gray-500'}`}>{sub}</p>}
  </div>
));

const EmptyState = memo(({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) => (
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
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onView(project)}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate group-hover:text-emerald-700 transition">
            {project.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {project.freelancerId
              ? `${project.freelancerId.firstName} ${project.freelancerId.lastName}`
              : 'No freelancer assigned'}
            {' · '}Due {formatDate(project.deadline)}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
          <span className="text-xs text-gray-500">
            ${project.spent || 0} / ${project.budget}
          </span>
          <StatusBadge status={project.status} />
          {canDelete && (
            <button
              type="button"
              title="Delete project"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project._id);
              }}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
              aria-label="Delete project"
            >
              <Icons.Trash className="w-3.5 h-3.5" />
            </button>
          )}
          <Icons.ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition" />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="w-full sm:max-w-xs">
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        {project.freelancerId && (
          <button
            type="button"
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

const ApplicantItem = memo(({
  applicant,
  onHire,
  isHiring,
}: {
  applicant: Applicant;
  onHire: (applicant: Applicant) => void;
  isHiring: boolean;
}) => {
  const fullName = `${applicant.freelancerId?.firstName || ''} ${applicant.freelancerId?.lastName || ''}`.trim();
  const skills = applicant.freelancerId?.skills?.slice(0, 4).join(', ') || 'No skills listed';

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
            {applicant.freelancerId?.profileImage ? (
              <img src={applicant.freelancerId.profileImage} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              getInitials(fullName || 'Freelancer')
            )}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-gray-900">{fullName || 'Unnamed freelancer'}</p>
              <StatusBadge status={applicant.status} />
            </div>
            <p className="mt-1 text-sm text-gray-600">
              {applicant.freelancerId?.title || 'Freelancer'}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Applied to <span className="font-medium text-gray-700">{applicant.jobId?.title || 'Untitled job'}</span>
              {' · '}Bid <span className="font-semibold text-emerald-700">${applicant.bid}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onHire(applicant)}
          disabled={isHiring || ['accepted', 'rejected'].includes(applicant.status)}
          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
        >
          {isHiring ? 'Hiring…' : 'Hire Freelancer'}
        </button>
      </div>

      <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-500">Proposal</p>
        <p className="mt-2 text-sm leading-6 text-gray-700">
          {applicant.coverLetter?.trim() || 'No proposal message was provided.'}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
        <span>Skills: {skills}</span>
        <span>{applicant.freelancerId?.rating ? `${applicant.freelancerId.rating.toFixed(1)} ★` : 'New freelancer'}</span>
      </div>
    </div>
  );
});

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
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
            <Icons.Trash className="w-5 h-5 text-red-600" />
          </div>
          <h3 id="confirm-modal-title" className="text-lg font-semibold text-gray-900">
            {title}
          </h3>
        </div>
        <p className="text-sm text-gray-600 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            type="button"
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
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (project) {
      drawerRef.current?.focus();
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [project]);

  if (!project) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="drawer-title"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={drawerRef}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        tabIndex={-1}
      >
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Project Details</p>
            <h3 id="drawer-title" className="text-lg font-semibold text-gray-900">
              {project.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
            aria-label="Close drawer"
          >
            <Icons.X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={project.status} />
            {project.createdAt && (
              <span className="text-xs text-gray-500">Posted {formatDate(project.createdAt)}</span>
            )}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
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
                    type="button"
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
                type="button"
                onClick={() => onDelete(project._id)}
                className="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-700 transition"
              >
                <Icons.Trash className="w-4 h-4" />
                Delete this project
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ================================================================
// 6. MAIN COMPONENT
// ================================================================

export default function ClientDashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeNav, setActiveNav] = useActiveNav();

  // Data
  const { data, loading, refetch } = useDashboard();
  const { handleMessageFreelancer, handleDeleteProject } = useProjectActions(refetch);

  // Chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const [activeContracts, setActiveContracts] = useState<any[]>([]);
  const [pendingOffers, setPendingOffers] = useState<any[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);
  const [applicationsByJob, setApplicationsByJob] = useState<Record<string, Applicant[]>>({});
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [hiringApplicationId, setHiringApplicationId] = useState<string | null>(null);

  // Project detail / delete state
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });
  const [featuredFreelancers, setFeaturedFreelancers] = useState<FreelancerPreview[]>([]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('accessToken') || localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Chat connection
  useChatConnection(data?.user?._id);

  useEffect(() => {
    const loadClientContracts = async () => {
      setContractsLoading(true);
      try {
        const allContracts = await platformService.getMyContracts();
        setActiveContracts(allContracts.filter((c: any) => c.status === 'accepted'));
        setPendingOffers(allContracts.filter((c: any) => c.status === 'pending'));
      } catch (err) {
        console.error('Failed to load client contracts', err);
      } finally {
        setContractsLoading(false);
      }
    };

    loadClientContracts();
  }, []);

  useEffect(() => {
    platformService.getFreelancers()
      .then((data) => setFeaturedFreelancers((data || []).slice(0, 4)))
      .catch(() => setFeaturedFreelancers([]));
  }, []);

  // Handlers
  const handleLogout = useCallback(() => {
    chatService.disconnect();
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const onMessageFreelancer = useCallback(
    async (freelancerId: string, jobId: string) => {
      try {
        const { conversationId, participant } = await handleMessageFreelancer(freelancerId, jobId);
        setSelectedConvId(conversationId);
        setSelectedParticipant(participant);
        setActiveNav('messages');
      } catch {
        // toast already shown in hook
      }
    },
    [handleMessageFreelancer, setActiveNav]
  );

  const onDeleteProject = useCallback(
    (projectId: string) => {
      setDeleteModal({ open: true, id: projectId });
    },
    []
  );

  const confirmDelete = useCallback(async () => {
    if (!deleteModal.id) return;
    try {
      await handleDeleteProject(deleteModal.id);
      setSelectedProject(null);
    } finally {
      setDeleteModal({ open: false, id: null });
    }
  }, [deleteModal.id, handleDeleteProject]);

  const handleHireApplicant = useCallback(async (application: Applicant) => {
    const freelancerId = application.freelancerId?._id;
    const jobId = typeof application.jobId === 'object' ? application.jobId._id : application.jobId;

    if (!freelancerId || !jobId) {
      toast.error('This application is missing the freelancer or job details.');
      return;
    }

    setHiringApplicationId(application._id);
    try {
      await jobService.updateApplicationStatus(application._id, 'accepted');
      const conversation = await jobService.createConversation(freelancerId, jobId);
      setSelectedConvId(conversation._id);
      setSelectedParticipant(conversation);
      setActiveNav('messages');
      toast.success('Freelancer hired and chat room opened.');
    } catch (error: any) {
      console.error('Failed to hire freelancer', error);
      toast.error(error?.response?.data?.message || error?.message || 'Could not hire freelancer.');
    } finally {
      setHiringApplicationId(null);
    }
  }, [setActiveNav]);

  // Derived data
  const user = data?.user;
  const stats = data?.stats || { totalBudget: 0, totalSpent: 0, activeProjects: 0, pendingInvoices: 0 };
  const name = user?.companyName || `${user?.firstName} ${user?.lastName}` || 'Client';
  const projects = data?.projects || [];
  const applicants = data?.applicants || [];
  const invoices = data?.invoices || [];

  useEffect(() => {
    if (activeNav !== 'applicants' || !projects.length) return;

    let isMounted = true;
    const loadApplications = async () => {
      setApplicationsLoading(true);
      try {
        const results = await Promise.all(
          projects.map(async (project) => {
            const applications = await jobService.getJobApplications(project._id);
            return [project._id, Array.isArray(applications) ? applications : []];
          })
        );

        if (isMounted) {
          setApplicationsByJob(Object.fromEntries(results));
        }
      } catch (error) {
        console.error('Failed to load job applications', error);
        if (isMounted) {
          setApplicationsByJob({});
        }
      } finally {
        if (isMounted) {
          setApplicationsLoading(false);
        }
      }
    };

    loadApplications();
    return () => {
      isMounted = false;
    };
  }, [activeNav, projects]);

  // Memoized filtered lists for overview
  const recentApplicants = useMemo(() => applicants.slice(0, 5), [applicants]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="h-4 w-32 bg-gray-200 rounded" />
          <div className="h-2 w-48 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans flex flex-col">
      {/* ===== TOP NAVIGATION BAR ===== */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <Logo />
            </Link>

            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const Icon = Icons[item.icon as keyof typeof Icons];
                const active = activeNav === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveNav(item.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    aria-current={active ? 'page' : undefined}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            <div className="hidden md:flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/search')}
                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:border-emerald-600 hover:text-emerald-700 transition"
              >
                Find freelancers
              </button>
              <button
                type="button"
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
                  type="button"
                  onClick={handleLogout}
                  title="Sign out"
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition"
                  aria-label="Sign out"
                >
                  <Icons.Logout className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => document.getElementById('mobile-menu')?.classList.toggle('hidden')}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 text-gray-600 hover:text-gray-900 transition"
              aria-label="Open menu"
            >
              <Icons.Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ===== MOBILE MENU DRAWER ===== */}
      <div
        id="mobile-menu"
        className="md:hidden fixed inset-0 z-50 hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')} />
        <div className="absolute left-0 top-0 h-full w-64 bg-white border-r border-gray-200 flex flex-col shadow-xl">
          <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => document.getElementById('mobile-menu')?.classList.add('hidden')}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close menu"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1" aria-label="Mobile navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = Icons[item.icon as keyof typeof Icons];
              const active = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveNav(item.id);
                    document.getElementById('mobile-menu')?.classList.add('hidden');
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
              type="button"
              onClick={() => {
                navigate('/search');
                document.getElementById('mobile-menu')?.classList.add('hidden');
              }}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-full hover:border-emerald-600 hover:text-emerald-700 transition"
            >
              Find freelancers
            </button>
            <button
              type="button"
              onClick={() => {
                navigate('/post-job');
                document.getElementById('mobile-menu')?.classList.add('hidden');
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
              type="button"
              onClick={() => {
                handleLogout();
                document.getElementById('mobile-menu')?.classList.add('hidden');
              }}
              className="w-full flex items-center justify-center gap-2 text-sm text-red-600 hover:text-red-700 py-2 px-3 rounded-lg hover:bg-red-50 transition"
            >
              <Icons.Logout className="w-4 h-4" /> Sign out
            </button>
          </div>
        </div>
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <main className="flex-1 pt-20 px-4 sm:px-6 lg:px-8 pb-8 max-w-6xl mx-auto w-full space-y-8">
        <h1 className="text-2xl font-bold text-gray-900 capitalize -mb-2">
          {activeNav}
        </h1>

        {/* ===== OVERVIEW / PROJECTS ===== */}
        {(activeNav === 'overview' || activeNav === 'projects') && (
          <>
            {activeNav === 'overview' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <StatCard
                  label="Total budget"
                  value={`$${(stats.totalBudget || 0).toLocaleString()}`}
                  icon={Icons.Budget}
                />
                <StatCard
                  label="Total spent"
                  value={`$${(stats.totalSpent || 0).toLocaleString()}`}
                  icon={Icons.Spent}
                  accent
                />
                <StatCard
                  label="Active projects"
                  value={String(stats.activeProjects || 0)}
                  icon={Icons.Projects}
                  sub={stats.activeProjects > 0 ? 'In progress' : undefined}
                />
                <StatCard
                  label="Pending invoices"
                  value={String(stats.pendingInvoices || 0)}
                  icon={Icons.Invoices}
                  sub={stats.pendingInvoices > 0 ? 'Awaiting payment' : undefined}
                />
              </div>
            )}

            {/* ===== TALENT LISTINGS (Added here for Overview) ===== */}
            {activeNav === 'overview' && (
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6 overflow-hidden">
                <div className="mb-4">
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Top freelancers
                  </span>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mt-2 mb-1">Work alongside peer talent</h2>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-lg">
                    Handpicked professionals with verified skills and top-rated ecosystem reviews.
                  </p>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4 scrollbar-thin">
                  {featuredFreelancers.length > 0 ? featuredFreelancers.map((fl, i) => (
                    <button
                      key={fl._id}
                      type="button"
                      className="snap-start shrink-0 w-[72vw] xs:w-64 sm:w-auto bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-left hover:border-emerald-600 hover:bg-white hover:shadow-md transition-all"
                      onClick={() => navigate(`/freelancers/${fl._id}`)}
                    >
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xs font-bold text-white mb-3 shadow-sm"
                        style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                      >
                        {getInitials(`${fl.firstName} ${fl.lastName}`)}
                      </div>
                      <div className="font-semibold text-gray-900 text-sm mb-0.5 truncate">
                        {fl.firstName} {fl.lastName}
                      </div>
                      <div className="text-xs text-gray-500 mb-2 truncate">{fl.title || 'Freelancer'}</div>
                      <div className="text-amber-500 text-xs mb-1.5 flex items-center gap-1">
                        <span>{renderStars(fl.rating || 5)}</span>
                        <span className="text-gray-400 font-medium">({fl.reviewCount || 0})</span>
                      </div>
                      <div className="font-bold text-gray-900 text-sm">${fl.hourlyRate || 0}/hr</div>
                      <div className="flex gap-1.5 flex-wrap mt-3">
                        {(fl.skills || []).slice(0, 3).map((skill: string) => (
                          <span key={skill} className="px-2 py-0.5 bg-white border border-gray-100 rounded-lg text-[10px] text-gray-600 font-medium shadow-sm">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </button>
                  )) : (
                    <p className="text-sm text-gray-400 col-span-full py-4">No freelancers available yet.</p>
                  )}
                </div>
              </section>
            )}

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Projects</h2>
                {activeNav === 'overview' && (
                  <button
                    type="button"
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
                      canDelete={canDeleteProject(project, user?._id)}
                      onView={setSelectedProject}
                      onMessage={onMessageFreelancer}
                      onDelete={onDeleteProject}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No projects yet"
                  description="Start by posting your first job to find the perfect freelancer."
                  action={
                    <button
                      type="button"
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

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Active Contracts</h2>
                <span className="text-xs font-semibold text-emerald-700">{activeContracts.length} in progress</span>
              </div>
              {contractsLoading ? (
                <div className="p-6 text-center text-sm text-gray-500">Loading contracts…</div>
              ) : activeContracts.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {activeContracts.map((contract) => (
                    <div key={contract._id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-widest font-semibold text-emerald-700">
                          <span className="inline-flex h-6 items-center rounded-full bg-emerald-50 px-3">In Progress</span>
                        </div>
                        <h3 className="text-base font-bold text-gray-900 mt-3">{contract.contractTitle}</h3>
                        <p className="text-xs text-gray-500 mt-1">
                          Freelancer: {typeof contract.freelancerId === 'object' ? `${contract.freelancerId.firstName || ''} ${contract.freelancerId.lastName || ''}`.trim() : contract.freelancerId}
                        </p>
                        <div className="text-xs font-semibold text-gray-700 mt-3 flex flex-wrap gap-4">
                          <span>Budget: <strong className="text-emerald-600">${contract.totalAmount}</strong></span>
                          <span>Deadline: <strong>{new Date(contract.deadline).toLocaleDateString()}</strong></span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/dashboard/freelancer/contracts/${contract._id}`)}
                        className="self-start text-xs font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition shrink-0"
                      >
                        View contract details
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">No active contracts at the moment.</div>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700">Sent Offers (Pending Approval)</h2>
                <span className="text-xs font-semibold text-amber-700">{pendingOffers.length} waiting</span>
              </div>
              {contractsLoading ? (
                <div className="p-6 text-center text-sm text-gray-500">Loading offers…</div>
              ) : pendingOffers.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {pendingOffers.map((offer) => (
                    <div key={offer._id} className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 opacity-90">
                      <div>
                        <h3 className="text-base font-bold text-gray-900">{offer.contractTitle}</h3>
                        <p className="text-xs text-gray-400 mt-1">Sent on: {new Date(offer.createdAt).toLocaleDateString()}</p>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full animate-pulse">
                        Waiting for Freelancer
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-gray-400">No pending offers right now.</div>
              )}
            </section>
          </>
        )}

        {/* ===== APPLICANTS ===== */}
        {(activeNav === 'overview' || activeNav === 'applicants') && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50/50 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-700">
                {activeNav === 'applicants' ? 'Applications by job post' : 'Recent applicants'}
              </h2>
              {activeNav === 'overview' && (
                <button
                  type="button"
                  onClick={() => setActiveNav('applicants')}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
                >
                  View all →
                </button>
              )}
            </div>

            {activeNav === 'applicants' ? (
              applicationsLoading ? (
                <div className="p-6 text-sm text-gray-500">Loading applications…</div>
              ) : projects.some((project) => (applicationsByJob[project._id] || []).length > 0) ? (
                <div className="divide-y divide-gray-100">
                  {projects.map((project) => {
                    const jobApplications = applicationsByJob[project._id] || [];
                    if (!jobApplications.length) return null;

                    return (
                      <div key={project._id} className="px-6 py-5">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{project.title}</h3>
                            <p className="text-xs text-gray-500">{jobApplications.length} applicant{jobApplications.length > 1 ? 's' : ''}</p>
                          </div>
                          <StatusBadge status={project.status} />
                        </div>
                        <div className="space-y-3">
                          {jobApplications.map((applicant) => (
                            <ApplicantItem
                              key={applicant._id}
                              applicant={applicant}
                              onHire={handleHireApplicant}
                              isHiring={hiringApplicationId === applicant._id}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="No applications yet"
                  description="Applicants for your jobs will appear here as soon as they apply."
                />
              )
            ) : applicants.length > 0 ? (
              <div className="divide-y divide-gray-100 p-2">
                {recentApplicants.map((applicant) => (
                  <ApplicantItem
                    key={applicant._id}
                    applicant={applicant}
                    onHire={handleHireApplicant}
                    isHiring={hiringApplicationId === applicant._id}
                  />
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
                  type="button"
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
            <div className="grid md:grid-cols-3 h-[calc(100vh-14rem)] min-h-[500px]">
              <div className="border-r border-gray-200 overflow-y-auto bg-gray-50/30">
                <ChatConversationList
                  onSelectConversation={(convId, conversation) => {
                    setSelectedConvId(convId);
                    setSelectedParticipant(conversation);
                  }}
                  selectedId={selectedConvId || undefined}
                />
              </div>
              <div className="md:col-span-2 bg-white">
                {selectedConvId && selectedParticipant ? (
                  <ChatRoom
                    conversationId={selectedConvId}
                    currentUserId={user._id}
                    conversation={selectedParticipant}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-3">
                    <span className="text-5xl">💬</span>
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
        canDelete={canDeleteProject(selectedProject as Project, user?._id)}
        onClose={() => setSelectedProject(null)}
        onMessage={onMessageFreelancer}
        onDelete={onDeleteProject}
      />

      {/* ===== DELETE CONFIRM MODAL ===== */}
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