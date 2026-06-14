import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import type { RegisterUserPayload } from "../types";
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
      <AuthCard>
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

        <AuthFooter prompt="Already have an account?" label="Sign in" to="/login" />
      </AuthCard>
    );
  }

  // ── Step 2 ────────────────────────────────────────────────────────────────

  return (
    <AuthCard>
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

      {error && <ErrorAlert message={error} onDismiss={() => setError(null)} />}

      <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          {(
            [
              { name: "firstName", label: "First name", placeholder: "Jane", autoComplete: "given-name", isFirst: true },
              { name: "lastName",  label: "Last name",  placeholder: "Smith", autoComplete: "family-name", isFirst: false },
            ] as const
          ).map(({ name, label, placeholder, autoComplete, isFirst }) => (
            <div key={name}>
              <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input
                id={name}
                ref={isFirst ? firstInputRef : undefined}
                name={name}
                type="text"
                placeholder={placeholder}
                value={form[name]}
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
          id="password"
          name="password"
          label="Password"
          placeholder="8 or more characters"
          value={form.password}
          onChange={handleChange}
          show={showPassword}
          onToggle={() => setShowPassword((v) => !v)}
          autoComplete="new-password"
          minLength={8}
        />
        <div>
          <PasswordInput
            id="confirmPassword"
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

      <AuthFooter prompt="Already have an account?" label="Sign in" to="/login" />
    </AuthCard>
  );
}