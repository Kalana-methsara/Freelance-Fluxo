import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  id: number;
  title: string;
  freelancer: string;
  budget: number;
  spent: number;
  deadline: string;
  status: "active" | "under_review" | "completed" | "draft";
}

interface Applicant {
  id: number;
  name: string;
  jobTitle: string;
  bid: number;
  rating: number;
  initials: string;
  avatarBg: string;
}

interface Invoice {
  id: number;
  freelancer: string;
  project: string;
  amount: number;
  date: string;
  paid: boolean;
}

// ─── Data ────────────────────────────────────────────────────────────────────

const PROJECTS: Project[] = [
  { id: 1, title: "Brand Identity Redesign",   freelancer: "Saman Perera",      budget: 1800, spent: 900,  deadline: "Jul 20", status: "active"       },
  { id: 2, title: "Marketing Landing Page",    freelancer: "Ashan Kumara",      budget: 950,  spent: 950,  deadline: "Jun 30", status: "under_review" },
  { id: 3, title: "Mobile App MVP",            freelancer: "Nadeesha Fernando", budget: 3500, spent: 1200, deadline: "Aug 10", status: "active"       },
  { id: 4, title: "Quarterly Report Design",   freelancer: "—",                 budget: 500,  spent: 0,    deadline: "Jul 8",  status: "draft"        },
];

const APPLICANTS: Applicant[] = [
  { id: 1, name: "Ruwani Jayaweera", jobTitle: "SEO Content Writer",    bid: 320,  rating: 5, initials: "RJ", avatarBg: "#d97706" },
  { id: 2, name: "Kasun Silva",      jobTitle: "React Developer",       bid: 1100, rating: 5, initials: "KS", avatarBg: "#0891b2" },
  { id: 3, name: "Thilini Madhavi",  jobTitle: "Graphic Designer",      bid: 580,  rating: 4, initials: "TM", avatarBg: "#7c3aed" },
];

const INVOICES: Invoice[] = [
  { id: 1, freelancer: "Saman Perera",      project: "Brand Identity",    amount: 900,  date: "Jun 15", paid: true  },
  { id: 2, freelancer: "Ashan Kumara",      project: "Landing Page",      amount: 950,  date: "Jun 30", paid: true  },
  { id: 3, freelancer: "Nadeesha Fernando", project: "Mobile App MVP",    amount: 1200, date: "Jul 5",  paid: false },
];

const NAV_ITEMS = [
  { label: "Overview",    icon: "⊞", id: "overview"  },
  { label: "Projects",    icon: "📁", id: "projects"  },
  { label: "Applicants",  icon: "👥", id: "applicants" },
  { label: "Invoices",    icon: "🧾", id: "invoices"  },
  { label: "Messages",    icon: "💬", id: "messages"  },
  { label: "Settings",    icon: "⚙️", id: "settings"  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  active:       "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  completed:    "bg-emerald-50 text-emerald-700",
  draft:        "bg-gray-100 text-gray-500",
};

const STATUS_LABELS: Record<string, string> = {
  active:       "Active",
  under_review: "Under Review",
  completed:    "Completed",
  draft:        "Draft",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
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

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
      <div
        className="bg-emerald-600 h-1.5 rounded-full transition-all"
        style={{ width: `${pct}%` }}
        aria-label={`${pct}% spent`}
      />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ClientDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const totalBudget  = PROJECTS.reduce((s, p) => s + p.budget, 0);
  const totalSpent   = PROJECTS.reduce((s, p) => s + p.spent,  0);
  const activeCount  = PROJECTS.filter((p) => p.status === "active").length;
  const pendingInvoices = INVOICES.filter((i) => !i.paid);

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex">

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:relative lg:translate-x-0 lg:flex
      `}>
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

        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
              TC
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">TechVision Ltd</p>
              <p className="text-xs text-gray-500 truncate">Client account</p>
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

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
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
          <button
            onClick={() => navigate("/post-job")}
            className="ml-auto px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-full hover:bg-emerald-800 transition-colors"
          >
            Post a job
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-6 space-y-6 max-w-5xl w-full mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total budget"    value={`$${totalBudget.toLocaleString()}`}  accent />
            <StatCard label="Total spent"     value={`$${totalSpent.toLocaleString()}`}   sub={`${Math.round((totalSpent / totalBudget) * 100)}% of budget`} />
            <StatCard label="Active projects" value={String(activeCount)} />
            <StatCard label="Pending invoices" value={String(pendingInvoices.length)} sub={pendingInvoices.length ? `$${pendingInvoices.reduce((s, i) => s + i.amount, 0)} due` : undefined} />
          </div>

          {/* Projects */}
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Projects</h2>
              <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
            </div>
            <div className="divide-y divide-gray-100">
              {PROJECTS.map((proj) => (
                <div key={proj.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{proj.title}</p>
                      <p className="text-xs text-gray-500">{proj.freelancer} · Due {proj.deadline}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-semibold text-gray-800">${proj.budget}</span>
                      <StatusBadge status={proj.status} />
                    </div>
                  </div>
                  {proj.status !== "draft" && (
                    <div>
                      <div className="flex justify-between text-[11px] text-gray-400 mb-0.5">
                        <span>Spent ${proj.spent}</span>
                        <span>{Math.round((proj.spent / proj.budget) * 100)}%</span>
                      </div>
                      <ProgressBar value={proj.spent} max={proj.budget} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* Applicants + Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Applicants */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">New applicants</h2>
                <button className="text-xs text-emerald-700 font-medium hover:underline">Review all</button>
              </div>
              <div className="divide-y divide-gray-100">
                {APPLICANTS.map((a) => (
                  <div key={a.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                        style={{ background: a.avatarBg }}
                        aria-hidden="true"
                      >
                        {a.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{a.name}</p>
                        <p className="text-xs text-gray-500">{a.jobTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-sm font-semibold text-gray-800">${a.bid}</p>
                      <p className="text-xs text-amber-500">{"★".repeat(a.rating)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Invoices */}
            <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">Invoices</h2>
                <button className="text-xs text-emerald-700 font-medium hover:underline">View all</button>
              </div>
              <div className="divide-y divide-gray-100">
                {INVOICES.map((inv) => (
                  <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{inv.freelancer}</p>
                      <p className="text-xs text-gray-500">{inv.project} · {inv.date}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span className="text-sm font-semibold text-gray-800">${inv.amount}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${inv.paid ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"}`}>
                        {inv.paid ? "Paid" : "Due"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}