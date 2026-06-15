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

// ── Constants ──
const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];
function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const NAV_ITEMS = [
  { label: "Overview", id: "overview" },
  { label: "My Jobs", id: "jobs" },
  { label: "Proposals", id: "proposals" },
  { label: "Earnings", id: "earnings" },
  { label: "Messages", id: "messages" },
  { label: "Profile", id: "profile" },
];

const STATUS_STYLES: Record<string, string> = {
  in_progress: "bg-blue-50 text-blue-700",
  under_review: "bg-amber-50 text-amber-700",
  completed: "bg-green-50 text-green-700",
  pending: "bg-gray-100 text-gray-600",
  shortlisted: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  open: "bg-blue-50 text-blue-700",
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
        STATUS_STYLES[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function Logo() {
  return (
    <span className="text-xl font-bold tracking-tight">
      <span className="text-green-600">freelance</span>
      <span className="text-gray-900">fluxo</span>
    </span>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-green-600 mt-0.5">{sub}</p>}
    </div>
  );
}

// ── Work Submission Modal (fixed: removed unused state) ──
function WorkSubmissionModal({ jobId, onClose, onSuccess }: { jobId: string; onClose: () => void; onSuccess: () => void }) {
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return alert("Please attach a file");
    setSubmitting(true);
    const formData = new FormData();
    formData.append("description", description);
    formData.append("file", file);
    try {
      await jobService.submitWork(jobId, formData);
      alert("Work submitted successfully");
      onSuccess();
      onClose();
    } catch (err) {
      alert("Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Submit Work</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-3 py-2 mb-3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <label className="block text-sm font-medium mb-1">Attachment</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="mb-4"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-md">Cancel</button>
            <button type="submit" disabled={submitting} className="px-4 py-2 bg-green-600 text-white rounded-md">
              {submitting ? "Uploading..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Profile Editor ──
function ProfileEditor({ user, onSave, onCancel }: { user: any; onSave: (data: any) => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    title: user.title || "",
    hourlyRate: user.hourlyRate || 0,
    bio: user.bio || "",
    skills: (user.skills || []).join(", "),
  });

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      onSave({
        ...form,
          skills: form.skills.split(",").map((s: string) => s.trim()).filter(Boolean), 
      });
    }} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">Title</label>
        <input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Hourly Rate ($)</label>
        <input
          type="number"
          value={form.hourlyRate}
          onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
          className="w-full border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Bio</label>
        <textarea
          rows={3}
          value={form.bio}
          onChange={(e) => setForm({ ...form, bio: e.target.value })}
          className="w-full border rounded-md px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Skills (comma separated)</label>
        <input
          value={form.skills}
          onChange={(e) => setForm({ ...form, skills: e.target.value })}
          placeholder="React, Node, UI/UX"
          className="w-full border rounded-md px-3 py-2"
        />
      </div>
      <div className="flex gap-2">
        <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-md">Save</button>
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded-md">Cancel</button>
      </div>
    </form>
  );
}

export default function FreelancerDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [showWorkModal, setShowWorkModal] = useState<string | null>(null);
  // Chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const fetchDashboard = () => {
    setLoading(true);
    dashboardService
      .getFreelancerDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  // Initialize WebSocket connection when user is loaded
  useEffect(() => {
    if (data?.user?._id) {
      const token = localStorage.getItem("token") || "";
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

 const handleSaveProfile = async (updated: any) => {
    try {
      await jobService.updateFreelancerProfile(data.user._id, updated);
      fetchDashboard();
      setEditingProfile(false);
    } catch (err) {
      alert("Failed to update profile");
    }
  };

  const handleWithdrawProposal = async (proposalId: string) => {
  if (!confirm("Withdraw this proposal?")) return;
  try {
    await jobService.withdrawProposal(proposalId);
    fetchDashboard();
  } catch (err) {
    alert("Withdrawal failed");
  }
};

const handleMessageClient = async (clientId: string, jobId: string) => {
  try {
    const conversation = await jobService.createConversation(clientId, jobId);
    setSelectedConvId(conversation._id);
    setSelectedParticipant(conversation.participant);
    setActiveNav("messages");
  } catch (err) {
    alert("Could not open chat");
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
  const name = user ? `${user.firstName} ${user.lastName}` : "Freelancer";
  const earnings = data?.earnings || [];
  const transactions = data?.transactions || [];

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <Link to="/" aria-label="Home"><Logo /></Link>
          <div className="hidden sm:flex items-center gap-1 mx-4">
            {NAV_ITEMS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeNav === id ? "bg-green-50 text-green-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate("/jobs")} className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700">
              Find work
            </button>
            <button onClick={handleLogout} className="hidden sm:inline-block px-4 py-1.5 border-2 border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-green-600 hover:text-green-600">
              Sign out
            </button>
          </div>
        </div>
        <div className="sm:hidden px-4 pb-2 flex gap-2 overflow-x-auto">
          {NAV_ITEMS.map(({ label, id }) => (
            <button key={id} onClick={() => setActiveNav(id)} className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full border ${activeNav === id ? "bg-green-600 text-white border-green-600" : "border-gray-300 text-gray-700"}`}>
              {label}
            </button>
          ))}
          <button onClick={handleLogout} className="whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full border border-gray-300 text-gray-700 hover:border-red-500 hover:text-red-500 ml-auto">
            Sign out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {/* Overview stats */}
        {activeNav === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total earnings" value={`$${(stats.totalEarnings || 0).toLocaleString()}`} />
            <StatCard label="Active jobs" value={String(stats.activeJobs || 0)} />
            <StatCard label="Open proposals" value={String(stats.openProposals || 0)} />
            <StatCard label="Profile views" value={String(stats.profileViews || 0)} sub="From this month" />
          </div>
        )}

        {/* Jobs section */}
        {(activeNav === "overview" || activeNav === "jobs") && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">{activeNav === "overview" ? "Active jobs" : "My jobs"}</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data?.activeJobs?.length ? (
                data.activeJobs.map((job: any) => (
                  <div key={job._id} className="px-5 py-3.5">
                    <div className="flex items-center justify-between">
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
                    {job.status === "in_progress" && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => setShowWorkModal(job._id)}
                          className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200"
                        >
                          Submit work
                        </button>
                        <button
                          onClick={() => handleMessageClient(job.clientId._id, job._id)}
                          className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full hover:bg-blue-200"
                        >
                          Message client
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">No active jobs yet. Browse open jobs to apply.</p>
              )}
            </div>
          </section>
        )}

        {/* Proposals section */}
        {(activeNav === "overview" || activeNav === "proposals") && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900">Proposals</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {data?.proposals?.length ? (
                data.proposals.map((p: any) => (
                  <div key={p._id} className="flex items-center justify-between px-5 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.jobId?.title || "Job"}</p>
                      <p className="text-xs text-gray-500">Bid ${p.bid}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={p.status} />
                      {p.status === "pending" && (
                        <button
                          onClick={() => handleWithdrawProposal(p._id)}
                          className="text-xs text-red-600 hover:underline"
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">No proposals yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Earnings + transaction history */}
        {(activeNav === "overview" || activeNav === "earnings") && (
          <section className="bg-white border border-gray-200 rounded-xl px-5 py-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Earnings</h2>
            <p className="text-2xl font-bold text-gray-900">${(stats.totalEarnings || 0).toLocaleString()}</p>
            {earnings.length > 0 && (
              <div className="flex items-end gap-2 h-32 mt-4">
                {earnings.map(({ month, amount }: any) => (
                  <div key={month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-500">${amount}</span>
                    <div className="w-full bg-green-600 rounded-t-md" style={{ height: `${Math.max(20, (amount / (stats.totalEarnings || 1)) * 100)}%`, minHeight: "4px" }} />
                    <span className="text-[10px] text-gray-400">{month}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Transaction History</h3>
              {transactions.length > 0 ? (
                <table className="w-full text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="text-left py-2">Date</th>
                      <th className="text-left">Job</th>
                      <th className="text-left">Amount</th>
                      <th className="text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((tx: any) => (
                      <tr key={tx._id} className="border-b">
                        <td className="py-2">{new Date(tx.createdAt).toLocaleDateString()}</td>
                        <td>{tx.jobTitle}</td>
                        <td>${tx.amount}</td>
                        <td><StatusBadge status={tx.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500 mt-2">No transactions yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Messages tab (integrated chat) */}
        {activeNav === "messages" && user && (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid md:grid-cols-3 h-150">
              {/* Conversation list */}
              <div className="border-r overflow-y-auto">
                <ChatConversationList
                  onSelectConversation={(convId, participant) => {
                    setSelectedConvId(convId);
                    setSelectedParticipant(participant);
                  }}
                  selectedId={selectedConvId || undefined}
                />
              </div>
              {/* Chat room */}
              <div className="md:col-span-2">
                {selectedConvId && selectedParticipant ? (
                  <ChatRoom
                    conversationId={selectedConvId}
                    currentUserId={user._id}
                    otherUser={selectedParticipant}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Select a conversation to start chatting
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Profile section */}
        {activeNav === "profile" && user && (
          <section className="bg-white border border-gray-200 rounded-xl p-6">
            {!editingProfile ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-lg font-bold" style={{ background: avatarColor(user._id) }}>
                      {getInitials(name)}
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{name}</h2>
                      <p className="text-sm text-gray-500">{user.title || "Freelancer"}</p>
                    </div>
                  </div>
                  <button onClick={() => setEditingProfile(true)} className="text-green-600 text-sm font-medium hover:underline">
                    Edit profile
                  </button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <p><strong>Email:</strong> {user.email}</p>
                  <p><strong>Rate:</strong> ${user.hourlyRate || 0}/hr</p>
                  {user.bio && <p className="col-span-2"><strong>Bio:</strong> {user.bio}</p>}
                </div>
                {user.skills?.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {user.skills.map((s: string) => (
                      <span key={s} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700 font-medium">{s}</span>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <ProfileEditor user={user} onSave={handleSaveProfile} onCancel={() => setEditingProfile(false)} />
            )}
          </section>
        )}
      </main>

      {/* Work submission modal */}
      {showWorkModal && (
        <WorkSubmissionModal
          jobId={showWorkModal}
          onClose={() => setShowWorkModal(null)}
          onSuccess={fetchDashboard}
        />
      )}
    </div>
  );
}