import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import platformService from "../services/platformService";

// ── Types ──────────────────────────────────────────────────
type BudgetType = "fixed" | "hourly";

interface Milestone {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
}

interface HireFormData {
  contractTitle: string;
  budgetType: BudgetType;
  totalAmount: number;
  hourlyRate: number;
  estimatedHours: number;
  deadline: string;
  message: string;
  milestones: Milestone[];
}

// ── Helpers ────────────────────────────────────────────────
const Logo = () => (
  <span className="font-serif text-xl tracking-tight text-gray-900">
    freelance<em className="italic text-teal-600">fluxo</em>
  </span>
);

const PLATFORM_FEE_RATE = 0.05; // 5%

function calcEscrow(form: HireFormData): number {
  if (form.budgetType === "fixed") {
    if (form.milestones.length > 0) {
      const firstMilestone = form.milestones[0];
      return firstMilestone.amount * (1 + PLATFORM_FEE_RATE);
    }
    return form.totalAmount * (1 + PLATFORM_FEE_RATE);
  }
  return form.hourlyRate * form.estimatedHours * (1 + PLATFORM_FEE_RATE);
}

function newMilestone(): Milestone {
  return { id: crypto.randomUUID(), title: "", amount: 0, dueDate: "" };
}

// ── Main Component ─────────────────────────────────────────
export default function HireFreelancerPage() {
  const { freelancerId } = useParams<{ freelancerId: string }>();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("jobId");
  const navigate = useNavigate();

  // ── State ──
  // `currentUser` is intentionally unused directly; localStorage used for auth checks elsewhere
  // keep setter available for future use
  const [, setCurrentUser] = useState<any>(null);
  const [freelancer, setFreelancer] = useState<any>(null);
  const [loadingFreelancer, setLoadingFreelancer] = useState(true);

  // Payment check modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Escrow confirmation modal
  const [showEscrowModal, setShowEscrowModal] = useState(false);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [offerSent, setOfferSent] = useState(false);

  const [form, setForm] = useState<HireFormData>({
    contractTitle: "",
    budgetType: "fixed",
    totalAmount: 0,
    hourlyRate: 0,
    estimatedHours: 0,
    deadline: "",
    message: "",
    milestones: [],
  });

  // ── Load user from localStorage ──
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);

        // ── Check payment method ──
        const hasPayment = !!(parsed.paymentMethod?.cardLast4 || parsed.paymentMethod?.walletBalance > 0);
        if (!hasPayment) {
          setShowPaymentModal(true);
        }
      } else {
        navigate("/login");
      }
    } catch {
      navigate("/login");
    }
  }, [navigate]);

  // ── Load freelancer profile ──
  useEffect(() => {
    if (!freelancerId) return;
    setLoadingFreelancer(true);
    platformService
      .getFreelancerById(freelancerId)
      .then((data: any) => {
        setFreelancer(data);
        // Auto-fill contract title if freelancer has a title
        if (data?.title) {
          setForm(prev => ({
            ...prev,
            contractTitle: `Project with ${data.firstName} ${data.lastName}`,
            hourlyRate: data.hourlyRate || 0,
          }));
        }
      })
      .catch(() => setFreelancer(null))
      .finally(() => setLoadingFreelancer(false));
  }, [freelancerId]);

  // ── Milestone helpers ──
  const addMilestone = () => setForm(prev => ({ ...prev, milestones: [...prev.milestones, newMilestone()] }));
  const removeMilestone = (id: string) =>
    setForm(prev => ({ ...prev, milestones: prev.milestones.filter(m => m.id !== id) }));
  const updateMilestone = (id: string, field: keyof Milestone, value: string | number) =>
    setForm(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => (m.id === id ? { ...m, [field]: value } : m)),
    }));

  // ── Validation ──
  const isFormValid = useCallback((): boolean => {
    if (!form.contractTitle.trim()) return false;
    if (!form.deadline) return false;
    if (!form.message.trim()) return false;
    if (form.budgetType === "fixed") {
      if (form.milestones.length > 0) {
        return form.milestones.every(m => m.title.trim() && m.amount > 0 && m.dueDate);
      }
      return form.totalAmount > 0;
    }
    return form.hourlyRate > 0 && form.estimatedHours > 0;
  }, [form]);

  // ── Submit → open escrow modal ──
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;
    setShowEscrowModal(true);
  };

  // ── Confirm → send offer ──
  const handleConfirmOffer = async () => {
    setIsSendingOffer(true);
    try {
      const payload = {
        freelancerId,
        jobId,
        contractTitle: form.contractTitle,
        budgetType: form.budgetType,
        totalAmount: form.budgetType === "fixed" ? form.totalAmount : form.hourlyRate * form.estimatedHours,
        hourlyRate: form.budgetType === "hourly" ? form.hourlyRate : undefined,
        estimatedHours: form.budgetType === "hourly" ? form.estimatedHours : undefined,
        deadline: form.deadline,
        message: form.message,
        milestones: form.budgetType === "fixed" ? form.milestones : [],
        escrowAmount: calcEscrow(form),
      };

      await platformService.sendHireOffer(payload);
      setShowEscrowModal(false);
      setOfferSent(true);
    } catch (err) {
      console.error("Failed to send offer:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSendingOffer(false);
    }
  };

  const escrowAmount = calcEscrow(form);
  const freelancerName = freelancer
    ? `${freelancer.firstName} ${freelancer.lastName}`
    : "Freelancer";

  // ── Success Screen ──
  if (offerSent) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fffe_0%,_#f7faf9_100%)] flex flex-col items-center justify-center p-6">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100/60 p-10 max-w-md w-full text-center space-y-5">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto border-2 border-teal-200">
            <svg className="w-8 h-8 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Offer Sent!</h2>
            <p className="text-sm text-gray-500 mt-1">
              Your offer has been sent to <strong>{freelancerName}</strong>. They'll receive a notification and email to review and accept.
            </p>
          </div>
          <div className="bg-teal-50 rounded-xl p-4 text-left space-y-1.5 border border-teal-100">
            <div className="flex justify-between text-xs text-gray-600">
              <span>Contract</span>
              <span className="font-semibold text-gray-800 truncate max-w-[180px]">{form.contractTitle}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Escrowed Amount</span>
              <span className="font-bold text-teal-700">${escrowAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-600">
              <span>Status</span>
              <span className="font-semibold text-blue-600">Pending Acceptance</span>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => navigate("/dashboard/client")}
              className="flex-1 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition shadow-sm"
            >
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate("/search")}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
            >
              Browse More
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fffe_0%,_#f7faf9_100%)] font-sans">

      {/* ── Header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-sm border-b border-gray-100/60 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/">
            <Logo />
          </Link>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
            </svg>
            <span className="font-medium text-gray-600">Secure Offer Flow</span>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">

        {/* ── Page Title ── */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Send a Hire Offer
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Set the contract terms. Funds will be held in escrow until work is approved.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── LEFT: Freelancer Card ── */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/60 p-5 shadow-lg sticky top-24 space-y-4">
              {loadingFreelancer ? (
                <div className="animate-pulse space-y-3">
                  <div className="w-14 h-14 bg-gray-200 rounded-xl" />
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              ) : freelancer ? (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border bg-gray-100 shrink-0">
                      {freelancer.profileImage ? (
                        <img src={freelancer.profileImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-gray-400">
                          {freelancer.firstName?.[0]}{freelancer.lastName?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{freelancerName}</p>
                      <p className="text-xs text-teal-600 font-medium">{freelancer.title || "Freelancer"}</p>
                      <p className="text-xs text-gray-400 mt-0.5">${freelancer.hourlyRate || 0}/hr</p>
                    </div>
                  </div>

                  {freelancer.skills?.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {freelancer.skills.slice(0, 6).map((sk: string) => (
                          <span key={sk} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {freelancer.bio && (
                    <p className="text-xs text-gray-500 leading-relaxed line-clamp-4">{freelancer.bio}</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Freelancer not found.</p>
              )}

              {/* Escrow Info Box */}
              {form.budgetType && (form.totalAmount > 0 || (form.hourlyRate > 0 && form.estimatedHours > 0)) && (
                <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Escrow Estimate</p>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Contract Amount</span>
                    <span className="font-semibold">
                      ${form.budgetType === "fixed"
                        ? (form.milestones.length > 0 ? form.milestones[0].amount : form.totalAmount).toFixed(2)
                        : (form.hourlyRate * form.estimatedHours).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Platform Fee (5%)</span>
                    <span>${(escrowAmount - (form.budgetType === "fixed" ? (form.milestones.length > 0 ? form.milestones[0].amount : form.totalAmount) : form.hourlyRate * form.estimatedHours)).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-teal-200 pt-2 flex justify-between">
                    <span className="text-xs font-bold text-gray-700">Total to Escrow</span>
                    <span className="text-sm font-bold text-teal-700">${escrowAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Hire Form ── */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <form onSubmit={handleSubmitForm} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/60 shadow-lg overflow-hidden">

              {/* ── Section 1: Contract Basics ── */}
              <div className="p-6 border-b border-gray-100 space-y-4">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
                  Contract Details
                </h2>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Contract / Job Title</label>
                  <input
                    type="text"
                    required
                    value={form.contractTitle}
                    onChange={e => setForm(prev => ({ ...prev, contractTitle: e.target.value }))}
                    placeholder="e.g. Build a React E-Commerce Dashboard"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2">Budget Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    {(["fixed", "hourly"] as BudgetType[]).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, budgetType: type }))}
                        className={`p-3 rounded-xl border text-left transition ${
                          form.budgetType === type
                            ? "border-teal-500 bg-teal-50 text-teal-700"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            form.budgetType === type ? "border-teal-600" : "border-gray-300"
                          }`}>
                            {form.budgetType === type && <div className="w-1.5 h-1.5 bg-teal-600 rounded-full" />}
                          </div>
                          <span className="text-xs font-bold capitalize">{type === "fixed" ? "Fixed Price" : "Hourly Rate"}</span>
                        </div>
                        <p className="text-[11px] text-gray-400 pl-5">
                          {type === "fixed" ? "Pay a set amount for the whole project" : "Pay by the hour as work progresses"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fixed Price Fields */}
                {form.budgetType === "fixed" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Total Budget (USD)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                        <input
                          type="number"
                          min={1}
                          value={form.totalAmount || ""}
                          onChange={e => setForm(prev => ({ ...prev, totalAmount: Number(e.target.value) }))}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>

                    {/* Milestones */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-semibold text-gray-600">
                          Milestones <span className="text-gray-400 font-normal">(optional — split payments)</span>
                        </label>
                        <button
                          type="button"
                          onClick={addMilestone}
                          className="text-xs text-teal-600 font-semibold hover:text-teal-700 flex items-center gap-1"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                          </svg>
                          Add Milestone
                        </button>
                      </div>

                      {form.milestones.length > 0 && (
                        <div className="space-y-3">
                          {form.milestones.map((m, idx) => (
                            <div key={m.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Milestone {idx + 1}</span>
                                <button type="button" onClick={() => removeMilestone(m.id)} className="text-red-400 hover:text-red-600 text-xs">
                                  Remove
                                </button>
                              </div>
                              <input
                                type="text"
                                placeholder="Milestone title (e.g. Design Mockups)"
                                value={m.title}
                                onChange={e => updateMilestone(m.id, "title", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                  <input
                                    type="number"
                                    min={1}
                                    placeholder="Amount"
                                    value={m.amount || ""}
                                    onChange={e => updateMilestone(m.id, "amount", Number(e.target.value))}
                                    className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                                  />
                                </div>
                                <input
                                  type="date"
                                  value={m.dueDate}
                                  onChange={e => updateMilestone(m.id, "dueDate", e.target.value)}
                                  className="w-full px-2.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                                />
                              </div>
                            </div>
                          ))}
                          <div className="text-right text-xs text-gray-500">
                            Milestones total:{" "}
                            <span className={`font-bold ${
                              form.milestones.reduce((s, m) => s + m.amount, 0) > form.totalAmount
                                ? "text-red-500"
                                : "text-gray-800"
                            }`}>
                              ${form.milestones.reduce((s, m) => s + m.amount, 0).toFixed(2)}
                            </span>
                            {" "}/ ${form.totalAmount.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Hourly Fields */}
                {form.budgetType === "hourly" && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hourly Rate ($/hr)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                        <input
                          type="number"
                          min={1}
                          value={form.hourlyRate || ""}
                          onChange={e => setForm(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                          placeholder="0"
                          className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Estimated Hours</label>
                      <input
                        type="number"
                        min={1}
                        value={form.estimatedHours || ""}
                        onChange={e => setForm(prev => ({ ...prev, estimatedHours: Number(e.target.value) }))}
                        placeholder="0"
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Project Deadline</label>
                  <input
                    type="date"
                    required
                    value={form.deadline}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setForm(prev => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* ── Section 2: Message ── */}
              <div className="p-6 space-y-3">
                <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                  <span className="w-5 h-5 bg-teal-600 text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
                  Message to Freelancer
                </h2>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={e => setForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Describe the project requirements, goals, deliverables, and any specific instructions for the freelancer..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 resize-none leading-relaxed"
                />
                <p className="text-xs text-gray-400">A clear message increases acceptance rate.</p>
              </div>

              {/* ── Action Buttons ── */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                  <svg className="w-4 h-4 text-teal-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                  Funds held securely in escrow until work is approved
                </div>
                <button
                  type="submit"
                  disabled={!isFormValid()}
                  className="px-6 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                >
                  Review & Send Offer →
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* ══════════════════════════════════════════════
          MODAL 1: No Payment Method Found
      ══════════════════════════════════════════════ */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center border border-amber-100 mx-auto">
                <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                </svg>
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-gray-900">Payment Method Required</h3>
                <p className="text-sm text-gray-500 mt-1">
                  Add a card or wallet balance before sending a hire offer. Funds are held securely in escrow until the job is complete.
                </p>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-700 space-y-1">
                <div className="flex items-start gap-2">
                  <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 5a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 5Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" clipRule="evenodd" />
                  </svg>
                  <span>Without a payment method, your offer cannot be funded or sent to the freelancer.</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowPaymentModal(false); navigate(-1); }}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  Go Back
                </button>
                <button
                  onClick={() => { setShowPaymentModal(false); navigate("/settings/payment"); }}
                  className="flex-1 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition"
                >
                  Add Payment Method
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MODAL 2: Escrow Confirmation
      ══════════════════════════════════════════════ */}
      {showEscrowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h3 className="text-base font-bold text-gray-900">Review & Confirm Offer</h3>
              <p className="text-xs text-gray-500">Funds will be moved to escrow when you confirm.</p>
            </div>

            <div className="p-6 space-y-4">
              {/* Summary */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-xs text-gray-500">Sending Offer To</span>
                  <span className="text-xs font-bold text-gray-800">{freelancerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Contract</span>
                  <span className="text-xs font-semibold text-gray-800 max-w-[200px] text-right truncate">{form.contractTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Budget Type</span>
                  <span className="text-xs font-semibold text-gray-800 capitalize">{form.budgetType === "fixed" ? "Fixed Price" : "Hourly Rate"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">Deadline</span>
                  <span className="text-xs font-semibold text-gray-800">{new Date(form.deadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
                </div>

                {form.budgetType === "fixed" && form.milestones.length > 0 && (
                  <div className="pt-1">
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Milestones</p>
                    {form.milestones.map((m, i) => (
                      <div key={m.id} className="flex justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                        <span className="text-gray-500">{i + 1}. {m.title || `Milestone ${i + 1}`}</span>
                        <span className="font-semibold text-gray-700">${m.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escrow Breakdown */}
              <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Escrow Breakdown</p>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>
                    {form.budgetType === "fixed"
                      ? (form.milestones.length > 0 ? "First Milestone" : "Project Total")
                      : `${form.estimatedHours}h × $${form.hourlyRate}/hr`}
                  </span>
                  <span className="font-semibold">
                    ${form.budgetType === "fixed"
                      ? (form.milestones.length > 0 ? form.milestones[0].amount : form.totalAmount).toFixed(2)
                      : (form.hourlyRate * form.estimatedHours).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Platform Fee (5%)</span>
                  <span>${(escrowAmount - (form.budgetType === "fixed" ? (form.milestones.length > 0 ? form.milestones[0].amount : form.totalAmount) : form.hourlyRate * form.estimatedHours)).toFixed(2)}</span>
                </div>
                <div className="border-t border-teal-200 pt-2 flex justify-between">
                  <span className="text-sm font-bold text-gray-800">Total Charged Now</span>
                  <span className="text-base font-bold text-teal-700">${escrowAmount.toFixed(2)}</span>
                </div>
              </div>

              <p className="text-[11px] text-gray-400 leading-relaxed">
                By confirming, you authorize FreelanceFluxo to charge <strong className="text-gray-600">${escrowAmount.toFixed(2)}</strong> to your payment method and hold it in escrow. Funds are released to the freelancer only after you approve the delivered work.
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => setShowEscrowModal(false)}
                  disabled={isSendingOffer}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-200 transition disabled:opacity-50"
                >
                  Edit Offer
                </button>
                <button
                  onClick={handleConfirmOffer}
                  disabled={isSendingOffer}
                  className="flex-1 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSendingOffer ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Sending...
                    </>
                  ) : (
                    "Confirm & Fund Escrow"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}