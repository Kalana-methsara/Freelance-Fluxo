
import { memo } from "react";
import StatusBadge from "./Statusbadge";

export type JobCardVariant = "browse" | "active" | "posted" | "compact";

export interface JobCardJob {
  _id: string;
  title: string;
  description?: string;
  budget: number;
  status: string;
  deadline: string;
  skills?: string[];
  proposalCount?: number;
  clientId?: { _id: string; firstName: string; lastName: string; companyName?: string } | string;
  hiredFreelancerId?: { _id: string; firstName: string; lastName: string } | string;
}

interface JobCardProps {
  job: JobCardJob;
  variant?: JobCardVariant;
  /** Called when "Apply" is clicked */
  onApply?: (job: JobCardJob) => void;
  /** Called when "Message" is clicked */
  onMessage?: (job: JobCardJob) => void;
  /** Called when "Submit Work" is clicked */
  onSubmit?: (job: JobCardJob) => void;
  /** Called when the card body itself is clicked */
  onClick?: (job: JobCardJob) => void;
  /** Show proposal count badge (client variant) */
  proposalCount?: number;
}

// ── Helpers ───────────────────────────────────────────────────

function formatDeadline(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return "Overdue";
    if (diff === 0) return "Due today";
    if (diff === 1) return "Due tomorrow";
    if (diff <= 7) return `${diff}d left`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function clientName(clientId: JobCardJob["clientId"]): string {
  if (!clientId || typeof clientId === "string") return "Client";
  return clientId.companyName || `${clientId.firstName} ${clientId.lastName}`;
}

const SKILL_COLORS = [
  "bg-violet-50 text-violet-700",
  "bg-sky-50 text-sky-700",
  "bg-emerald-50 text-emerald-700",
  "bg-amber-50 text-amber-700",
];

// ── Main Component ────────────────────────────────────────────

const JobCard = memo(
  ({ job, variant = "browse", onApply, onMessage, onSubmit, onClick, proposalCount }: JobCardProps) => {
    const isCompact = variant === "compact";
    const deadline = formatDeadline(job.deadline);
    const isOverdue = deadline === "Overdue";

    if (isCompact) {
      return (
        <div
          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer border-b border-gray-100 last:border-0"
          onClick={() => onClick?.(job)}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-900 truncate">{job.title}</p>
            <p className="text-xs text-gray-500 mt-0.5">${job.budget.toLocaleString()} · {deadline}</p>
          </div>
          <div className="flex items-center gap-2 ml-3 shrink-0">
            <StatusBadge status={job.status} size="sm" />
            <svg className="w-4 h-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      );
    }

    return (
      <article
        className="group bg-white border border-gray-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col gap-4"
        onClick={() => onClick?.(job)}
      >
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 group-hover:text-emerald-700 transition-colors leading-snug">
              {job.title}
            </h3>
            <p className="text-xs text-gray-400 mt-1">{clientName(job.clientId)}</p>
          </div>
          <StatusBadge status={job.status} />
        </div>

        {/* Description */}
        {job.description && (
          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{job.description}</p>
        )}

        {/* Skills */}
        {job.skills && job.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 5).map((skill, i) => (
              <span
                key={skill}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${SKILL_COLORS[i % SKILL_COLORS.length]}`}
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-gray-100 text-gray-500">
                +{job.skills.length - 5}
              </span>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-3">
            {/* Budget */}
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33" />
              </svg>
              <span className="text-sm font-bold text-gray-900">${job.budget.toLocaleString()}</span>
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
              </svg>
              <span className={`text-xs font-medium ${isOverdue ? "text-red-500" : "text-gray-500"}`}>
                {deadline}
              </span>
            </div>

            {/* Proposal count badge (client variant) */}
            {(variant === "posted" && proposalCount !== undefined) && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
                <span className="text-xs text-gray-500 font-medium">
                  {proposalCount} proposal{proposalCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {variant === "browse" && (
              <button
                onClick={() => onApply?.(job)}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition active:scale-95"
              >
                Apply now
              </button>
            )}

            {variant === "active" && (
              <>
                <button
                  onClick={() => onMessage?.(job)}
                  className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded-full transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                  </svg>
                  Message
                </button>
                <button
                  onClick={() => onSubmit?.(job)}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-full transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                  </svg>
                  Submit
                </button>
              </>
            )}

            {variant === "posted" && (
              <button className="text-xs text-emerald-700 font-semibold hover:underline">
                View proposals →
              </button>
            )}
          </div>
        </div>
      </article>
    );
  }
);

JobCard.displayName = "JobCard";
export default JobCard;