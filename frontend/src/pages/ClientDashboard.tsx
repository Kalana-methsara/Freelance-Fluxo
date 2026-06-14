import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import dashboardService from "../services/dashboardService";
import jobService from "../services/jobService";
import chatService from "../services/chatService";
import ChatConversationList from "../components/ChatConversationList";
import ChatRoom from "../components/ChatRoom";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";

const NAV_ITEMS = [
  { label: "Overview", icon: "⊞", id: "overview" },
  { label: "Projects", icon: "📁", id: "projects" },
  { label: "Applicants", icon: "👥", id: "applicants" },
  { label: "Invoices", icon: "🧾", id: "invoices" },
  { label: "Messages", icon: "💬", id: "messages" }, // new chat tab
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
    <div className={`border rounded-xl p-5 transition-all duration-200 hover:shadow-md ${accent ? "bg-emerald-700 border-emerald-700" : "bg-white border-gray-200"}`}>
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
  // Chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchDashboard = () => {
    setLoading(true);
    dashboardService.getClientDashboard()
      .then(setData)
      .catch((err) => {
        console.error(err);
        setData(null);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetchDashboard();
  }, []);

  // WebSocket connection when user is loaded
  useEffect(() => {
    if (data?.user?._id) {
      const token = localStorage.getItem("accessToken") || localStorage.getItem("token") || "";
      chatService.connect(data.user._id, token);
      return () => {
        chatService.disconnect();
      };
    }
  }, [data?.user?._id]);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleMessageFreelancer = async (freelancerId: string, jobId: string) => {
    try {
      const conversation = await jobService.createConversation(freelancerId, jobId);
      setSelectedConvId(conversation._id);
      setSelectedParticipant(conversation.participant);
      setActiveNav("messages");
    } catch (err) {
      alert("Could not start conversation");
    }
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
  const name = user?.companyName || `${user?.firstName} ${user?.lastName}`;
  const projects = data?.projects || [];
  const applicants = data?.applicants || [];
  const invoices = data?.invoices || [];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 font-sans flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white/90 backdrop-blur-sm border-r border-gray-200 flex flex-col transform transition-all duration-300 shadow-xl ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:relative lg:translate-x-0 lg:shadow-none`}>
        <div className="px-6 py-5 border-b border-gray-100">
          <Link to="/" className="font-serif text-xl tracking-tight text-gray-900">freelance<em className="italic text-emerald-600">fluxo</em></Link>
        </div>
        <nav className="flex-1 py-6 space-y-1">
          {NAV_ITEMS.map(({ label, icon, id }) => (
            <button
              key={id}
              onClick={() => { setActiveNav(id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all ${
                activeNav === id
                  ? "bg-emerald-50 text-emerald-700 border-r-4 border-emerald-600"
                  : "text-gray-600 hover:bg-gray-50 hover:text-emerald-600"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="px-6 py-5 border-t border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-linear-to-br from-emerald-600 to-emerald-800 text-white text-sm font-bold flex items-center justify-center shadow-sm">
              {getInitials(name)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{name}</p>
              <p className="text-xs text-gray-500">Client</p>
            </div>
          </div>
          <button onClick={handleLogout} className="mt-4 w-full text-center text-xs text-gray-500 hover:text-red-600 transition">Sign out</button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center gap-4 shadow-sm">
          <button className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-emerald-600" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <h1 className="text-lg font-semibold capitalize text-gray-800">{activeNav}</h1>
          <button onClick={() => navigate("/post-job")} className="ml-auto px-5 py-2 bg-emerald-600 text-white text-sm rounded-full hover:bg-emerald-700 transition shadow-sm hover:shadow">
            + Post a job
          </button>
        </header>

        <main className="flex-1 px-4 sm:px-6 py-8 space-y-8 max-w-6xl mx-auto w-full">
          {/* Overview / Projects section */}
          {(activeNav === "overview" || activeNav === "projects") && (
            <>
              {activeNav === "overview" && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard label="Total budget" value={`$${(stats.totalBudget || 0).toLocaleString()}`} />
                  <StatCard label="Total spent" value={`$${(stats.totalSpent || 0).toLocaleString()}`} accent />
                  <StatCard label="Active projects" value={String(stats.activeProjects || 0)} />
                  <StatCard label="Pending invoices" value={String(stats.pendingInvoices || 0)} />
                </div>
              )}
              <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b bg-gray-50/50">
                  <h2 className="text-sm font-semibold text-gray-700">Projects</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {projects.length ? projects.map((p: any) => (
                    <div key={p._id} className="px-6 py-5 hover:bg-gray-50 transition">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{p.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {p.freelancerId ? `${p.freelancerId.firstName} ${p.freelancerId.lastName}` : "No freelancer assigned"} · Due {formatDate(p.deadline)}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>
                      <div className="mt-3 flex justify-between items-center text-xs text-gray-500">
                        <span>${p.spent || 0} / ${p.budget} spent</span>
                        {p.freelancerId && (
                          <button
                            onClick={() => handleMessageFreelancer(p.freelancerId._id, p._id)}
                            className="flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium"
                          >
                            💬 Message
                          </button>
                        )}
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, ((p.spent || 0) / p.budget) * 100)}%` }} />
                      </div>
                    </div>
                  )) : (
                    <p className="px-6 py-12 text-sm text-gray-500 text-center">
                      No projects yet. <button onClick={() => navigate("/post-job")} className="text-emerald-600 underline font-medium">Post your first job</button>
                    </p>
                  )}
                </div>
              </section>
            </>
          )}

          {/* Applicants section */}
          {(activeNav === "overview" || activeNav === "applicants") && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-700">Recent applicants</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {applicants.length ? applicants.slice(0, 10).map((a: any) => (
                  <div key={a._id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{a.freelancerId?.firstName} {a.freelancerId?.lastName}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{a.jobId?.title} · Bid ${a.bid}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                )) : (
                  <p className="px-6 py-12 text-sm text-gray-500 text-center">No applicants yet.</p>
                )}
              </div>
            </section>
          )}

          {/* Invoices section */}
          {(activeNav === "overview" || activeNav === "invoices") && (
            <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50/50">
                <h2 className="text-sm font-semibold text-gray-700">Invoices</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {invoices.length ? invoices.map((inv: any) => (
                  <div key={inv._id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{inv.project}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{formatDate(inv.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">${inv.amount}</p>
                      <span className={`text-xs font-medium ${inv.paid ? "text-emerald-600" : "text-amber-600"}`}>{inv.paid ? "Paid" : "Pending"}</span>
                    </div>
                  </div>
                )) : (
                  <p className="px-6 py-12 text-sm text-gray-500 text-center">No invoices yet.</p>
                )}
              </div>
            </section>
          )}

          {/* Messages tab (chat) */}
          {activeNav === "messages" && user && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="grid md:grid-cols-3 h-162.5">
                <div className="border-r border-gray-200 overflow-y-auto bg-gray-50/30">
                  <ChatConversationList
                    onSelectConversation={(convId, participant) => {
                      setSelectedConvId(convId);
                      setSelectedParticipant(participant);
                    }}
                    selectedId={selectedConvId || undefined}
                  />
                </div>
                <div className="md:col-span-2">
                  {selectedConvId && selectedParticipant ? (
                    <ChatRoom
                      conversationId={selectedConvId}
                      currentUserId={user._id}
                      otherUser={selectedParticipant}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="text-5xl mb-3">💬</div>
                      <p className="text-sm">Select a conversation to start chatting</p>
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