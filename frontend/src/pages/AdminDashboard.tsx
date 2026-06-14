// AdminDashboard.tsx - Professional Admin Panel (Fully Typed)
import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dashboardService, { 
  type DashboardStats, 
  type User, 
  type Job, 
  type Report 
} from "../services/dashboardService";
import authService from "../services/authService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";
import type { RootState } from "../redux/store";

// ======================== Constants ========================
const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];
const avatarColor = (id: string) => AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];

const ADMIN_NAV_ITEMS = [
  { label: "Overview", id: "overview", icon: "📊" },
  { label: "Users", id: "users", icon: "👥" },
  { label: "Jobs", id: "jobs", icon: "💼" },
  { label: "Reports", id: "reports", icon: "⚠️" },
];

const USER_STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-600 border-red-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

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

// ======================== Toast Context ========================
type ToastType = "success" | "error" | "info";
let toastFn: ((message: string, type?: ToastType) => void) | null = null;

export const setToastGlobal = (fn: typeof toastFn) => { toastFn = fn; };
const toast = (message: string, type: ToastType = "info") => toastFn?.(message, type);

// ======================== Subcomponents ========================
const Logo = () => (
  <span className="text-xl font-bold tracking-tight">
    <span className="text-green-600">freelance</span>
    <span className="text-gray-900">fluxo</span>
  </span>
);

const StatCard = ({ label, value, sub, highlight }: any) => (
  <div className={`border rounded-xl p-5 transition-all hover:shadow-md ${highlight ? "bg-[#001e00] border-[#001e00] text-white" : "bg-white border-gray-200"}`}>
    <p className={`text-xs font-medium mb-1 ${highlight ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
    <p className={`text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{value}</p>
    {sub && <p className={`text-xs mt-0.5 ${highlight ? "text-gray-400" : "text-green-600"}`}>{sub}</p>}
  </div>
);

const SkeletonRow = () => (
  <tr className="animate-pulse">
    <td colSpan={5} className="px-5 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gray-200" />
          <div>
            <div className="h-4 w-32 bg-gray-200 rounded mb-1" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-gray-200 rounded-full" />
      </div>
    </td>
  </tr>
);

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded-lg hover:bg-gray-50">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Confirm</button>
        </div>
      </div>
    </div>
  );
};

// Custom hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debounced;
};

