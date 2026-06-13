import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { STORAGE_KEYS } from "../utils/storageKeys";
import { setCredentials } from "../features/authSlice";
import authService from "../services/authService";
import type { AuthUser } from "../types";

// ─── Icons (matching SignupFlow) ──────────────────────────────────────────────

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.88-.01-1.72-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
  );
}

const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const successMessage = (location.state as { message?: string } | null)?.message;

  const handleOAuth = (provider: "github" | "google") => {
    // 💡 FIX: process.env වෙනුවට import.meta.env භාවිත කර ඇත
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
  };

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const response = await authService.login({ email, password });
      const userData = (response?.data ?? response) as AuthUser;

      if (userData?.accessToken) {
        localStorage.setItem(STORAGE_KEYS.accessToken, userData.accessToken);
        localStorage.setItem(STORAGE_KEYS.refreshToken, userData.refreshToken);
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userData));

        dispatch(setCredentials(userData));
        alert("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: unknown) {
      console.error(error);
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response
            ?.data?.message
          : undefined;
      alert(message || "Invalid credentials!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="text-center mb-6 font-serif text-xl font-light tracking-tight text-gray-900">
          freelance<em className="italic text-emerald-700">fluxo</em>
        </div>

        <h2 className="text-2xl font-serif font-normal text-center tracking-tight text-gray-900 mb-2">
          Welcome Back
        </h2>

        {successMessage && (
          <div
            role="status"
            className="mb-5 rounded-lg px-4 py-2.5 text-sm bg-green-50 text-green-800 border border-green-200"
          >
            {successMessage}
          </div>
        )}

        {/* OAuth Buttons */}
        <div className="flex flex-col gap-2.5 mb-5">
          {/* 💡 Apple Button එක කෝඩ් එකෙන් ඉවත් කර ඇත */}
          <button
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-300 rounded-full font-medium text-sm text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-400"
            onClick={() => handleOAuth("github")}
            type="button"
          >
            <GithubIcon />
            Continue with GitHub
          </button>
          <button
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-300 rounded-full font-medium text-sm text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-400"
            onClick={() => handleOAuth("google")}
            type="button"
          >
            <GoogleIcon />
            Continue with Google
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] uppercase tracking-wide text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email/Password Form */}
        <form className="flex flex-col gap-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="example@mail.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-lg text-sm
text-gray-900 placeholder:text-gray-400 focus:outline-none
focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-full transition duration-300 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            to="/signup"
            className="text-emerald-700 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;