import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dashboardService from "../services/dashboardService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Overview", icon: "⊞", id: "overview" },
  { label: "My Jobs", icon: "📋", id: "jobs" },
  { label: "Proposals", icon: "📨", id: "proposals" },
  { label: "Earnings", icon: "💳", id: "earnings" },
  { label: "Profile", icon: "👤", id: "profile" },
];

const STATUS_STYLES: Record<string, string> = {
  in_progress: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  pending: "bg-gray-100 text-gray-600",
  shortlisted: "bg-emerald-50 text-emerald-700",
  rejected: "bg-red-50 text-red-600",
  open: "bg-blue-50 text-blue-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || "bg-gray-100 text-gray-600"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-emerald-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function FreelancerDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dashboardService
      .getFreelancerDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading dashboard…</p>
      </div>
    );
  }

  const user = data?.user;
  const stats = data?.stats || {};
  const name = user ? `${user.firstName} ${user.lastName}` : "Freelancer";
  const earnings = data?.earnings || [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex`}>
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <Link to="/" className="font-serif text-lg font-light tracking-tight text-gray-900">
            freelance<em className="italic text-emerald-700">fluxo</em>
          </Link>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button
              key={id}
              onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${activeNav === id ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-700" : "text-gray-600 hover:bg-gray-50"}`}
            >
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">
              {getInitials(name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.title || "Freelancer"}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-3 w-full text-xs text-gray-500 hover:text-red-600 text-left">Sign out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <button className="lg:hidden p-2 rounded-md hover:bg-gray-100" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900 capitalize">{activeNav}</h1>
          <button onClick={() => navigate("/search")} className="ml-auto px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-full hover:bg-emerald-800">Find work</button>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-5xl w-full mx-auto">
          {(activeNav === "overview" || activeNav === "jobs") && (
            <>
              {activeNav === "overview" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total earnings" value={`$${(stats.totalEarnings || 0).toLocaleString()}`} />
                  <StatCard label="Active jobs" value={String(stats.activeJobs || 0)} />
                  <StatCard label="Open proposals" value={String(stats.openProposals || 0)} />
                  <StatCard label="Profile views" value={String(stats.profileViews || 0)} sub="From reviews" />
                </div>
              )}
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="text-sm font-semibold text-gray-900">Active jobs</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {data?.activeJobs?.length ? data.activeJobs.map((job: any) => (
                    <div key={job._id} className="flex items-center justify-between px-5 py-3.5">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">
                          {job.clientId?.companyName || job.clientId?.firstName} · Due {formatDate(job.deadline)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold">${job.budget}</span>
                        <StatusBadge status={job.status} />
                      </div>
                    </div>
                  )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No active jobs yet. Browse open jobs to apply.</p>}
                </div>
              </section>
            </>
          )}

          {(activeNav === "overview" || activeNav === "proposals") && (
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Recent proposals</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {data?.proposals?.length ? data.proposals.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.jobId?.title || "Job"}</p>
                      <p className="text-xs text-gray-500">Bid ${p.bid}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No proposals yet.</p>}
              </div>
            </section>
          )}

          {activeNav === "proposals" && null}

          {(activeNav === "overview" || activeNav === "earnings") && (
            <section className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">Earnings</h2>
              <p className="text-2xl font-bold text-gray-900">${(stats.totalEarnings || 0).toLocaleString()}</p>
              {earnings.length > 0 ? (
                <div className="flex items-end gap-2 h-32 mt-4">
                  {earnings.map(({ month, amount }: any) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-gray-500">${amount}</span>
                      <div className="w-full bg-emerald-600 rounded-t-md" style={{ height: `${Math.max(20, (amount / (stats.totalEarnings || 1)) * 100)}%`, minHeight: "4px" }} />
                      <span className="text-[10px] text-gray-400">{month}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-gray-500 mt-4">No earnings recorded yet.</p>}
            </section>
          )}

          {activeNav === "profile" && user && (
            <section className="bg-white border border-gray-200 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Your profile</h2>
              <p className="text-sm text-gray-600"><strong>Name:</strong> {name}</p>
              <p className="text-sm text-gray-600 mt-2"><strong>Email:</strong> {user.email}</p>
              <p className="text-sm text-gray-600 mt-2"><strong>Title:</strong> {user.title || "Not set"}</p>
              <p className="text-sm text-gray-600 mt-2"><strong>Rate:</strong> ${user.hourlyRate || 0}/hr</p>
              {user.skills?.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {user.skills.map((s: string) => (
                    <span key={s} className="px-2 py-1 bg-gray-100 rounded-full text-xs">{s}</span>
                  ))}
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