// Main Component
export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalState, setModalState] = useState<{ 
    open: boolean; 
    action: string | null; 
    id: string | null; 
    type: string;
  }>({ open: false, action: null, id: null, type: "" });
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [selectedJob, setSelectedJob] = useState<JobDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.roles?.some(r => String(r).toUpperCase() === "SUPER_ADMIN") ?? false;

  const debouncedSearch = useDebounce(searchTerm, 400);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await dashboardService.getAdminDashboard();
      setData(result);
    } catch (err) {
      toast("Failed to load dashboard data", "error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const filteredUsers = useMemo(() => {
    if (!data?.recentUsers) return [];
    if (!debouncedSearch) return data.recentUsers;
    return data.recentUsers.filter(u => 
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [data?.recentUsers, debouncedSearch]);

  const handleLogout = () => { dispatch(logout()); navigate("/login"); };
  
  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    try {
      await authService.updateUserApproval(userId, status);
      toast(`User ${status} successfully`, "success");
      loadData();
    } catch (error) { toast("Approval action failed", "error"); }
  };

  const handleRoleChange = async (
    userId: string,
    role: "SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER",
    action: "add" | "remove" = "add"
  ) => {
    if (action === "add" && role === "SUPER_ADMIN" && !isSuperAdmin) {
      return toast("Only super admin can assign super admin", "error");
    }
    try {
      await authService.updateUserRole(userId, role, action);
      toast(`Role ${action === "add" ? "added" : "removed"} ${role}`, "success");
      loadData();
    } catch (error) { toast("Role update failed", "error"); }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await authService.deleteUser?.(userId); 
      toast("User deleted permanently", "success");
      loadData();
    } catch (error) { toast("Delete failed", "error"); }
    setModalState({ open: false, action: null, id: null, type: "" });
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await dashboardService.deleteJob?.(jobId);
      toast("Job deleted", "success");
      loadData();
    } catch (error) { toast("Delete failed", "error"); }
    setModalState({ open: false, action: null, id: null, type: "" });
  };

  const handleViewUser = async (userId: string) => {
    setDetailLoading(true);
    try {
      const user = await authService.getUserById(userId);
      setSelectedUser(user);
    } catch (error) {
      toast("Could not load user details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewJob = async (jobId: string) => {
    setDetailLoading(true);
    try {
      const job = await dashboardService.getJobById(jobId);
      setSelectedJob(job);
    } catch (error) {
      toast("Could not load job details", "error");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setSelectedJob(null);
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      await dashboardService.resolveReport?.(reportId);
      toast("Report marked as resolved", "success");
      loadData();
    } catch (error) { toast("Failed to resolve report", "error"); }
  };

  const showConfirm = (type: string, id: string) => {
    setModalState({ open: true, action: "delete", id, type });
  };

  if (loading && !data) return <LoadingSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <ToastProvider />
      <ConfirmationModal
        isOpen={modalState.open}
        onClose={() => setModalState({ open: false, action: null, id: null, type: "" })}
        onConfirm={() => {
          if (modalState.type === "user") handleDeleteUser(modalState.id!);
          else if (modalState.type === "job") handleDeleteJob(modalState.id!);
        }}
        title="Confirm Deletion"
        message={`Are you sure you want to delete this ${modalState.type}? This action is irreversible.`}
      />
      
      <nav className="sticky top-0 z-50 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <Link to="/"><Logo /></Link>
          <div className="hidden sm:flex gap-1 mx-4">
            {ADMIN_NAV_ITEMS.map(item => (
              <button key={item.id} onClick={() => { setActiveNav(item.id); setCurrentPage(1); setSearchTerm(""); }}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-1.5 ${activeNav === item.id ? "bg-green-50 text-green-700 shadow-sm" : "text-gray-600 hover:bg-gray-100"}`}>
                <span>{item.icon}</span> {item.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden md:inline">{currentUser?.email}</span>
            <button onClick={handleLogout} className="px-4 py-1.5 border-2 border-gray-300 rounded-full text-sm font-medium hover:border-red-500 hover:text-red-500 transition">Sign out</button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {activeNav === "overview" && <OverviewTab data={data} />}
        {activeNav === "users" && (
          <UsersTab 
            users={filteredUsers} 
            loading={loading} 
            search={searchTerm} 
            setSearch={setSearchTerm} 
            onApproval={handleApproval} 
            onRoleChange={handleRoleChange} 
            onDelete={(id: string) => showConfirm("user", id)} 
            onViewUser={handleViewUser}
            isSuperAdmin={isSuperAdmin} 
          />
        )}
        {activeNav === "jobs" && (
          <JobsTab 
            jobs={data?.recentJobs || []} 
            loading={loading} 
            onDelete={(id: string) => showConfirm("job", id)} 
            onViewJob={handleViewJob}
          />
        )}
        {activeNav === "reports" && (
          <ReportsTab 
            reports={data?.reports || []} 
            loading={loading} 
            onResolve={handleResolveReport} 
          />
        )}
      </main>
      <DetailDrawer user={selectedUser} job={selectedJob} loading={detailLoading} onClose={closeDetails} />
    </div>
  );
}

// Sub-tab components with proper typing
const OverviewTab = ({ data }: { data: DashboardStats | null }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      <StatCard label="Total Users" value={data?.totalUsers || 0} highlight />
      <StatCard label="Total Jobs" value={data?.totalJobs || 0} sub="+12% from last month" />
      <StatCard label="Open Reports" value={data?.openReports || 0} sub={data?.openReports ? "Requires attention" : "All clear"} />
      <StatCard label="Flagged Jobs" value={data?.flaggedJobs || 0} />
    </div>
    <div className="grid lg:grid-cols-2 gap-6">
      <RecentSection title="Recent Users" data={data?.recentUsers?.slice(0, 5)} type="user" />
      <RecentSection title="Recent Jobs" data={data?.recentJobs?.slice(0, 5)} type="job" />
    </div>
  </div>
);

const RecentSection = ({ title, data, type }: { title: string; data?: any[]; type: "user" | "job" }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="px-5 py-3 border-b bg-gray-50/50"><h3 className="font-semibold text-gray-800">{title}</h3></div>
    <div className="divide-y">
      {data?.length ? data.map((item: any) => (
        <div key={item._id} className="px-5 py-3 flex justify-between items-center">
          <div>
            <p className="font-medium">{type === "user" ? `${item.firstName} ${item.lastName}` : item.title}</p>
            <p className="text-xs text-gray-500">{type === "user" ? item.email : `$${item.budget}`}</p>
          </div>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
            {type === "user" ? item.approvalStatus : item.status}
          </span>
        </div>
      )) : <p className="px-5 py-8 text-center text-gray-400">No recent {type}s</p>}
    </div>
  </div>
);

const UsersTab = ({ 
  users, loading, search, setSearch, onApproval, onRoleChange, onDelete, onViewUser, isSuperAdmin 
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
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="p-4 border-b flex flex-col sm:flex-row justify-between gap-3">
      <h2 className="font-semibold text-lg">User Management</h2>
      <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-64 focus:ring-2 focus:ring-green-500" />
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {["User", "Email", "Role", "Status", "Actions"].map(h => <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {loading ? Array(3).fill(0).map((_,i) => <SkeletonRow key={i} />) : users.map((u) => (
            <tr key={u._id} className="hover:bg-gray-50">
              <td className="px-5 py-3 whitespace-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: avatarColor(u._id) }}>
                    {getInitials(`${u.firstName} ${u.lastName}`)}
                  </div>
                  <button type="button" onClick={() => onViewUser(u._id)} className="text-left text-sm text-gray-700 hover:text-green-700 transition">
                    {u.firstName} {u.lastName}
                  </button>
                </div>
              </td>
              <td className="px-5 py-3 text-sm text-gray-600">{u.email}</td>
              <td className="px-5 py-3 text-sm capitalize">{u.userRole.join(", ")}</td>
              <td className="px-5 py-3">
                <span className={`px-2 py-1 text-xs rounded-full border ${USER_STATUS_STYLES[u.approvalStatus]}`}>
                  {u.approvalStatus}
                </span>
              </td>
              <td className="px-5 py-3 flex flex-wrap gap-2">
                {u.approvalStatus !== "approved" && 
                  <button onClick={() => onApproval(u._id, "approved")} className="text-green-600 text-xs hover:underline">Approve</button>
                }
                {u.approvalStatus !== "rejected" && 
                  <button onClick={() => onApproval(u._id, "rejected")} className="text-red-500 text-xs hover:underline">Reject</button>
                }
                {isSuperAdmin && ["CLIENT", "FREELANCER", "ADMIN", "SUPER_ADMIN"]
                  .filter((role) => !u.userRole.includes(role))
                  .map((role) => (
                    <button key={`add-${role}`} onClick={() => onRoleChange(u._id, role as any, "add")} className="text-blue-600 text-xs hover:underline">
                      Add {role}
                    </button>
                  ))
                }
                {isSuperAdmin && u.userRole.length > 1 && u.userRole.map((role) => (
                  <button key={`remove-${role}`} onClick={() => onRoleChange(u._id, role as any, "remove")} className="text-red-600 text-xs hover:underline">
                    Remove {role}
                  </button>
                ))}
                <button onClick={() => onDelete(u._id)} className="text-red-700 text-xs hover:underline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const JobsTab = ({ jobs, loading, onDelete, onViewJob }: { jobs: Job[]; loading: boolean; onDelete: (id: string) => void; onViewJob: (id: string) => void }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="p-4 border-b"><h2 className="font-semibold text-lg">Job Listings</h2></div>
    <div className="divide-y">
      {jobs.map((j) => (
        <div key={j._id} className="px-5 py-4 flex justify-between items-center hover:bg-gray-50 cursor-pointer" onClick={() => onViewJob(j._id)}>
          <div>
            <button type="button" onClick={() => onViewJob(j._id)} className="text-left">
              <p className="font-medium text-gray-900 hover:text-green-700 transition">{j.title}</p>
              <p className="text-xs text-gray-500">
                Client: {j.clientId?.firstName || j.clientId?.companyName || "Anonymous"} · Budget: ${j.budget}
              </p>
            </button>
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-xs capitalize bg-gray-100 px-2 py-1 rounded-full">{j.status}</span>
            <button onClick={(e) => { e.stopPropagation(); onDelete(j._id); }} className="text-red-500 text-xs hover:underline">Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ReportsTab = ({ reports, loading, onResolve }: { reports: Report[]; loading: boolean; onResolve: (id: string) => void }) => (
  <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
    <div className="p-4 border-b"><h2 className="font-semibold text-lg">Reported Issues</h2></div>
    <div className="divide-y">
      {reports.map((r) => (
        <div key={r._id} className="px-5 py-4">
          <div className="flex justify-between">
            <span className="text-xs font-medium bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{r.type}</span>
            <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-700 mt-2">{r.description}</p>
          <div className="mt-2 flex gap-2">
            {!r.resolved && <button onClick={() => onResolve(r._id)} className="text-green-600 text-xs hover:underline">Mark Resolved</button>}
            <span className={`text-xs ${r.resolved ? "text-green-600" : "text-amber-600"}`}>
              {r.resolved ? "✓ Resolved" : "Open"}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const DetailDrawer = ({
  user,
  job,
  loading,
  onClose,
}: {
  user: UserDetail | null;
  job: JobDetail | null;
  loading: boolean;
  onClose: () => void;
}) => {
  if (!user && !job) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl overflow-y-auto max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-gray-200">
        <div className="flex items-start justify-between p-6 border-b">
          <div>
            <h3 className="text-2xl font-semibold text-gray-900">
              {user ? "User Details" : "Job Details"}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {user ? `${user.firstName} ${user.lastName}` : job?.title}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900 rounded-full p-2">
            Close
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="text-center text-gray-500 py-10">Loading details...</div>
          ) : user ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Email" value={user.email} />
                <DetailItem label="Roles" value={user.userRole.join(", ")} />
                <DetailItem label="Status" value={user.approvalStatus} />
                <DetailItem label="Joined" value={user.createdAt || "—"} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Title" value={user.title || "—"} />
                <DetailItem label="Company" value={user.companyName || "—"} />
              </div>
              {user.bio && <DetailSection title="Bio"><p className="text-gray-700">{user.bio}</p></DetailSection>}
              {user.skills?.length ? <DetailSection title="Skills"><p className="text-gray-700">{user.skills.join(", ")}</p></DetailSection> : null}
            </div>
          ) : job ? (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailItem label="Status" value={job.status} />
                <DetailItem label="Budget" value={`$${job.budget}`} />
                <DetailItem label="Deadline" value={job.deadline || "—"} />
                <DetailItem label="Created" value={job.createdAt || "—"} />
              </div>
              <DetailSection title="Client">
                <p className="text-gray-700">{job.clientId?.firstName ? `${job.clientId.firstName} ${job.clientId.lastName || ""}`.trim() : job.clientId?.companyName || "Unknown"}</p>
                <p className="text-sm text-gray-500">{job.clientId?.email || "No email"}</p>
              </DetailSection>
              {job.freelancerId && (
                <DetailSection title="Freelancer">
                  <p className="text-gray-700">{job.freelancerId.firstName ? `${job.freelancerId.firstName} ${job.freelancerId.lastName || ""}`.trim() : job.freelancerId.title || "Freelancer"}</p>
                  <p className="text-sm text-gray-500">{job.freelancerId.email || "No email"}</p>
                </DetailSection>
              )}
              {job.description && <DetailSection title="Description"><p className="text-gray-700 whitespace-pre-line">{job.description}</p></DetailSection>}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50">
    <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-2 font-medium text-gray-900">{value || "—"}</p>
  </div>
);

const DetailSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <p className="text-sm font-semibold text-gray-900 mb-2">{title}</p>
    <div className="rounded-2xl border border-gray-100 bg-white p-4">{children}</div>
  </div>
);

const LoadingSkeleton = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
  </div>
);

const ToastProvider = () => {
  const [toasts, setToasts] = useState<{id:number, message:string, type:ToastType}[]>([]);
  useEffect(() => { 
    setToastGlobal((msg, type) => { 
      const id = Date.now(); 
      setToasts(prev => [...prev, { id, message: msg, type: type || "info" }]); 
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000); 
    }); 
  }, []);
  if (toasts.length === 0) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 space-y-2">
      {toasts.map(t => (
        <div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-white text-sm ${t.type === "success" ? "bg-green-600" : t.type === "error" ? "bg-red-600" : "bg-blue-600"}`}>
          {t.message}
        </div>
      ))}
    </div>
  );
};