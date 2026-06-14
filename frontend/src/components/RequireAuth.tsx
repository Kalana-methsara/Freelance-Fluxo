import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { RootState } from "../redux/store";
import { getDashboardPath } from "../utils/auth";

interface RequireAuthProps {
  children: React.ReactNode;
  roles?: string[];
}

export function RequireAuth({ children, roles }: RequireAuthProps) {
  const { user, loading } = useSelector((state: RootState) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500 text-sm">Loading…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  if (user.approvalStatus && user.approvalStatus !== "approved") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Account pending approval</h2>
          <p className="text-sm text-gray-500 mb-6">
            Your account is awaiting admin approval. Please check back later.
          </p>
          <a href="/login" className="text-emerald-700 font-medium hover:underline text-sm">
            Back to login
          </a>
        </div>
      </div>
    );
  }

  if (roles?.length) {
    const userRoles = user.roles.map((r) => String(r).toUpperCase());
    if (userRoles.includes("SUPER_ADMIN")) {
      return <>{children}</>;
    }
    const allowed = roles.some((r) => userRoles.includes(r.toUpperCase()));
    if (!allowed) {
      return <Navigate to={getDashboardPath(user.roles)} replace />;
    }
  }

  return <>{children}</>;
}
