// ============================================================
// ClientDashboard.tsx – Fully Refactored & Polished
// ============================================================

import { useEffect, useLayoutEffect, useRef, useState, useCallback, memo } from 'react';
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
// 2. CONSTANTS
// ============================================================

const NAV_ITEMS = [
  { label: 'Overview', icon: '⊞', id: 'overview' },
  { label: 'Projects', icon: '📁', id: 'projects' },
  { label: 'Applicants', icon: '👥', id: 'applicants' },
  { label: 'Invoices', icon: '🧾', id: 'invoices' },
  { label: 'Messages', icon: '💬', id: 'messages' },
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
// 3. UTILITY FUNCTIONS
// ============================================================

function getStatusStyle(status: string): string {
  return STATUS_STYLES[status] || 'bg-gray-100 text-gray-600';
}

// ============================================================
// 4. PRESENTATIONAL COMPONENTS (memoized)
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

// ── Icons ──
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
const ProjectCard = memo(({ project, onMessage }: { project: Project; onMessage: (freelancerId: string, jobId: string) => void }) => {
  const progress = project.budget > 0 ? Math.min(100, ((project.spent || 0) / project.budget) * 100) : 0;

  return (
    <div className="px-6 py-5 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{project.title}</h3>
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
            onClick={() => onMessage(project.freelancerId!._id, project._id)}
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
// 5. MAIN COMPONENT
// ============================================================

export default function ClientDashboard() {
  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  // Chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  // Sidebar: sliding active-row indicator
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [navIndicator, setNavIndicator] = useState<{ top: number; height: number; ready: boolean }>({
    top: 0,
    height: 0,
    ready: false,
  });

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

  // Measure the active sidebar row so the indicator can glide to it
  useLayoutEffect(() => {
    const el = navRefs.current[activeNav];
    if (el) {
      setNavIndicator({ top: el.offsetTop, height: el.offsetHeight, ready: true });
    }
  }, [activeNav, loading, sidebarOpen]);

  useEffect(() => {
    const handleResize = () => {
      const el = navRefs.current[activeNav];
      if (el) setNavIndicator({ top: el.offsetTop, height: el.offsetHeight, ready: true });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeNav]);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans flex">
      {/* ===== SIDEBAR ===== */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col transform transition-all duration-300 shadow-xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:relative lg:translate-x-0 lg:shadow-none`}
      >
        <div className="px-6 py-5 border-b border-gray-100">
          <Link to="/" className="block">
            <Logo />
          </Link>
        </div>
        <nav className="relative flex-1 py-6 space-y-1">
          {/* Sliding active-row indicator */}
          <span
            aria-hidden="true"
            className={`absolute left-0 w-full bg-emerald-50 border-r-4 border-emerald-600 transition-all duration-300 ease-out ${
              navIndicator.ready ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ top: navIndicator.top, height: navIndicator.height }}
          />
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button
              key={id}
              ref={(el) => { navRefs.current[id] = el; }}
              onClick={() => {
                setActiveNav(id);
                setSidebarOpen(false);
              }}
              className={`relative z-10 w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors duration-200 ${
                activeNav === id
                  ? 'text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-emerald-600'
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-sm font-bold flex items-center justify-center shadow-sm">
              {getInitials(name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-500">Client</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="mt-4 w-full text-center text-xs text-gray-500 hover:text-red-600 transition"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* ===== MOBILE OVERLAY ===== */}
      <div
        className={`fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      {/* ===== MAIN CONTENT ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* HEADER */}
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-4 shadow-sm">
          <button
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-emerald-600"
            onClick={() => setSidebarOpen(true)}
            aria-label="Toggle sidebar"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-semibold capitalize text-gray-800">{activeNav}</h1>
          <button
            onClick={() => navigate('/post-job')}
            className="ml-auto px-5 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700 transition shadow-sm hover:shadow"
          >
            + Post a job
          </button>
        </header>

        {/* MAIN */}
        <main className="flex-1 px-4 sm:px-6 py-8 space-y-8 max-w-6xl mx-auto w-full">
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
                        onMessage={handleMessageFreelancer}
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
      </div>
    </div>
  );
}