import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dashboardService from "../services/dashboardService";
import authService from "../services/authService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Overview", icon: "⊞", id: "overview" },
  { label: "Users", icon: "👥", id: "users" },
  { label: "Jobs", icon: "📋", id: "jobs" },
  { label: "Reports", icon: "🚩", id: "reports" },
];

const USER_STATUS_STYLES: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
};

function StatCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-xl p-5 ${highlight ? "bg-gray-900 border-gray-900 text-white" : "bg-white border-gray-200"}`}>
      <p className={`text-xs font-medium mb-1 ${highlight ? "text-gray-400" : "text-gray-500"}`}>{label}</p>
      <p className={`text-2xl font-bold ${highlight ? "text-white" : "text-gray-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${highlight ? "text-gray-400" : "text-emerald-600"}`}>{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const loadData = () => {
    setLoading(true);
    dashboardService.getAdminDashboard().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    await authService.updateUserApproval(userId, status);
    loadData();
  };

  if (loading && !data) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 text-sm">Loading admin panel…</p></div>;
  }

  const stats = data?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r flex flex-col transform transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex`}>
        <div className="px-5 py-4 border-b">
          <Link to="/" className="font-serif text-lg text-gray-900">freelance<em className="italic text-emerald-700">fluxo</em></Link>
          <p className="text-xs text-gray-400 mt-1">Admin panel</p>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button key={id} onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium ${activeNav === id ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t">
          <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-600">Sign out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b px-4 sm:px-6 py-3 flex items-center gap-4">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className="text-base font-semibold capitalize">{activeNav}</h1>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
          {(activeNav === "overview") && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total users" value={String(stats.totalUsers || 0)} highlight />
              <StatCard label="Total jobs" value={String(stats.totalJobs || 0)} />
              <StatCard label="Open reports" value={String(stats.openReports || 0)} />
              <StatCard label="Flagged jobs" value={String(stats.flaggedJobs || 0)} />
            </div>
          )}

          {(activeNav === "overview" || activeNav === "users") && (
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b flex justify-between items-center">
                <h2 className="text-sm font-semibold">Users</h2>
                {activeNav === "overview" && <button onClick={() => setActiveNav("users")} className="text-xs text-emerald-700">View all</button>}
              </div>
              <div className="divide-y">
                {data?.recentUsers?.length ? data.recentUsers.map((u: any) => (
                  <div key={u._id} className="px-5 py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-gray-800 text-white text-xs font-bold flex items-center justify-center shrink-0">
                        {getInitials(`${u.firstName} ${u.lastName}`)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email} · {u.userRole?.join(", ")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${USER_STATUS_STYLES[u.approvalStatus] || ""}`}>{u.approvalStatus}</span>
                      {u.approvalStatus === "pending" && (
                        <>
                          <button onClick={() => handleApproval(u._id, "approved")} className="text-xs text-emerald-700 font-medium hover:underline">Approve</button>
                          <button onClick={() => handleApproval(u._id, "rejected")} className="text-xs text-red-600 font-medium hover:underline">Reject</button>
                        </>
                      )}
                    </div>
                  </div>
                )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No users found.</p>}
              </div>
            </section>
          )}

          {(activeNav === "overview" || activeNav === "jobs") && (
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b"><h2 className="text-sm font-semibold">Recent jobs</h2></div>
              <div className="divide-y">
                {data?.recentJobs?.length ? data.recentJobs.map((j: any) => (
                  <div key={j._id} className="px-5 py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{j.title}</p>
                      <p className="text-xs text-gray-500">
                        {j.clientId?.companyName || j.clientId?.firstName} · ${j.budget}
                      </p>
                    </div>
                    <span className="text-xs capitalize bg-gray-100 px-2 py-1 rounded-full">{j.status}</span>
                  </div>
                )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No jobs yet.</p>}
              </div>
            </section>
          )}

          {(activeNav === "overview" || activeNav === "reports") && (
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b"><h2 className="text-sm font-semibold">Reports</h2></div>
              <div className="divide-y">
                {data?.reports?.length ? data.reports.map((r: any) => (
                  <div key={r._id} className="px-5 py-4">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium capitalize bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">{r.type}</span>
                      <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">{r.description}</p>
                    <span className={`text-xs ${r.resolved ? "text-emerald-600" : "text-amber-600"}`}>{r.resolved ? "Resolved" : "Open"}</span>
                  </div>
                )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No reports.</p>}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
