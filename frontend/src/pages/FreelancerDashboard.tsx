import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Job {
  id: number;
  title: string;
  client: string;
  budget: number;
  deadline: string;
  status: "in_progress" | "under_review" | "completed";
}

interface Proposal {
  id: number;
  title: string;
  bid: number;
  submittedAt: string;
  status: "pending" | "shortlisted" | "rejected";
}

interface Earning {
  month: string;
  amount: number;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const ACTIVE_JOBS: Job[] = [
  { id: 1, title: "E-commerce React Frontend",     client: "TechVision Ltd",  budget: 1200, deadline: "Jul 12", status: "in_progress"  },
  { id: 2, title: "REST API Integration",           client: "StartupHub",     budget: 650,  deadline: "Jul 18", status: "under_review" },
  { id: 3, title: "Mobile App UI Redesign",         client: "Creativeco",     budget: 900,  deadline: "Jul 25", status: "in_progress"  },
];

const PROPOSALS: Proposal[] = [
  { id: 1, title: "SaaS Dashboard Build",           bid: 1500, submittedAt: "Jun 28", status: "shortlisted" },
  { id: 2, title: "WordPress Plugin Development",   bid: 480,  submittedAt: "Jun 30", status: "pending"     },
  { id: 3, title: "Data Visualisation Charts",      bid: 720,  submittedAt: "Jul 2",  status: "rejected"    },
];

const EARNINGS: Earning[] = [
  { month: "Feb", amount: 1800 },
  { month: "Mar", amount: 2400 },
  { month: "Apr", amount: 2100 },
  { month: "May", amount: 3200 },
  { month: "Jun", amount: 2750 },
  { month: "Jul", amount: 1400 },
];

const NAV_ITEMS = [
  { label: "Overview",   icon: "⊞", id: "overview"   },
  { label: "My Jobs",    icon: "📋", id: "jobs"       },
  { label: "Proposals",  icon: "📨", id: "proposals"  },
  { label: "Earnings",   icon: "💳", id: "earnings"   },
  { label: "Profile",    icon: "👤", id: "profile"    },
  { label: "Messages",   icon: "💬", id: "messages"   },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  in_progress:  "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  completed:    "bg-emerald-50 text-emerald-700",
  pending:      "bg-gray-100 text-gray-600",
  shortlisted:  "bg-emerald-50 text-emerald-700",
  rejected:     "bg-red-50 text-red-600",
};

const STATUS_LABELS: Record<string, string> = {
  in_progress:  "In Progress",
  under_review: "Under Review",
  completed:    "Completed",
  pending:      "Pending",
  shortlisted:  "Shortlisted",
  rejected:     "Rejected",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
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

// ─── Earnings Bar Chart ───────────────────────────────────────────────────────

function EarningsChart({ data }: { data: Earning[] }) {
  const max = Math.max(...data.map((d) => d.amount));
  return (
    <div className="flex items-end gap-2 h-32 mt-4">
      {data.map(({ month, amount }) => (
        <div key={month} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-500">${(amount / 1000).toFixed(1)}k</span>
          <div
            className="w-full bg-emerald-600 rounded-t-md transition-all"
            style={{ height: `${(amount / max) * 100}%`, minHeight: "4px" }}
            aria-label={`${month}: $${amount}`}
          />
          <span className="text-[10px] text-gray-400">{month}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FreelancerDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const totalEarnings = EARNINGS.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 shrink-0">
          <Link to="/" className="font-serif text-lg font-light tracking-tight text-gray-900">
            freelance<em className="italic text-emerald-700">fluxo</em>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button
              key={id}
              onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium transition-colors ${
                activeNav === id
                  ? "bg-emerald-50 text-emerald-700 border-r-2 border-emerald-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-700 text-white text-xs font-bold flex items-center justify-center shrink-0">
              AK
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Ashan Kumara</p>
              <p className="text-xs text-gray-500 truncate">Full Stack Dev</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="mt-3 w-full text-xs text-gray-500 hover:text-red-600 text-left transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
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
          <button className="ml-auto px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-full hover:bg-emerald-800 transition-colors">
            Find work
          </button>
        </header>

        {/* Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total earnings"     value={`$${totalEarnings.toLocaleString()}`} sub="+18% vs last month" />
            <StatCard label="Active jobs"         value={String(ACTIVE_JOBS.filter(j => j.status === "in_progress").length)} />
            <StatCard label="Open proposals"      value={String(PROPOSALS.filter(p => p.status === "pending").length)} />
            <StatCard label="Profile views"       value="284"  sub="This month" />
          </div>

          {/* Active Jobs */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Active jobs</h2>
              <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
            </div>
            <div className="divide-y divide-gray-100">
              {ACTIVE_JOBS.map((job) => (
                <div key={job.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                    <p className="text-xs text-gray-500">{job.client} · Due {job.deadline}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-sm font-semibold text-gray-800">${job.budget}</span>
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Proposals + Earnings chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Proposals */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Recent proposals</h2>
                <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-100">
                {PROPOSALS.map((p) => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-500">Bid ${p.bid} · {p.submittedAt}</p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </section>

            {/* Earnings chart */}
            <section className="bg-white border border-gray-200 rounded-xl px-5 py-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-gray-900">Earnings</h2>
                <span className="text-xs text-gray-500">Last 6 months</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">${totalEarnings.toLocaleString()}</p>
              <EarningsChart data={EARNINGS} />
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}