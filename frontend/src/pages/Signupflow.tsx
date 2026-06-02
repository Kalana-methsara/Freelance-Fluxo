import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import authService from "../services/authService";
import type { RegisterUserPayload } from "../types";

// ─── Types ──────────────────────────────────────────────────────────────

type Role = "client" | "freelancer" | null;

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  receiveEmails: boolean;
  agreeTerms: boolean;
}

// ─── Constants ──────────────────────────────────────────────────────────

const COUNTRIES = [
  "Sri Lanka",
  "United States",
  "United Kingdom",
  "India",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "Singapore",
  "Japan",
  "Netherlands",
  "Sweden",
  "Norway",
  "Denmark",
  "New Zealand",
] as const;

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  country: "Sri Lanka",
  receiveEmails: false,
  agreeTerms: false,
};

// ─── Icons (reused from LoginPage) ─────────────────────────────────────

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

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// ─── Role Card Component (unchanged, but styled to match) ───────────────

interface RoleCardProps {
  icon: string;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}

function RoleCard({ icon, title, description, selected, onSelect }: RoleCardProps) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      tabIndex={0}
      className={`
        flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all
        ${selected
          ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-700/10"
          : "border-gray-200 hover:border-emerald-300 hover:bg-white/80"
        }
      `}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
    >
      <div className={`
        w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors
        ${selected ? "bg-emerald-100/80" : "bg-gray-50"}
      `}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm mb-0.5">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className={`
        w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
        ${selected ? "border-emerald-700 bg-emerald-700" : "border-gray-300"}
      `}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
          <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ─── Reusable OAuth Buttons (same order + styling as LoginPage) ────────

function OAuthButtons() {
  const handleOAuth = (provider: "github" | "google" | "apple") => {
    window.location.href = `${process.env.REACT_APP_API_URL}/auth/${provider}`;
  };

  return (
    <div className="flex flex-col gap-2.5 mb-5">
      <button
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-300 rounded-full font-medium text-sm text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-400"
        onClick={() => handleOAuth("apple")}
        type="button"
      >
        <AppleIcon />
        Continue with Apple
      </button>
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
  );
}

// ─── Main Component ─────────────────────────────────────────────────────

export default function SignupFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [step]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const target = e.target;
    const value =
      target.type === "checkbox"
        ? (target as HTMLInputElement).checked
        : target.value;
    setForm((prev) => ({ ...prev, [target.name]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!form.agreeTerms) return;

  setIsSubmitting(true);
  try {
    const payload: RegisterUserPayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password,
      location: { country: form.country },
    };

    if (role === "client") {
      await authService.registerClient(payload);
    } else {
      await authService.registerFreelancer(payload);
    }

    navigate("/login", {
      state: { message: "Account created! Please sign in." }
    });
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { data?: { message?: string } } })
            .response?.data?.message
        : undefined;
    alert(message || "Registration failed. Please try again.");
  } finally {
    setIsSubmitting(false);
  }
};

  // ── Step 1: Role selection (consistent container with LoginPage) ──────
  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
          {/* Logo */}
          <div className="text-center mb-6 font-serif text-xl font-light tracking-tight text-gray-900">
            freelance<em className="italic text-emerald-700">fluxo</em>
          </div>

          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-5 h-1.5 rounded-full bg-emerald-700 transition-all" />
            <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          </div>

          <h1 className="font-serif text-2xl font-normal text-center tracking-tight text-gray-900 mb-2">
            Welcome to freelancefluxo
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            How will you be using the platform?
          </p>

          <div className="flex flex-col gap-3 mb-6">
            <RoleCard
              icon="💼"
              title="I'm hiring"
              description="Post projects and connect with vetted freelancers"
              selected={role === "client"}
              onSelect={() => setRole("client")}
            />
            <RoleCard
              icon="✦"
              title="I'm freelancing"
              description="Find meaningful work and grow your independent career"
              selected={role === "freelancer"}
              onSelect={() => setRole("freelancer")}
            />
          </div>

          <button
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-full transition duration-300 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={!role}
            onClick={() => role && setStep(2)}
          >
            Continue
          </button>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/login" className="text-emerald-700 font-semibold hover:underline">
              Sign in
            </a>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2: Registration form (consistent styling with LoginPage) ─────
  const isClient = role === "client";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
        {/* Logo */}
        <div className="grid grid-cols-3 items-center mb-5">
          {/* Back Button (Left) */}
          <button
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors w-max"
            onClick={() => setStep(1)}
            type="button"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>

          {/* Logo (Center) */}
          <div className="text-center font-serif text-xl font-light tracking-tight text-gray-900">
            freelance<em className="italic text-emerald-700">fluxo</em>
          </div>

          <div />
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-5">
          <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
          <div className="w-5 h-1.5 rounded-full bg-emerald-700 transition-all" />
        </div>

        {/* Back button */}


        <h1 className="font-serif text-2xl font-normal tracking-tight text-gray-900 mb-1">
          {isClient ? "Hire exceptional talent" : "Find work you love"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isClient
            ? "Create your client account to get started"
            : "Join thousands of freelancers on the platform"}
        </p>

        {/* OAuth Buttons – same order as LoginPage */}
        <OAuthButtons />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-[11px] uppercase tracking-wide text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Email/Password Form */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First name
              </label>
              <input
                ref={firstInputRef}
                name="firstName"
                type="text"
                placeholder="Jane"
                value={form.firstName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
                autoComplete="given-name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last name
              </label>
              <input
                name="lastName"
                type="text"
                placeholder="Smith"
                value={form.lastName}
                onChange={handleChange}
                className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
                autoComplete="family-name"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {isClient ? "Work email" : "Email address"}
            </label>
            <input
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="8 or more characters"
                value={form.password}
                onChange={handleChange}
                className="w-full px-3.5 py-2 pr-10 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
                autoComplete="new-password"
                minLength={8}
                required
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country
            </label>
            <div className="relative">
              <select
                name="country"
                value={form.country}
                onChange={handleChange}
                className="w-full appearance-none px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                name="receiveEmails"
                checked={form.receiveEmails}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700/20"
              />
              <span>
                {isClient
                  ? "Send me tips on finding talent that fits my needs."
                  : "Send me helpful emails about rewarding work and opportunities."}
              </span>
            </label>

            <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                name="agreeTerms"
                checked={form.agreeTerms}
                onChange={handleChange}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700/20"
                required
              />
              <span>
                I agree to the{" "}
                <a href="#tos" className="text-emerald-700 font-medium hover:underline">Terms of Service</a>,{" "}
                <a href="#ua" className="text-emerald-700 font-medium hover:underline">User Agreement</a>, and{" "}
                <a href="#pp" className="text-emerald-700 font-medium hover:underline">Privacy Policy</a>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-full transition duration-300 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed"
            disabled={!form.agreeTerms || isSubmitting}
          >
            {isSubmitting ? "Creating account…" : "Create my account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}