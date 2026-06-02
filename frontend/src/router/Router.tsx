import { BrowserRouter, Route, Routes } from "react-router-dom";
import FreelancerPlatform from "../pages/FreelancerPlatform";
import Signupflow from "../pages/Signupflow";
import LoginPage from "../pages/LoginPage";
// import MainLayout from "../layouts/MainLayout";
// import DashboardPage from "../pages/DashboardPage";
// import CustomerPage from "../pages/CustomerPage";
// import ItemPage from "../pages/ItemPage";
// import OrderPage from "../pages/OrderPage";
// import BlogPage from "../pages/BlogPage";
// import { RequireAuth } from "../components/RequireAuth";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FreelancerPlatform />} />
        <Route path="/signup" element={<Signupflow />} />
        <Route path="/login" element={<LoginPage />} />
        
        {/* <Route path="/register" element={<RegisterPage />} />

        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <RequireAuth>
                <DashboardPage />
              </RequireAuth>
            }
          />
          <Route
            path="/customer"
            element={
              <RequireAuth>
                <CustomerPage />
              </RequireAuth>
            }
          />
          <Route
            path="/item"
            element={
              <RequireAuth>
                <ItemPage />
              </RequireAuth>
            }
          />
          <Route
            path="/order"
            element={
              <RequireAuth>
                <OrderPage />
              </RequireAuth>
            }
          />
          <Route
            path="/blog"
            element={
              <RequireAuth>
                <BlogPage />
              </RequireAuth>
            }
          /> 
        </Route>*/}
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
