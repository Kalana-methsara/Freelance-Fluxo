// Shared sub-components used by both LoginPage and SignupFlow.

import { Link } from "react-router-dom";


export function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export function GithubIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.68-.21.68-.48 0-.24-.01-.88-.01-1.72-2.78.6-3.37-1.34-3.37-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.52 2.34 1.08 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.94 0-1.09.39-1.98 1.03-2.68-.1-.25-.45-1.27.1-2.64 0 0 .84-.27 2.75 1.02.8-.22 1.65-.33 2.5-.33.85 0 1.7.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.37.2 2.39.1 2.64.64.7 1.03 1.59 1.03 2.68 0 3.84-2.34 4.69-4.56 4.94.36.31.68.92.68 1.85 0 1.34-.01 2.42-.01 2.75 0 .27.18.58.69.48C19.13 20.17 22 16.42 22 12c0-5.52-4.48-10-10-10z" />
    </svg>
  );
}


export function Logo() {
  return (
    <div className="text-center font-serif text-xl font-light tracking-tight text-gray-900">
      freelance<em className="italic text-emerald-700">fluxo</em>
    </div>
  );
}

export function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] uppercase tracking-wide text-gray-400">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}


interface OAuthButtonsProps {
  disabled?: boolean;
  role?: "client" | "freelancer" | null;
}

export function OAuthButtons({ disabled, role }: OAuthButtonsProps) {
  const handleOAuth = (provider: "github" | "google") => {
    const base = `${import.meta.env.VITE_API_URL}/auth/${provider}`;
    window.location.href = role ? `${base}?role=${role}` : base;
  };

  return (
    <div className="flex flex-col gap-2.5 mb-5">
      {(["github", "google"] as const).map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={disabled}
          onClick={() => handleOAuth(provider)}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-300 rounded-full font-medium text-sm text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-400 disabled:opacity-60"
        >
          {provider === "github" ? <GithubIcon /> : <GoogleIcon />}
          Continue with {provider === "github" ? "GitHub" : "Google"}
        </button>
      ))}
    </div>
  );
}


interface ErrorAlertProps {
  message: string;
  onDismiss: () => void;
}

export function ErrorAlert({ message, onDismiss }: ErrorAlertProps) {
  return (
    <div
      role="alert"
      className="mb-5 rounded-xl px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200 flex items-start gap-2.5 transition-all duration-300"
    >
      <svg className="w-5 h-5 text-red-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="flex-1 font-medium">{message}</span>
      <button
        onClick={onDismiss}
        className="text-red-500 hover:text-red-800 transition-colors font-bold px-1"
        aria-label="Dismiss error"
      >
        ✕
      </button>
    </div>
  );
}


interface PasswordInputProps {
  id: string;
  name: string;
  label: string;
  value: string;
  show: boolean;
  onToggle: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  error?: boolean;
  minLength?: number;
}

export function PasswordInput({
  id,
  name,
  label,
  value,
  show,
  onToggle,
  onChange,
  placeholder = "••••••••",
  autoComplete = "current-password",
  disabled,
  error,
  minLength,
}: PasswordInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          disabled={disabled}
          minLength={minLength}
          required
          className={`w-full px-3.5 py-2 pr-10 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all disabled:opacity-60 ${
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-400/10"
              : "border-gray-300 focus:border-emerald-700 focus:ring-emerald-700/10"
          }`}
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
          onClick={onToggle}
          aria-label={show ? "Hide password" : "Show password"}
          disabled={disabled}
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}


export function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string; error?: string } } };
    return (
      axiosError.response?.data?.message ??
      axiosError.response?.data?.error ??
      "Something went wrong. Please try again."
    );
  }
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}

export function resolveToken(userData: Record<string, unknown>): string | undefined {
  // Handles both `accessToken` (standard) and `token` (legacy backend shape).
  return (userData.accessToken ?? userData.token) as string | undefined;
}


export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans relative">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        {children}
      </div>
    </div>
  );
}


interface AuthFooterProps {
  prompt: string;
  label: string;
  to: string;
}

export function AuthFooter({ prompt, label, to }: AuthFooterProps) {
  return (
    <p className="mt-6 text-center text-sm text-gray-600">
      {prompt}{" "}
      <Link to={to} className="text-emerald-700 font-semibold hover:underline">
        {label}
      </Link>
    </p>
  );
}