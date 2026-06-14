import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface User {
  id: number;
  name: string;
  email: string;
  role: "client" | "freelancer";
  joined: string;
  status: "active" | "suspended" | "pending";
  initials: string;
  avatarBg: string;
}

interface Job {
  id: number;
  title: string;
  client: string;
  budget: number;
  postedAt: string;
  status: "open" | "in_progress" | "completed" | "flagged";
}

interface Report {
  id: number;
  type: "spam" | "misconduct" | "payment";
  description: string;
  reportedAt: string;
  resolved: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const RECENT_USERS: User[] = [
  { id: 1, name: "Ashan Kumara",       email: "ashan@email.com",    role: "freelancer", joined: "Jul 1",  status: "active",    initials: "AK", avatarBg: "#14a800" },
  { id: 2, name: "TechVision Ltd",     email: "tech@vision.com",    role: "client",     joined: "Jul 2",  status: "active",    initials: "TV", avatarBg: "#0891b2" },
  { id: 3, name: "Kasun Bandara",      email: "kasun@email.com",    role: "freelancer", joined: "Jul 3",  status: "pending",   initials: "KB", avatarBg: "#7c3aed" },
  { id: 4, name: "Nimali Dias",        email: "nimali@biz.com",     role: "client",     joined: "Jul 4",  status: "suspended", initials: "ND", avatarBg: "#dc2626" },
  { id: 5, name: "Ruwani Jayaweera",   email: "ruwani@mail.com",    role: "freelancer", joined: "Jul 5",  status: "active",    initials: "RJ", avatarBg: "#d97706" },
];

const RECENT_JOBS: Job[] = [
  { id: 1, title: "E-commerce React Frontend",   client: "TechVision Ltd",  budget: 1200, postedAt: "Jul 1",  status: "in_progress" },
  { id: 2, title: "Content Writing Pack",         client: "MediaCo",         budget: 300,  postedAt: "Jul 2",  status: "open"        },
  { id: 3, title: "Mobile App Redesign",          client: "StartupHub",      budget: 2200, postedAt: "Jul 3",  status: "flagged"     },
  { id: 4, title: "SEO Audit & Strategy",         client: "GrowthAgency",    budget: 550,  postedAt: "Jul 4",  status: "completed"   },
];

const REPORTS: Report[] = [
  { id: 1, type: "spam",       description: "Suspicious job posting with unrealistic pay",   reportedAt: "Jul 3", resolved: false },
  { id: 2, type: "payment",    description: "Client did not release milestone payment",       reportedAt: "Jul 4", resolved: false },
  { id: 3, type: "misconduct", description: "Freelancer submitted plagiarised work",          reportedAt: "Jul 5", resolved: true  },
];

const MONTHLY_STATS = [
  { month: "Feb", users: 120, jobs: 84  },
  { month: "Mar", users: 145, jobs: 102 },
  { month: "Apr", users: 190, jobs: 130 },
  { month: "May", users: 230, jobs: 165 },
  { month: "Jun", users: 280, jobs: 198 },
  { month: "Jul", users: 142, jobs: 96  },
];

const NAV_ITEMS = [
  { label: "Overview",  icon: "⊞", id: "overview" },
  { label: "Users",     icon: "👥", id: "users"    },
  { label: "Jobs",      icon: "📋", id: "jobs"     },
  { label: "Reports",   icon: "🚩", id: "reports"  },
  { label: "Payments",  icon: "💳", id: "payments" },
  { label: "Settings",  icon: "⚙️", id: "settings" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const USER_STATUS_STYLES: Record<string, string> = {
  active:    "bg-emerald-50 text-emerald-700",
  suspended: "bg-red-50 text-red-600",
  pending:   "bg-amber-50 text-amber-700",
};

const JOB_STATUS_STYLES: Record<string, string> = {
  open:        "bg-blue-50 text-blue-700",
  in_progress: "bg-indigo-50 text-indigo-700",
  completed:   "bg-emerald-50 text-emerald-700",
  flagged:     "bg-red-50 text-red-600",
};

const JOB_STATUS_LABELS: Record<string, string> = {
  open:        "Open",
  in_progress: "In Progress",
  completed:   "Completed",
  flagged:     "Flagged",
};

const REPORT_TYPE_STYLES: Record<string, string> = {
  spam:       "bg-orange-50 text-orange-700",
  misconduct: "bg-red-50 text-red-700",
  payment:    "bg-amber-50 text-amber-700",
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

function GrowthChart() {
  const maxUsers = Math.max(...MONTHLY_STATS.map((s) => s.users));
  return (
    <div className="flex items-end gap-2 h-28 mt-4">
      {MONTHLY_STATS.map(({ month, users, jobs }) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <div className="w-full flex gap-0.5 items-end" style={{ height: "80px" }}>
            <div
              className="flex-1 bg-emerald-600 rounded-t-sm"
              style={{ height: `${(users / maxUsers) * 100}%` }}
              title={`Users: ${users}`}
            />
            <div
              className="flex-1 bg-emerald-200 rounded-t-sm"
              style={{ height: `${(jobs / maxUsers) * 100}%` }}
              title={`Jobs: ${jobs}`}
            />
          </div>
          <span className="text-[10px] text-gray-400">{month}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const totalUsers     = 1842;
  const totalJobs      = 634;
  const openReports    = REPORTS.filter((r) => !r.resolved).length;
  const flaggedJobs    = RECENT_JOBS.filter((j) => j.status === "flagged").length;

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-gray-900 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        <div className="px-5 py-4 border-b border-gray-700 shrink-0">
          <Link to="/" className="font-serif text-lg font-light tracking-tight text-white">
            freelance<em className="italic text-emerald-400">fluxo</em>
          </Link>
          <span className="block text-[10px] font-semibold text-gray-500 uppercase tracking-widest mt-0.5">
            Admin
          </span>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button
              key={id}
              onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                activeNav === id
                  ? "bg-emerald-700/20 text-emerald-400 border-r-2 border-emerald-400"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              <span>{icon}</span>
              {label}
              {id === "reports" && openReports > 0 && (
                <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {openReports}
                </span>
              )}
              {id === "jobs" && flaggedJobs > 0 && (
                <span className="ml-auto bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {flaggedJobs}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-gray-700 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
              AD
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 truncate">Admin</p>
              <p className="text-xs text-gray-500 truncate">admin@fluxo.com</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="mt-3 w-full text-xs text-gray-500 hover:text-red-400 text-left transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-base font-semibold text-gray-900 capitalize">{activeNav}</h1>
          {openReports > 0 && (
            <span className="ml-2 px-2.5 py-0.5 bg-red-50 text-red-600 text-xs font-medium rounded-full">
              {openReports} open reports
            </span>
          )}
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total users"    value={totalUsers.toLocaleString()} sub="+42 this week" highlight />
            <StatCard label="Total jobs"     value={totalJobs.toLocaleString()}  sub="+18 this week" />
            <StatCard label="Open reports"   value={String(openReports)} sub={openReports > 0 ? "Needs attention" : "All clear"} />
            <StatCard label="Flagged jobs"   value={String(flaggedJobs)} />
          </div>

          {/* Growth chart + Reports */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Growth chart */}
            <section className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900">Platform growth</h2>
                <div className="flex items-center gap-3 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-600 inline-block" />Users</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-200 inline-block" />Jobs</span>
                </div>
              </div>
              <GrowthChart />
            </section>

            {/* Reports */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Reports</h2>
                <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-100">
                {REPORTS.map((r) => (
                  <div key={r.id} className="flex items-start justify-between px-5 py-3.5 gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${REPORT_TYPE_STYLES[r.type]}`}>
                          {r.type}
                        </span>
                        <span className="text-[11px] text-gray-400">{r.reportedAt}</span>
                      </div>
                      <p className="text-xs text-gray-600 truncate">{r.description}</p>
                    </div>
                    <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${r.resolved ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                      {r.resolved ? "Resolved" : "Open"}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Recent users */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent users</h2>
              <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-400 font-medium border-b border-gray-100">
                    <th className="px-5 py-2.5 font-medium">User</th>
                    <th className="px-5 py-2.5 font-medium">Role</th>
                    <th className="px-5 py-2.5 font-medium">Joined</th>
                    <th className="px-5 py-2.5 font-medium">Status</th>
                    <th className="px-5 py-2.5 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {RECENT_USERS.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                            style={{ background: u.avatarBg }}
                            aria-hidden="true"
                          >
                            {u.initials}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-xs">{u.name}</p>
                            <p className="text-[11px] text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${u.role === "freelancer" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-xs text-gray-500">{u.joined}</td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${USER_STATUS_STYLES[u.status]}`}>
                          {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button className="text-xs text-emerald-700 hover:underline font-medium">
                          {u.status === "suspended" ? "Reinstate" : "View"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Recent jobs */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Recent jobs</h2>
              <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
            </div>
            <div className="divide-y divide-gray-100">
              {RECENT_JOBS.map((job) => (
                <div key={job.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.client} · Posted {job.postedAt}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-sm font-semibold text-gray-800">${job.budget}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${JOB_STATUS_STYLES[job.status]}`}>
                      {JOB_STATUS_LABELS[job.status]}
                    </span>
                    {job.status === "flagged" && (
                      <button className="text-xs text-red-600 hover:underline font-medium">Review</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </main>
      </div>
    </div>
  );
}