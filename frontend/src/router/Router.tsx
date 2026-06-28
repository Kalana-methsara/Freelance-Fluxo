import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Suspense, lazy } from "react";
import { RequireAuth } from "../components/RequireAuth";

// Route-based code-splitting: lazy-load larger pages
const FreelancerPlatform = lazy(() => import("../pages/FreelancerPlatform"));
const Signupflow = lazy(() => import("../pages/Signupflow"));
const LoginPage = lazy(() => import("../pages/LoginPage"));
const OAuthCallback = lazy(() => import("../pages/OAuthCallback"));
const FreelancerDashboard = lazy(() => import("../pages/FreelancerDashboard"));
const ClientDashboard = lazy(() => import("../pages/ClientDashboard"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const CategoryPage = lazy(() => import("../pages/CategoryPage"));
const FreelancerDetailPage = lazy(() => import("../pages/FreelancerDetailPage"));
const PostJobPage = lazy(() => import("../pages/PostJobPage"));
const LegalPage = lazy(() => import("../pages/LegalPage"));
const JobsPage = lazy(() => import("../pages/JobsPage"));
const HireFreelancerPage = lazy(() => import("../pages/HireFreelancerPage"));
const PaymentSettingsPage = lazy(() => import("../pages/PaymentSettingsPage"));

// ⭐ 1. WorkspacePage එක මෙතනට Lazy-load කරන්න
const WorkspacePage = lazy(() => import("../pages/WorkspacePage"));

const Router = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="p-8 text-center">Loading…</div>}>
        <Routes>
          <Route path="/" element={<FreelancerPlatform />} />
          <Route path="/signup" element={<Signupflow />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/jobs" element={<JobsPage />} />
          <Route path="/jobs/:jobId" element={<JobsPage />} />
          <Route path="/jobs/:jobId/apply" element={<JobsPage />} />
          <Route path="/hire/:freelancerId" element={<HireFreelancerPage />} />
          <Route path="/categories/:id" element={<CategoryPage />} />
          <Route path="/freelancers/:id" element={<FreelancerDetailPage />} />
          <Route path="/terms" element={<LegalPage type="terms" />} />
          <Route path="/user-agreement" element={<LegalPage type="user-agreement" />} />
          <Route path="/privacy" element={<LegalPage type="privacy" />} />

          <Route
            path="/settings/payment"
            element={
              <RequireAuth roles={["CLIENT", "FREELANCER"]}>
                <PaymentSettingsPage />
              </RequireAuth>
            }
          />

          {/* ⭐ 2. මෙතනට /workspace රවුට් එක ඇතුළත් කළා (Client & Freelancer දෙන්නටම පුළුවන්) */}
          <Route
            path="/workspace"
            element={
              <RequireAuth roles={["CLIENT", "FREELANCER"]}>
                <WorkspacePage />
              </RequireAuth>
            }
          />

          <Route
            path="/dashboard/freelancer"
            element={
              <RequireAuth roles={["FREELANCER"]}>
                <FreelancerDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/dashboard/client"
            element={
              <RequireAuth roles={["CLIENT"]}>
                <ClientDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/post-job"
            element={
              <RequireAuth roles={["CLIENT"]}>
                <PostJobPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAuth roles={["ADMIN"]}>
                <AdminDashboard />
              </RequireAuth>
            }
          />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default Router;