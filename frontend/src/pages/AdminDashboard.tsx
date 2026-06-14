import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import dashboardService from "../services/dashboardService";
import authService from "../services/authService";
import { logout } from "../features/authSlice";
import { formatDate, getInitials } from "../utils/auth";
import type { RootState } from "../redux/store";

// ─── Reusable constants from the main platform ───
const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];
function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const ADMIN_NAV_ITEMS = [
  { label: "Overview", id: "overview" },
  { label: "Users", id: "users" },
  { label: "Jobs", id: "jobs" },
  { label: "Reports", id: "reports" },
];

const USER_STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-50 text-green-700",
  rejected: "bg-red-50 text-red-600",
  pending: "bg-amber-50 text-amber-700",
};

// ─── Logo (identical to the public site) ───
function Logo() {
  return (
    <span className="text-xl font-bold tracking-tight">
      <span className="text-green-600">freelance</span>
      <span className="text-gray-900">fluxo</span>
    </span>
  );
}

// ─── Stat Card (now uses brand dark green for the highlight) ───
function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`border rounded-xl p-5 ${
        highlight
          ? "bg-[#001e00] border-[#001e00] text-white"
          : "bg-white border-gray-200"
      }`}
    >
      <p
        className={`text-xs font-medium mb-1 ${
          highlight ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {label}
      </p>
      <p
        className={`text-2xl font-bold ${
          highlight ? "text-white" : "text-gray-900"
        }`}
      >
        {value}
      </p>
      {sub && (
        <p
          className={`text-xs mt-0.5 ${
            highlight ? "text-gray-400" : "text-green-600"
          }`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [activeNav, setActiveNav] = useState("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const isSuperAdmin = currentUser?.roles.map((r) => String(r).toUpperCase()).includes("SUPER_ADMIN");

  const loadData = () => {
    setLoading(true);
    dashboardService
      .getAdminDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const handleApproval = async (userId: string, status: "approved" | "rejected") => {
    await authService.updateUserApproval(userId, status);
    loadData();
  };

  const handleRoleChange = async (
    userId: string,
    role: "SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER"
  ) => {
    await authService.updateUserRole(userId, role);
    loadData();
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading admin panel…</p>
      </div>
    );
  }

  const stats = data?.stats || {};

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* ─── Sticky top navigation (website‑style) ─── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>

          {/* Admin navigation tabs */}
          <div className="hidden sm:flex items-center gap-1 mx-4">
            {ADMIN_NAV_ITEMS.map(({ label, id }) => (
              <button
                key={id}
                onClick={() => setActiveNav(id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
                  activeNav === id
                    ? "bg-green-50 text-green-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Right side: logout button styled like the main site buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="px-4 py-1.5 border-2 border-gray-300 text-gray-700 rounded-full text-sm font-medium hover:border-green-600 hover:text-green-600 transition"
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile horizontal scroll for nav tabs */}
        <div className="sm:hidden px-4 pb-2 flex gap-2 overflow-x-auto">
          {ADMIN_NAV_ITEMS.map(({ label, id }) => (
            <button
              key={id}
              onClick={() => setActiveNav(id)}
              className={`whitespace-nowrap px-3 py-1.5 text-sm font-medium rounded-full border ${
                activeNav === id
                  ? "bg-green-600 text-white border-green-600"
                  : "border-gray-300 text-gray-700"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      {/* ─── Main content (same max‑width and padding as public pages) ─── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-8">
        {/* Overview Stats */}
        {activeNav === "overview" && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total users"
              value={String(stats.totalUsers || 0)}
              highlight
            />
            <StatCard label="Total jobs" value={String(stats.totalJobs || 0)} />
            <StatCard label="Open reports" value={String(stats.openReports || 0)} />
            <StatCard label="Flagged jobs" value={String(stats.flaggedJobs || 0)} />
          </div>
        )}

        {/* Users section */}
        {(activeNav === "overview" || activeNav === "users") && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="text-sm font-semibold">Users</h2>
              {activeNav === "overview" && (
                <button
                  onClick={() => setActiveNav("users")}
                  className="text-xs text-green-700 font-medium hover:underline"
                >
                  View all
                </button>
              )}
            </div>
            <div className="divide-y">
              {data?.recentUsers?.length ? (
                data.recentUsers.map((u: any) => (
                  <div
                    key={u._id}
                    className="px-5 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: avatarColor(u._id) }}
                      >
                        {getInitials(`${u.firstName} ${u.lastName}`)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {u.firstName} {u.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {u.email} · {u.userRole?.join(", ")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          USER_STATUS_STYLES[u.approvalStatus] || ""
                        }`}
                      >
                        {u.approvalStatus}
                      </span>
                      <div className="flex items-center gap-2">
                        {u.approvalStatus !== "approved" && (
                          <button
                            onClick={() => handleApproval(u._id, "approved")}
                            className="text-xs text-green-700 font-medium hover:underline"
                          >
                            Approve
                          </button>
                        )}
                        {u.approvalStatus !== "rejected" && (
                          <button
                            onClick={() => handleApproval(u._id, "rejected")}
                            className="text-xs text-red-600 font-medium hover:underline"
                          >
                            Reject
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {['CLIENT', 'FREELANCER', 'ADMIN', 'SUPER_ADMIN'].map((role) =>
                          role !== u.userRole?.[0] && (role !== 'SUPER_ADMIN' || isSuperAdmin) ? (
                            <button
                              key={role}
                              onClick={() => handleRoleChange(u._id, role as "SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER")}
                              className="text-xs text-blue-600 font-medium hover:underline"
                            >
                              {`Make ${role.charAt(0) + role.slice(1).toLowerCase().replace("_", " ")}`}
                            </button>
                          ) : null
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">
                  No users found.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Jobs section */}
        {(activeNav === "overview" || activeNav === "jobs") && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Recent jobs</h2>
            </div>
            <div className="divide-y">
              {data?.recentJobs?.length ? (
                data.recentJobs.map((j: any) => (
                  <div
                    key={j._id}
                    className="px-5 py-4 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-medium text-gray-900">{j.title}</p>
                      <p className="text-xs text-gray-500">
                        {j.clientId?.companyName || j.clientId?.firstName} · $
                        {j.budget}
                      </p>
                    </div>
                    <span className="text-xs capitalize bg-gray-100 px-2 py-1 rounded-full">
                      {j.status}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">
                  No jobs yet.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Reports section */}
        {(activeNav === "overview" || activeNav === "reports") && (
          <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b">
              <h2 className="text-sm font-semibold">Reports</h2>
            </div>
            <div className="divide-y">
              {data?.reports?.length ? (
                data.reports.map((r: any) => (
                  <div key={r._id} className="px-5 py-4">
                    <div className="flex justify-between">
                      <span className="text-xs font-medium capitalize bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                        {r.type}
                      </span>
                      <span className="text-xs text-gray-400">
                        {formatDate(r.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {r.description}
                    </p>
                    <span
                      className={`text-xs ${
                        r.resolved ? "text-green-600" : "text-amber-600"
                      }`}
                    >
                      {r.resolved ? "Resolved" : "Open"}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-5 py-8 text-sm text-gray-500 text-center">
                  No reports.
                </p>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}