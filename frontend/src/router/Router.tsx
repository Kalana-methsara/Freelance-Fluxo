import { BrowserRouter, Route, Routes } from "react-router-dom";
import FreelancerPlatform from "../pages/FreelancerPlatform";
import Signupflow from "../pages/Signupflow";
import LoginPage from "../pages/LoginPage";
import OAuthCallback from "../pages/OAuthCallback";
import FreelancerDashboard from "../pages/FreelancerDashboard";
import ClientDashboard from "../pages/ClientDashboard";
import AdminDashboard from "../pages/AdminDashboard";
import SearchPage from "../pages/SearchPage";
import CategoryPage from "../pages/CategoryPage";
import FreelancerDetailPage from "../pages/FreelancerDetailPage";
import PostJobPage from "../pages/PostJobPage";
import LegalPage from "../pages/LegalPage";
import JobsPage from "../pages/JobsPage";
import { RequireAuth } from "../components/RequireAuth";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FreelancerPlatform />} />
        <Route path="/signup" element={<Signupflow />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/categories/:id" element={<CategoryPage />} />
        <Route path="/freelancers/:id" element={<FreelancerDetailPage />} />
        <Route path="/terms" element={<LegalPage type="terms" />} />
        <Route path="/user-agreement" element={<LegalPage type="user-agreement" />} />
        <Route path="/privacy" element={<LegalPage type="privacy" />} />

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
    </BrowserRouter>
  );
};

export default Router;
