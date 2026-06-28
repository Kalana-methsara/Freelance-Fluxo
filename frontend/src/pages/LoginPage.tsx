import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { setCredentials } from "../features/authSlice";
import authService from "../services/authService";
// import type { AuthUser } from "../types"; (unused)
import { getDashboardPath } from "../utils/auth";
import {
  Logo,
  Divider,
  OAuthButtons,
  ErrorAlert,
  PasswordInput,
  AuthCard,
  AuthFooter,
  extractErrorMessage,
} from "../components/AuthShared";

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();

  const successMessage = (location.state as { message?: string } | null)?.message;

  useEffect(() => {
    if (!errorMessage) return;
    const timer = setTimeout(() => setErrorMessage(null), 8000);
    return () => clearTimeout(timer);
  }, [errorMessage]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const userData = await authService.login({ email, password });
      console.log("Login successful:", userData);

      if (!userData.accessToken) {
        setErrorMessage("Sign-in failed — no access token received.");
        setIsLoading(false);
        return;
      }

      if (userData.approvalStatus && userData.approvalStatus !== "approved") {
        const msg =
          userData.approvalStatus === "pending"
            ? "Your account is pending approval. Please wait for an admin to approve it."
            : "Your account has been rejected. Please contact support.";
        setErrorMessage(msg);
        setIsLoading(false);
        return;
      }

      localStorage.setItem(STORAGE_KEYS.accessToken, userData.accessToken);
      localStorage.setItem(STORAGE_KEYS.refreshToken, userData.refreshToken ?? "");
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));
      dispatch(setCredentials(userData));

      setShowSuccessToast(true);
      navigate(getDashboardPath(userData.roles), { replace: true });
    } catch (error) {
      setErrorMessage(extractErrorMessage(error));
      setIsLoading(false);
    }
  };

  return (
    <AuthCard>
      {showSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 animate-pulse">
          <div className="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2.5 font-medium text-sm border border-emerald-500">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Signed in — redirecting…
          </div>
        </div>
      )}

      <div className="mb-6"><Logo /></div>

      <h2 className="text-2xl font-serif font-normal text-center tracking-tight text-gray-900 mb-5">
        Welcome back
      </h2>

      {successMessage && (
        <div role="status" className="mb-5 rounded-lg px-4 py-2.5 text-sm bg-green-50 text-green-800 border border-green-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <ErrorAlert message={errorMessage} onDismiss={() => setErrorMessage(null)} />
      )}

      <OAuthButtons disabled={isLoading} />
      <Divider />

      <form className="flex flex-col gap-5" onSubmit={handleLogin} noValidate>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="example@mail.com"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
            className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all disabled:opacity-60"
          />
        </div>

        <PasswordInput
          id="password"
          name="password"
          label="Password"
          value={password}
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-full transition duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in…
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <AuthFooter prompt="Don't have an account?" label="Sign up" to="/signup" />
    </AuthCard>
  );
};

export default LoginPage;
