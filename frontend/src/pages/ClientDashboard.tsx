import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dashboardService from "../services/dashboardService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Overview", icon: "⊞", id: "overview" },
  { label: "Projects", icon: "📁", id: "projects" },
  { label: "Applicants", icon: "👥", id: "applicants" },
  { label: "Invoices", icon: "🧾", id: "invoices" },
];

const STATUS_STYLES: Record<string, string> = {
  active: "bg-blue-50 text-blue-700",
  in_progress: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  completed: "bg-emerald-50 text-emerald-700",
  draft: "bg-gray-100 text-gray-500",
  open: "bg-blue-50 text-blue-700",
  pending: "bg-gray-100 text-gray-600",
  shortlisted: "bg-emerald-50 text-emerald-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[status] || "bg-gray-100"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`border rounded-xl p-5 ${accent ? "bg-emerald-700 border-emerald-700" : "bg-white border-gray-200"}`}>
      <p className={`text-xs font-medium mb-1 ${accent ? "text-emerald-200" : "text-gray-500"}`}>{label}</p>
      <p className={`text-2xl font-bold ${accent ? "text-white" : "text-gray-900"}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? "text-emerald-200" : "text-gray-500"}`}>{sub}</p>}
    </div>
  );
}

export default function ClientDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    dashboardService.getClientDashboard().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50"><p className="text-gray-500 text-sm">Loading dashboard…</p></div>;
  }

  const user = data?.user;
  const stats = data?.stats || {};
  const name = user?.companyName || `${user?.firstName} ${user?.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:flex`}>
        <div className="px-5 py-4 border-b border-gray-100">
          <Link to="/" className="font-serif text-lg text-gray-900">freelance<em className="italic text-emerald-700">fluxo</em></Link>
        </div>
        <nav className="flex-1 py-4">
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button key={id} onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium ${activeNav === id ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-700" : "text-gray-600 hover:bg-gray-50"}`}>
              <span>{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center">{getInitials(name)}</div>
            <div><p className="text-sm font-medium text-gray-900 truncate">{name}</p><p className="text-xs text-gray-500">Client</p></div>
          </div>
          <button onClick={handleLogout} className="mt-3 text-xs text-gray-500 hover:text-red-600">Sign out</button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b px-4 sm:px-6 py-3 flex items-center gap-4">
          <button className="lg:hidden p-2" onClick={() => setSidebarOpen(true)}>☰</button>
          <h1 className="text-base font-semibold capitalize">{activeNav}</h1>
          <button onClick={() => navigate("/post-job")} className="ml-auto px-4 py-2 bg-emerald-700 text-white text-sm rounded-full hover:bg-emerald-800">Post a job</button>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-5xl mx-auto w-full">
          {(activeNav === "overview" || activeNav === "projects") && (
            <>
              {activeNav === "overview" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard label="Total budget" value={`$${(stats.totalBudget || 0).toLocaleString()}`} />
                  <StatCard label="Total spent" value={`$${(stats.totalSpent || 0).toLocaleString()}`} accent />
                  <StatCard label="Active projects" value={String(stats.activeProjects || 0)} />
                  <StatCard label="Pending invoices" value={String(stats.pendingInvoices || 0)} />
                </div>
              )}
              <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b"><h2 className="text-sm font-semibold">Projects</h2></div>
                <div className="divide-y">
                  {data?.projects?.length ? data.projects.map((p: any) => (
                    <div key={p._id} className="px-5 py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-500">
                            {p.freelancerId ? `${p.freelancerId.firstName} ${p.freelancerId.lastName}` : "No freelancer assigned"} · Due {formatDate(p.deadline)}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-2 flex justify-between text-xs text-gray-500">
                        <span>${p.spent} / ${p.budget} spent</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                        <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${Math.min(100, (p.spent / p.budget) * 100)}%` }} />
                      </div>
                    </div>
                  )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No projects yet. <button onClick={() => navigate("/post-job")} className="text-emerald-700 underline">Post your first job</button></p>}
                </div>
              </section>
            </>
          )}

          {(activeNav === "overview" || activeNav === "applicants") && (
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b"><h2 className="text-sm font-semibold">Recent applicants</h2></div>
              <div className="divide-y">
                {data?.applicants?.length ? data.applicants.slice(0, 10).map((a: any) => (
                  <div key={a._id} className="px-5 py-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-gray-900">{a.freelancerId?.firstName} {a.freelancerId?.lastName}</p>
                      <p className="text-xs text-gray-500">{a.jobId?.title} · Bid ${a.bid}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No applicants yet.</p>}
              </div>
            </section>
          )}

          {(activeNav === "overview" || activeNav === "invoices") && (
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b"><h2 className="text-sm font-semibold">Invoices</h2></div>
              <div className="divide-y">
                {data?.invoices?.length ? data.invoices.map((inv: any) => (
                  <div key={inv._id} className="px-5 py-4 flex justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{inv.project}</p>
                      <p className="text-xs text-gray-500">{formatDate(inv.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${inv.amount}</p>
                      <span className={`text-xs ${inv.paid ? "text-emerald-600" : "text-amber-600"}`}>{inv.paid ? "Paid" : "Pending"}</span>
                    </div>
                  </div>
                )) : <p className="px-5 py-8 text-sm text-gray-500 text-center">No invoices yet.</p>}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
