import { useEffect, useState } from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import jobService from "../services/jobService";

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  status: string;
  skills?: string[];
  clientId: {
    _id?: string;
    firstName: string;
    lastName: string;
    companyName?: string;
    email?: string;
  };
}

// ─── Status pill ──────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    active:      "bg-green-100 text-green-700 ring-green-600/20",
    open:        "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
    in_progress: "bg-blue-100 text-blue-700 ring-blue-600/20",
    completed:   "bg-purple-100 text-purple-700 ring-purple-600/20",
    closed:      "bg-gray-100 text-gray-500 ring-gray-400/20",
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${map[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 ring-gray-400/20"}`}>
      {status?.replace("_", " ")}
    </span>
  );
};

// ─── Single Job Detail View ───────────────────────────────────────────────────
const JobDetailView = ({ jobId, applyOpen = false }: { jobId: string; applyOpen?: boolean }) => {
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply modal state
  const [showApply, setShowApply] = useState(applyOpen);
  const [bid, setBid] = useState("");
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  useEffect(() => {
    setLoading(true);
    jobService
      .getJob(jobId)
      .then((res: Job) => setJob(res))
      .catch(() => setError("Could not load this job. It may have been removed."))
      .finally(() => setLoading(false));
  }, [jobId]);

  const handleApplySubmit = async () => {
    if (!bid || isNaN(Number(bid)) || Number(bid) <= 0) {
      setApplyError("Please enter a valid bid amount.");
      return;
    }
    setApplying(true);
    setApplyError(null);
    try {
      await jobService.applyToJob(jobId, Number(bid), coverLetter.trim() || undefined);
      setApplySuccess(true);
    } catch (err: any) {
      setApplyError(err?.response?.data?.message || "Failed to submit proposal. Please try again.");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Loading job details…</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-red-200 p-10 text-center max-w-md">
          <p className="text-red-600 font-medium mb-4">{error || "Job not found."}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const clientName = job.clientId?.companyName
    || `${job.clientId?.firstName || ""} ${job.clientId?.lastName || ""}`.trim()
    || "Anonymous";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 transition"
          >
            <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <Link to="/" className="font-serif text-lg tracking-tight text-gray-900">
            freelance<em className="italic text-emerald-600">fluxo</em>
          </Link>
        </div>
      </header>

      <main className="pt-24 pb-16 px-4 sm:px-6 max-w-4xl mx-auto space-y-6">

        {/* Top Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <StatusPill status={job.status} />
                {job.category && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-medium">
                    {job.category}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{job.title}</h1>
              <p className="text-sm text-gray-500 mt-2">
                Posted by <span className="font-medium text-gray-700">{clientName}</span>
              </p>
            </div>
            <div className="sm:text-right shrink-0">
              <p className="text-3xl font-bold text-emerald-600">${job.budget}</p>
              <p className="text-xs text-gray-400 mt-1">Budget</p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Deadline</p>
            <p className="text-sm font-semibold text-gray-800">
              {job.deadline ? new Date(job.deadline).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "—"}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Budget</p>
            <p className="text-sm font-semibold text-emerald-600">${job.budget}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Status</p>
            <StatusPill status={job.status} />
          </div>
        </div>

        {/* Description */}
        {job.description && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Job Description</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line text-sm">{job.description}</p>
          </div>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Skills Required</h2>
            <div className="flex flex-wrap gap-2">
              {job.skills.map((s) => (
                <span key={s} className="text-xs bg-gray-50 border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg font-medium shadow-sm">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Client Info */}
        {job.clientId && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">About the Client</h2>
            <p className="text-sm font-semibold text-gray-800">{clientName}</p>
            {job.clientId.email && (
              <p className="text-xs text-gray-400 mt-1">{job.clientId.email}</p>
            )}
          </div>
        )}

        {/* Apply Button */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-800">Ready to apply?</p>
            <p className="text-xs text-gray-400 mt-0.5">Submit your proposal for this job.</p>
          </div>
          <button
            onClick={() => { setShowApply(true); setApplySuccess(false); setApplyError(null); }}
            className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-600/20 transition text-center"
          >
            Apply Now
          </button>
        </div>

      </main>

      {/* ── Apply Modal ── */}
      {showApply && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg p-6 sm:p-8 relative">
            {/* Close */}
            <button
              onClick={() => { setShowApply(false); if (applyOpen) navigate(-1); }}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {applySuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                  <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-emerald-600">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Proposal Submitted!</h3>
                <p className="text-sm text-gray-500 mb-6">The client will review your proposal and get back to you.</p>
                <button
                  onClick={() => { setShowApply(false); navigate(-1); }}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
                >
                  Done
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Submit Proposal</h3>
                <p className="text-xs text-gray-400 mb-6">
                  Applying for: <span className="text-gray-600 font-medium">{job?.title}</span>
                </p>

                {/* Bid */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Your Bid (USD) <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">$</span>
                    <input
                      type="number"
                      min={1}
                      value={bid}
                      onChange={(e) => setBid(e.target.value)}
                      placeholder={job?.budget ? String(job.budget) : "0"}
                      className="w-full pl-7 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition"
                    />
                  </div>
                  {job?.budget && (
                    <p className="text-[11px] text-gray-400 mt-1">Client budget: ${job.budget}</p>
                  )}
                </div>

                {/* Cover Letter */}
                <div className="mb-5">
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                    Cover Letter <span className="text-gray-300">(optional)</span>
                  </label>
                  <textarea
                    rows={5}
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Briefly describe your experience, approach, and why you're a great fit…"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 transition resize-none"
                  />
                </div>

                {applyError && (
                  <p className="text-xs text-red-500 mb-4 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{applyError}</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowApply(false); if (applyOpen) navigate(-1); }}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplySubmit}
                    disabled={applying}
                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                  >
                    {applying && (
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    {applying ? "Submitting…" : "Submit Proposal"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const JobsPage = () => {
  const { jobId } = useParams<{ jobId?: string }>();
  const { pathname } = useLocation();

  // /jobs/:jobId — show single job (modal open if path ends with /apply)
  if (jobId) {
    return <JobDetailView jobId={jobId} applyOpen={pathname.endsWith("/apply")} />;
  }

  // /jobs — should not be reached normally, redirect info
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-md">
        <p className="text-gray-500 text-sm mb-4">Browse available jobs from the search page.</p>
        <Link
          to="/search"
          className="inline-block px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition"
        >
          Go to Search
        </Link>
      </div>
    </div>
  );
};

export default JobsPage;