import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import DashboardPage from "../pages/DashboardPage";
import CustomerPage from "../pages/CustomerPage";
import ItemPage from "../pages/ItemPage";
import OrderPage from "../pages/OrderPage";
import BlogPage from "../pages/BlogPage";
import { RequireAuth } from "../components/RequireAuth";

const Router = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

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
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default Router;
