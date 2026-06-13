import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import type { RegisterUserPayload } from "../types";

// ─── Types ───────────────────────────────────────────────────────────────────

type Role = "client" | "freelancer" | null;

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  receiveEmails: boolean;
  agreeTerms: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const INITIAL_FORM: FormState = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  receiveEmails: false,
  agreeTerms: false,
};

const ROLES = [
  {
    value: "client" as const,
    icon: "💼",
    title: "I'm hiring",
    description: "Post projects and connect with vetted freelancers",
  },
  {
    value: "freelancer" as const,
    icon: "✦",
    title: "I'm freelancing",
    description: "Find meaningful work and grow your independent career",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message ?? "Registration failed. Please try again.";
  }
  if (error instanceof Error) return error.message;
  return "Registration failed. Please try again.";
}

// ─── Icons ───────────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

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
      className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${
        selected
          ? "border-emerald-700 bg-emerald-50 ring-2 ring-emerald-700/10"
          : "border-gray-200 hover:border-emerald-300 hover:bg-white/80"
      }`}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
    >
      <div className={`w-11 h-11 rounded-lg flex items-center justify-center text-xl shrink-0 transition-colors ${
        selected ? "bg-emerald-100/80" : "bg-gray-50"
      }`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-900 text-sm mb-0.5">{title}</div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
        selected ? "border-emerald-700 bg-emerald-700" : "border-gray-300"
      }`}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" className="text-white">
          <path d="M1 4l2.5 2.5L9 1" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

function StepDots({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      <div className={`rounded-full transition-all ${step === 1 ? "w-5 h-1.5 bg-emerald-700" : "w-1.5 h-1.5 bg-gray-300"}`} />
      <div className={`rounded-full transition-all ${step === 2 ? "w-5 h-1.5 bg-emerald-700" : "w-1.5 h-1.5 bg-gray-300"}`} />
    </div>
  );
}

function OAuthButtons({ role }: { role: Role }) {
  const handleOAuth = (provider: "github" | "google") => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/${provider}?role=${role}`;
  };

  return (
    <div className="flex flex-col gap-2.5 mb-5">
      {(["github", "google"] as const).map((provider) => (
        <button
          key={provider}
          type="button"
          onClick={() => handleOAuth(provider)}
          className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 bg-white border border-gray-300 rounded-full font-medium text-sm text-gray-800 transition-all hover:bg-gray-50 hover:border-gray-400"
        >
          {provider === "github" ? <GithubIcon /> : <GoogleIcon />}
          Continue with {provider === "github" ? "GitHub" : "Google"}
        </button>
      ))}
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 my-5">
      <div className="flex-1 h-px bg-gray-200" />
      <span className="text-[11px] uppercase tracking-wide text-gray-400">or</span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Logo() {
  return (
    <div className="text-center font-serif text-xl font-light tracking-tight text-gray-900">
      freelance<em className="italic text-emerald-700">fluxo</em>
    </div>
  );
}

function PasswordInput({
  name,
  value,
  onChange,
  show,
  onToggle,
  placeholder,
  error,
  label,
  autoComplete,
}: {
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  show: boolean;
  onToggle: () => void;
  placeholder: string;
  error?: boolean;
  label: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={show ? "text" : "password"}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          minLength={name === "password" ? 8 : undefined}
          className={`w-full px-3.5 py-2 pr-10 border rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition-all ${
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
        >
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function SignupFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<Role>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === 2) {
      setTimeout(() => firstInputRef.current?.focus(), 80);
    }
  }, [step]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, value, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.agreeTerms || passwordMismatch) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const payload: RegisterUserPayload = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
      };

      if (role === "client") {
        await authService.registerClient(payload);
      } else {
        await authService.registerFreelancer(payload);
      }

      navigate("/login", { state: { message: "Account created! Please sign in." } });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordMismatch = form.confirmPassword.length > 0 && form.password !== form.confirmPassword;
  const isClient = role === "client";

  // ── Step 1 ────────────────────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8">
          <div className="mb-6"><Logo /></div>
          <StepDots step={1} />

          <h1 className="font-serif text-2xl font-normal text-center tracking-tight text-gray-900 mb-2">
            Welcome to freelancefluxo
          </h1>
          <p className="text-sm text-gray-500 text-center mb-6">
            How will you be using the platform?
          </p>

          <div role="radiogroup" aria-label="Select your role" className="flex flex-col gap-3 mb-6">
            {ROLES.map((r) => (
              <RoleCard
                key={r.value}
                icon={r.icon}
                title={r.title}
                description={r.description}
                selected={role === r.value}
                onSelect={() => setRole(r.value)}
              />
            ))}
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
            <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-xl p-8">

        {/* Header */}
        <div className="grid grid-cols-3 items-center mb-5">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors w-max"
            onClick={() => setStep(1)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back
          </button>
          <Logo />
          <div />
        </div>

        <StepDots step={2} />

        <h1 className="font-serif text-2xl font-normal tracking-tight text-gray-900 mb-1">
          {isClient ? "Hire exceptional talent" : "Find work you love"}
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {isClient
            ? "Create your client account to get started"
            : "Join thousands of freelancers on the platform"}
        </p>

        <OAuthButtons role={role} />
        <Divider />

        {/* Error alert */}
        {error && (
          <div role="alert" className="mb-5 rounded-xl px-4 py-3 text-sm bg-red-50 text-red-800 border border-red-200 flex items-start gap-2.5">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="flex-1 font-medium">{error}</span>
            <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 transition-colors font-bold px-1" aria-label="Dismiss error">
              ✕
            </button>
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>

          {/* Name */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: "firstName", label: "First name", placeholder: "Jane", autoComplete: "given-name", ref: firstInputRef },
              { name: "lastName",  label: "Last name",  placeholder: "Smith", autoComplete: "family-name" },
            ].map(({ name, label, placeholder, autoComplete, ref }) => (
              <div key={name}>
                <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                <input
                  id={name}
                  ref={ref}
                  name={name}
                  type="text"
                  placeholder={placeholder}
                  value={form[name as keyof FormState] as string}
                  onChange={handleChange}
                  autoComplete={autoComplete}
                  required
                  className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
                />
              </div>
            ))}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              {isClient ? "Work email" : "Email address"}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
              className="w-full px-3.5 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/10 transition-all"
            />
          </div>

          {/* Passwords */}
          <PasswordInput
            name="password"
            label="Password"
            placeholder="8 or more characters"
            value={form.password}
            onChange={handleChange}
            show={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
            autoComplete="new-password"
          />
          <div>
            <PasswordInput
              name="confirmPassword"
              label="Confirm password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword((v) => !v)}
              autoComplete="new-password"
              error={passwordMismatch}
            />
            {passwordMismatch && (
              <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Checkboxes */}
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
                required
                className="mt-0.5 w-4 h-4 rounded border-gray-300 text-emerald-700 focus:ring-emerald-700/20"
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="text-emerald-700 font-medium hover:underline">Terms of Service</Link>,{" "}
                <Link to="/user-agreement" className="text-emerald-700 font-medium hover:underline">User Agreement</Link>, and{" "}
                <Link to="/privacy" className="text-emerald-700 font-medium hover:underline">Privacy Policy</Link>.
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={!form.agreeTerms || isSubmitting || passwordMismatch}
            className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 rounded-full transition duration-300 active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Creating account…" : "Create my account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-700 font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}