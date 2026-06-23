// ============================================================
// FreelancerPlatform.tsx – Fully Refactored & Improved
// ============================================================

import React, {
  useEffect, useLayoutEffect, useRef, useState, useCallback, memo,
} from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import platformService from '../services/platformService';
import dashboardService from '../services/dashboardService';
import jobService from '../services/jobService';
import chatService from '../services/chatService';
import ChatConversationList from '../components/ChatConversationList';
import ChatRoom from '../components/ChatRoom';
import { formatDate, getInitials } from '../utils/auth';
import TechStack from '../components/Skills';
import Slide from '../components/Slide';
import CatCard from '../components/CatCard';
import { cards, items } from '../../data';
import api from '../services/api';
import { MapPin, Code2, DollarSign, Award, Clock } from "lucide-react";

// ============================================================
// 1. TYPES & INTERFACES
// ============================================================

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  title?: string;
  hourlyRate?: number;
  bio?: string;
  skills?: string[];
  profileImage?: string;
  companyName?: string;
  rating?: number;
  reviewCount?: number;
  location?: {
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    coordinates?: { lat: number; lng: number };
  };
}

interface PendingProposalPayload {
  jobId: string;
  payload: { bid: number; coverLetter: string };
}

interface Job {
  _id: string;
  title: string;
  budget: number;
  status: string;
  deadline: string;
  description?: string;
  clientId: { _id: string; firstName: string; companyName?: string };
}

interface Proposal {
  _id: string;
  jobId: { _id: string; title: string };
  bid: number;
  status: string;
}

interface Transaction {
  _id: string;
  jobTitle: string;
  amount: number;
  status: string;
  createdAt: string;
}

interface DashboardData {
  user: User;
  stats: {
    totalEarnings: number;
    activeJobs: number;
    openProposals: number;
    profileViews: number;
  };
  activeJobs: Job[];
  proposals: Proposal[];
  earnings: { month: string; amount: number }[];
  transactions: Transaction[];
}

// ============================================================
// 2. CONSTANTS
// ============================================================

const HOW_IT_WORKS = [
  { n: '1', title: 'Post your job', desc: 'Tell us about your project requirements, timeline, and budget in just a few minutes.' },
  { n: '2', title: 'Browse proposals', desc: 'Review profiles and proposals from top-rated freelancers who match your needs.' },
  { n: '3', title: 'Hire & collaborate', desc: 'Work securely with built-in tools for messaging, payments, and progress tracking.' },
];

const NAV_LINKS = [
  { label: 'Overview', id: 'overview' },
  { label: 'My Jobs', id: 'jobs' },
  { label: 'Proposals', id: 'proposals' },
  { label: 'Earnings', id: 'earnings' },
  { label: 'Messages', id: 'messages' },
  { label: 'Profile', id: 'profile' },
];
const SKILL_POOL = {
  "Development": ["React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "Spring Boot", "Express", "MongoDB", "PostgreSQL", "Next.js", "Docker"],
  "Design & Creative": ["UI/UX Design", "Figma", "Adobe Photoshop", "Illustrator", "Web Design", "Graphic Design"],
  "Writing & Translation": ["Content Writing", "Technical Writing", "Copywriting", "Translation", "SEO Writing"],
  "Marketing & Sales": ["SEO", "Digital Marketing", "Social Media Management", "Google Analytics", "Lead Generation"]
};

const POPULAR_TAGS = ['Web Design', 'React Developer', 'UI/UX Design', 'Node.js', 'WordPress'];
const AVATAR_COLORS = ['#14a800', '#7c3aed', '#dc2626', '#d97706', '#0891b2'];

const STATUS_STYLES: Record<string, string> = {
  in_progress: 'bg-blue-50 text-blue-700',
  under_review: 'bg-amber-50 text-amber-700',
  completed: 'bg-green-50 text-green-700',
  pending: 'bg-gray-100 text-gray-600',
  shortlisted: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  open: 'bg-blue-50 text-blue-700',
};

// ============================================================
// 3. UTILITY FUNCTIONS
// ============================================================

function avatarColor(id: string): string {
  if (!id) return AVATAR_COLORS[0];
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// renderStars removed (unused)

// ============================================================
// 4. PRESENTATIONAL COMPONENTS (memoized)
// ============================================================

const Logo = memo(() => (
  <span className="text-xl sm:text-2xl font-bold tracking-tight">
    <span className="text-green-600">freelance</span>
    <span className="text-gray-900">fluxo</span>
  </span>
));

const SectionBadge = memo(({ label }: { label: string }) => (
  <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
    {label}
  </div>
));

const StatusBadge = memo(({ status }: { status: string }) => (
  <span
    className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
      STATUS_STYLES[status] || 'bg-gray-100 text-gray-600'
    }`}
  >
    {status ? status.replace('_', ' ') : ''}
  </span>
));

// ============================================================
// 5. ENHANCED DASHBOARD COMPONENTS (memoized)
// ============================================================

// ── Icons (inline SVGs) ──
const Icons = {
  Earnings: () => (
    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Jobs: () => (
    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  Proposals: () => (
    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Views: () => (
    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Message: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
  Submit: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <line x1="18" y1="6" x2="6" y2="18" strokeWidth={2} strokeLinecap="round" />
      <line x1="6" y1="6" x2="18" y2="18" strokeWidth={2} strokeLinecap="round" />
    </svg>
  ),
  Chevron: () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 18l6-6-6-6" />
    </svg>
  ),
};

// ── Enhanced Stat Card ──
const EnhancedStatCard = memo(({ label, value, icon: Icon, sub, trend }: { label: string; value: string; icon: React.ElementType; sub?: string; trend?: 'up' | 'down' }) => (
  <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center justify-between">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
      <div className="p-2 bg-gray-50 rounded-lg">{<Icon />}</div>
    </div>
    <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
    {(sub || trend) && (
      <div className="flex items-center gap-2 mt-1">
        {trend && (
          <span className={`text-xs font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </span>
        )}
        {sub && <span className="text-xs text-gray-500">{sub}</span>}
      </div>
    )}
  </div>
));

// ── Empty state ──
const EmptyState = memo(({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) => (
  <div className="text-center py-12 px-4">
    <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
    <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
));

// ── Job card ──
const JobCard = memo(({ job, onMessage, onSubmit, onView }: { job: Job; onMessage: (clientId: string, jobId: string) => void; onSubmit: (jobId: string) => void; onView: (job: Job) => void }) => (
  <div
    className="group px-5 py-4 hover:bg-gray-50/70 transition-colors duration-150 border-b border-gray-100 last:border-0 cursor-pointer"
    onClick={() => onView(job)}
  >
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-green-700 transition">{job.title}</h4>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-0.5">
          <span className="text-xs text-gray-500">
            {job.clientId?.companyName || job.clientId?.firstName}
          </span>
          <span className="text-xs text-gray-400">·</span>
          <span className="text-xs text-gray-500">Due {formatDate(job.deadline)}</span>
        </div>
      </div>
      <div className="flex items-center gap-3 self-end sm:self-center flex-shrink-0">
        <span className="text-sm font-bold text-gray-800">${job.budget}</span>
        <StatusBadge status={job.status} />
        <Icons.Chevron />
      </div>
    </div>
    {job.status === 'in_progress' && (
      <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-gray-100/80">
        <button
          onClick={(e) => { e.stopPropagation(); onSubmit(job._id); }}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
        >
          <Icons.Submit />
          Submit work
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onMessage(job.clientId._id, job._id); }}
          className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
        >
          <Icons.Message />
          Message client
        </button>
      </div>
    )}
    {job.status === 'open' && (
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100/80">
        <span className="text-xs font-medium text-green-700">Open to apply — click to view & submit a proposal</span>
      </div>
    )}
  </div>
));

// ── Proposals item ──
const ProposalItem = memo(({ proposal, onWithdraw }: { proposal: Proposal; onWithdraw: (id: string) => void }) => (
  <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/40 transition-colors border-b border-gray-100 last:border-0">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-semibold text-gray-900 truncate">{proposal.jobId?.title || 'Job Application'}</p>
      <p className="text-xs text-gray-500 mt-0.5">Bid Amount: ${proposal.bid}</p>
    </div>
    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
      <StatusBadge status={proposal.status} />
      {proposal.status === 'pending' && (
        <button
          onClick={() => onWithdraw(proposal._id)}
          className="text-xs font-medium text-red-500 hover:text-red-700 hover:underline transition"
        >
          Withdraw
        </button>
      )}
    </div>
  </div>
));

// ============================================================
// 6. WORK SUBMISSION MODAL
// ============================================================

interface WorkSubmissionModalProps {
  jobId: string;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

function WorkSubmissionModal({ jobId, onClose, onSuccess, onError }: WorkSubmissionModalProps) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      onError('Please attach a file.');
      return;
    }
    if (!description.trim()) {
      onError('Please provide a description.');
      return;
    }
    setSubmitting(true);
    const formData = new FormData();
    formData.append('description', description);
    formData.append('file', file);
    try {
      await jobService.submitWork(jobId, formData);
      onSuccess();
      onClose();
    } catch (err) {
      onError('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Submit Work</h2>
        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-3 py-2 mb-3 outline-hidden focus:border-green-600"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
          <label className="block text-sm font-medium mb-1 text-gray-700">Attachment</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="mb-4 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? 'Uploading...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 6b. JOB DETAIL DRAWER (view job + apply with a proposal)
// ============================================================

interface JobDetailDrawerProps {
  job: Job | null;
  onClose: () => void;
  onMessage: (clientId: string, jobId: string) => void;
  onSubmitWork: (jobId: string) => void;
  onApply: (jobId: string, payload: { bid: number; coverLetter: string }) => Promise<void>;
}

function JobDetailDrawer({ job, onClose, onMessage, onSubmitWork, onApply }: JobDetailDrawerProps) {
  const [applyOpen, setApplyOpen] = useState(false);
  const [bid, setBid] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Reset the inline apply form whenever a different job is opened
  useEffect(() => {
    setApplyOpen(false);
    setBid('');
    setCoverLetter('');
  }, [job?._id]);

  if (!job) return null;

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const bidNumber = Number(bid);
    if (!bidNumber || bidNumber <= 0) return;
    setSubmitting(true);
    try {
      await onApply(job._id, { bid: bidNumber, coverLetter: coverLetter.trim() });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-200 shadow-2xl">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-1">Job Details</p>
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
          >
            <Icons.Close />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <StatusBadge status={job.status} />
            <span className="text-xs text-gray-500">
              Posted by {job.clientId?.companyName || job.clientId?.firstName || 'Client'}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Budget</p>
              <p className="text-sm font-medium text-gray-800">${job.budget}</p>
            </div>
            <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
              <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-1.5">Deadline</p>
              <p className="text-sm font-medium text-gray-800">{formatDate(job.deadline)}</p>
            </div>
          </div>

          {job.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Description</p>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{job.description}</p>
              </div>
            </div>
          )}

          {/* Already-assigned job: submit work / message client */}
          {job.status === 'in_progress' && (
            <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => { onSubmitWork(job._id); onClose(); }}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-green-50 text-green-700 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
              >
                <Icons.Submit />
                Submit work
              </button>
              <button
                onClick={() => onMessage(job.clientId._id, job._id)}
                className="inline-flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full hover:bg-blue-100 transition-colors"
              >
                <Icons.Message />
                Message client
              </button>
            </div>
          )}

          {/* Open job: apply with a proposal */}
          {job.status === 'open' && (
            <div className="pt-2 border-t border-gray-100">
              {!applyOpen ? (
                <button
                  onClick={() => setApplyOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition"
                >
                  Apply to this job
                </button>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Your bid ($)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      value={bid}
                      onChange={(e) => setBid(e.target.value)}
                      placeholder={`e.g. ${job.budget}`}
                      className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Cover letter (optional)</label>
                    <textarea
                      rows={4}
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                      placeholder="Briefly explain why you're a good fit for this job…"
                      className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                    >
                      {submitting ? 'Submitting…' : 'Submit proposal'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setApplyOpen(false)}
                      className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// 7. PROFILE EDITOR (FULLY SYNCED WITH SEARCHPAGE LOGIC)
// ============================================================
interface ProfileEditorProps {
  user: User;
  onSave: (data: Partial<User>) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}

function ProfileEditor({ user, onSave, onCancel, onError }: ProfileEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [customSkill, setCustomSkill] = useState('');
  
  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    profileImage: user?.profileImage || '',
    title: user?.title || '',
    hourlyRate: user?.hourlyRate || 0,
    bio: user?.bio || '',
    companyName: user?.companyName || '',
    address: user?.location?.address || '',
    city: user?.location?.city || '',
    province: user?.location?.province || '',
    country: user?.location?.country || '',
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>(user?.skills || []);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleAddCustomSkill = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && customSkill.trim()) {
      e.preventDefault();
      if (!selectedSkills.includes(customSkill.trim())) {
        setSelectedSkills([...selectedSkills, customSkill.trim()]);
      }
      setCustomSkill("");
    }
  };

  // ── 📸 Laptop එකෙන් Image එක අරන් Cloudinary යවන තැන (SearchPage logic synced) ──
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file); // ✅ SearchPage එකේ වගේම 'image' කියා යෙදිය යුතුයි

    setIsUploadingImage(true);
    try {
      const res = await api.post("/upload/upload-avatar", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      if (res.data && res.data.url) {
        // Form එකට සෙට් කරනවා
        setForm((f) => ({ ...f, profileImage: res.data.url }));
        
        // ක්ෂණිකව Local Storage එකත් Update කරනවා Navbar එකට යන්න
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.profileImage = res.data.url;
          localStorage.setItem("user", JSON.stringify(parsed));
        }
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      onError("Failed to upload image to Cloudinary.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      onError('First and last name are required.');
      return;
    }
    if (selectedSkills.length === 0) {
      onError('Please select at least one skill!');
      return;
    }

    onSave({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      profileImage: form.profileImage,
      title: form.title.trim(),
      hourlyRate: Number(form.hourlyRate),
      bio: form.bio,
      companyName: form.companyName.trim(),
      skills: selectedSkills,
      location: {
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
        coordinates: user?.location?.coordinates || { lat: 6.0329, lng: 80.2170 }
      },
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl overflow-hidden max-w-3xl mx-auto">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 text-white">
        <h3 className="text-lg font-semibold">Complete Your Full Profile Details</h3>
        <p className="text-xs text-emerald-100 mt-0.5">Please fill in the required fields to get verified and apply for jobs.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Avatar Upload Sector */}
        <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            {form.profileImage ? (
              <img src={form.profileImage} alt="Avatar" className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm" />
            ) : (
              <div className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold text-white shadow-sm" style={{ backgroundColor: '#059669' }}>
                {form.firstName ? form.firstName[0].toUpperCase() : 'U'}
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
              <span className="text-[10px] text-white font-medium">Change</span>
            </div>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploadingImage} className="px-3 py-1.5 bg-white border border-gray-200 text-xs font-semibold rounded-lg shadow-xs hover:bg-gray-50 text-gray-700 transition">
              {isUploadingImage ? "Uploading to Cloudinary..." : "Upload Profile Picture"}
            </button>
            <p className="text-[11px] text-gray-400 mt-1">Supported formats: JPG, PNG. Max 2MB.</p>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">First Name *</label>
            <input type="text" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name *</label>
            <input type="text" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
          </div>
        </div>

        {/* Title & Hourly Rate */}
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-600 mb-1">Professional Title *</label>
            <input type="text" required placeholder="e.g. Full Stack Developer / Content Writer" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Hourly Rate ($) *</label>
            <input type="number" required min="1" value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
          </div>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Professional Bio *</label>
          <textarea rows={4} required placeholder="Describe your experience, skills, and what you can bring to clients..." value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
        </div>

        {/* Skills Sector (Categorized Pool) */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1">Skills & Expertise * (Select at least one)</label>
          <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100 max-h-48 overflow-y-auto">
            {Object.entries(SKILL_POOL).map(([category, skills]) => (
              <div key={category} className="space-y-1.5">
                <p className="text-[10px] uppercase tracking-wider font-bold text-gray-400">{category}</p>
                <div className="flex flex-wrap gap-1.5">
                  {skills.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${isSelected ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                        {skill} {isSelected ? "✓" : "+"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Custom Skills input */}
          <div className="mt-2">
            <input type="text" placeholder="Add custom skill and press Enter..." value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={handleAddCustomSkill} className="w-full px-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-hidden focus:border-emerald-500" />
          </div>
        </div>

        {/* Location Fields */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Location Details *</p>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
            <input type="text" required value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
              <input type="text" required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Province/State</label>
              <input type="text" required value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
              <input type="text" required value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-hidden focus:border-emerald-500" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">
            Cancel
          </button>
          <button type="submit" disabled={isUploadingImage} className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition disabled:opacity-50">
            Save Profile & Apply
          </button>
        </div>
      </form>
    </div>
  );
}

function ProfileCompletionModal({
  user,
  onSave,
  onCancel,
  onError,
}: {
  user: User;
  onSave: (data: Partial<User>) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}) {
  const [form, setForm] = useState({
    title: user?.title || '',
    hourlyRate: user?.hourlyRate || 0,
    bio: user?.bio || '',
    skills: (user?.skills || []).join(', '),
    address: user?.location?.address || '',
    city: user?.location?.city || '',
    province: user?.location?.province || '',
    country: user?.location?.country || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.hourlyRate < 0) {
      onError('Hourly rate cannot be negative.');
      return;
    }
    if (!form.title.trim()) {
      onError('Please add a title to your profile.');
      return;
    }
    if (!form.skills.trim()) {
      onError('Please add at least one skill to your profile.');
      return;
    }
    if (!form.address.trim() || !form.city.trim() || !form.province.trim() || !form.country.trim()) {
      onError('Please complete your profile location.');
      return;
    }

    onSave({
      title: form.title.trim(),
      hourlyRate: form.hourlyRate,
      bio: form.bio,
      skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      location: {
        address: form.address.trim(),
        city: form.city.trim(),
        province: form.province.trim(),
        country: form.country.trim(),
      },
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="relative w-full max-w-2xl overflow-y-auto max-h-[90vh] bg-white rounded-3xl border border-gray-200 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Complete your freelancer profile</h2>
            <p className="text-sm text-gray-500 mt-1">Update your profile now to finish your proposal submission.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Hourly Rate</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.hourlyRate}
                onChange={(e) => setForm({ ...form, hourlyRate: Number(e.target.value) })}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Skills</label>
            <input
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
              placeholder="React, Node, UI/UX"
              className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Address</label>
              <input
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">City</label>
              <input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Province</label>
              <input
                value={form.province}
                onChange={(e) => setForm({ ...form, province: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
                className="w-full border rounded-md px-3 py-2 mt-1 focus:border-green-600 outline-hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end sm:items-center pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
            >
              Save and apply
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// 8. MAIN COMPONENT
// ============================================================

type ToastMessage = { type: 'success' | 'error'; text: string } | null;

export default function FreelancerDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // const [freelancers, setFreelancers] = useState<any[]>([]); // unused
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Desktop nav: sliding active-pill indicator
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [navIndicator, setNavIndicator] = useState<{ left: number; width: number; ready: boolean }>({
    left: 0,
    width: 0,
    ready: false,
  });

  // Dashboard state
  const [activeNav, setActiveNav] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // UI state
  const [editingProfile, setEditingProfile] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [pendingProposal, setPendingProposal] = useState<PendingProposalPayload | null>(null);
  const [showWorkModal, setShowWorkModal] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [toast, setToast] = useState<ToastMessage>(null);

  // Chat state
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  // ============================================================
  // 8a. Toast helper
  // ============================================================
  const showToast = useCallback((type: 'success' | 'error', text: string) => {
    setToast({ type, text });
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, []);

  // ============================================================
  // 8b. Fetch dashboard data
  // ============================================================
  const fetchDashboardData = useCallback(() => {
    setLoadingDashboard(true);
    dashboardService
      .getFreelancerDashboard()
      .then((data) => {
        setDashboardData(data);
        setLoadingDashboard(false);
      })
      .catch(() => {
        setDashboardData(null);
        setLoadingDashboard(false);
        showToast('error', 'Failed to load dashboard.');
      });
  }, [showToast]);

  // ============================================================
  // 8c. Effects
  // ============================================================
  useEffect(() => {
    // optionally fetch freelancers for future features; ignore result for now
    platformService.getFreelancers().catch(() => {});
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Measure the active desktop nav link so the indicator can glide to it
  useLayoutEffect(() => {
    const el = navRefs.current[activeNav];
    if (el) {
      setNavIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    }
  }, [activeNav, loadingDashboard]);

  useEffect(() => {
    const handleResize = () => {
      const el = navRefs.current[activeNav];
      if (el) setNavIndicator({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeNav]);

  // Live chat connection
  useEffect(() => {
    if (dashboardData?.user?._id) {
      const token = localStorage.getItem('token') || '';
      chatService.connect(dashboardData.user._id, token);
      return () => {
        chatService.disconnect();
      };
    }
  }, [dashboardData?.user?._id]);

  // ============================================================
  // 8d. Event handlers
  // ============================================================
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim()) {
      navigate('/search');
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  }, [searchQuery, navigate]);

  const toggleVideoPlayback = useCallback(() => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  }, [isVideoPlaying]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const isProfileComplete = useCallback((user?: User | null) => {
    if (!user) return false;
    return Boolean(
      user.title?.trim() &&
      user.skills?.length &&
      user.hourlyRate &&
      user.hourlyRate > 0 &&
      user.location?.address?.trim() &&
      user.location?.city?.trim() &&
      user.location?.province?.trim() &&
      user.location?.country?.trim()
    );
  }, []);

  const handleSaveProfile = async (updatedFields: Partial<User>) => {
  try {
    // 1. Backend එකට update එක යැවීම
    const responseData = await platformService.updateProfile(updatedFields);
    
    // 2. දැනට ඉන්න currentUser (or state user) සමඟ Response එක merge කිරීම
    const fullUpdatedUser = {
      ...user,
      ...responseData,
      ...updatedFields,
    };

    // 3. Local Storage එක update කිරීම (Header/Navbar sync වෙන්න)
    localStorage.setItem('user', JSON.stringify(fullUpdatedUser));
    
    // 4. Dashboard data state එක update කිරීම (Banner එක අයින් වෙන්න සහ UI refresh වෙන්න)
    setDashboardData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        user: fullUpdatedUser,
      };
    });

    setEditingProfile(false);
    showToast('success', 'Profile updated successfully!');
  } catch (error) {
    console.error('Profile update failed:', error);
    showToast('error', 'Something went wrong while updating your profile.');
  }
};

  const handleSaveProfileAndApply = useCallback(
    async (updated: Partial<User>) => {
      if (!dashboardData?.user?._id || !pendingProposal) return;
      try {
        await jobService.updateFreelancerProfile(dashboardData.user._id, updated);
        await fetchDashboardData();
        setShowProfileModal(false);

        const { jobId, payload } = pendingProposal;
        await jobService.submitProposal(jobId, payload);
        setPendingProposal(null);
        setSelectedJob(null);
        setActiveNav('proposals');
        await fetchDashboardData();
        showToast('success', 'Profile updated and proposal submitted.');
      } catch (err) {
        showToast('error', 'Could not save profile or submit proposal.');
      }
    },
    [dashboardData?.user?._id, fetchDashboardData, pendingProposal, showToast]
  );

  const handleWithdrawProposal = useCallback(
    async (proposalId: string) => {
      if (!confirm('Withdraw this proposal?')) return;
      try {
        await jobService.withdrawProposal(proposalId);
        fetchDashboardData();
        showToast('success', 'Proposal withdrawn.');
      } catch (err) {
        showToast('error', 'Withdrawal failed.');
      }
    },
    [fetchDashboardData, showToast]
  );

  const handleMessageClient = useCallback(
    async (clientId: string, jobId: string) => {
      try {
        const conversation = await jobService.createConversation(clientId, jobId);
        setSelectedConvId(conversation._id);
        setSelectedParticipant(conversation.participant);
        setActiveNav('messages');
      } catch (err) {
        showToast('error', 'Could not open chat.');
      }
    },
    [showToast]
  );

  const handleWorkSuccess = useCallback(() => {
    fetchDashboardData();
    showToast('success', 'Work submitted successfully.');
  }, [fetchDashboardData, showToast]);

  const handleApplyToJob = useCallback(
    async (jobId: string, payload: { bid: number; coverLetter: string }) => {
      if (!isProfileComplete(dashboardData?.user)) {
        setPendingProposal({ jobId, payload });
        setShowProfileModal(true);
        showToast('error', 'Complete your profile before applying.');
        return;
      }

      try {
        await jobService.submitProposal(jobId, payload);
        setSelectedJob(null);
        setActiveNav('proposals');
        fetchDashboardData();
        showToast('success', 'Proposal submitted.');
      } catch (err) {
        showToast('error', 'Could not submit your proposal. Please try again.');
      }
    },
    [dashboardData?.user, fetchDashboardData, isProfileComplete, showToast]
  );

  // ============================================================
  // 8e. Derived data
  // ============================================================
  const user = dashboardData?.user;
  const stats = dashboardData?.stats || { totalEarnings: 0, activeJobs: 0, openProposals: 0, profileViews: 0 };
  const userFullName = user ? `${user.firstName} ${user.lastName}` : 'Freelancer';
  const earnings = dashboardData?.earnings || [];
  const transactions = dashboardData?.transactions || [];

  // ============================================================
  // 8f. Render
  // ============================================================
  if (loadingDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm animate-pulse">Loading workspace…</p>
      </div>
    );
  }

  return (
    <>
      {/* Global animation keyframes for nav transitions */}
      <style>{`
        @keyframes tabFadeIn {
          0% { opacity: 0; transform: translateY(6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-tab-in {
          animation: tabFadeIn 0.28s ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .animate-tab-in { animation: none; }
        }
      `}</style>

      {/* Toast notification */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-md shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {toast.text}
        </div>
      )}

      {/* ─── NAV ─── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>

          <div className="hidden md:flex relative items-center gap-1 mx-4">
            {/* Sliding active-tab indicator */}
            <span
              aria-hidden="true"
              className={`absolute top-0 bottom-0 rounded-md bg-green-50 transition-all duration-300 ease-out ${
                navIndicator.ready ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: navIndicator.left, width: navIndicator.width }}
            />
            {NAV_LINKS.map(({ label, id }) => (
              <button
                key={id}
                ref={(el) => { navRefs.current[id] = el; }}
                onClick={() => setActiveNav(id)}
                className={`relative z-10 px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-colors duration-200 ${
                  activeNav === id ? 'text-green-700' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium transition-all duration-200 hover:bg-green-700 hover:shadow-md active:scale-95"
              onClick={() => navigate('/search')}
            >
              Find work
            </button>

            <div
              className="flex items-center gap-2 pl-2 border-l border-gray-200 cursor-pointer rounded-md transition-colors duration-200 hover:bg-gray-50"
              onClick={() => setActiveNav('profile')}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={userFullName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: avatarColor(user?._id || '') }}
                >
                  {getInitials(userFullName)}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden lg:inline">{userFullName}</span>
            </div>

            <button
              onClick={handleLogout}
              className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-full text-xs font-medium transition-colors duration-200 hover:border-red-500 hover:text-red-500"
            >
              Sign out
            </button>
          </div>

          <div className="flex md:hidden items-center gap-2">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setActiveNav('profile')}
            >
              {user?.profileImage ? (
                <img src={user.profileImage} alt={userFullName} className="w-8 h-8 rounded-full object-cover" />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: avatarColor(user?._id || '') }}
                >
                  {getInitials(userFullName)}
                </div>
              )}
            </div>
            <button
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Menu"
              aria-expanded={mobileMenuOpen}
            >
              <span className="block w-5 h-4 relative">
                <span
                  className={`absolute left-0 top-0 w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-300 ease-out ${
                    mobileMenuOpen ? 'top-1.5 rotate-45' : ''
                  }`}
                />
                <span
                  className={`absolute left-0 top-1.5 w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-200 ease-out ${
                    mobileMenuOpen ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <span
                  className={`absolute left-0 bottom-0 w-5 h-0.5 bg-gray-800 rounded-full transition-all duration-300 ease-out ${
                    mobileMenuOpen ? 'bottom-1.5 -rotate-45' : ''
                  }`}
                />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile nav — height/opacity transition instead of an instant mount/unmount */}
        <div
          className={`md:hidden border-t bg-white overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0 border-t-0'
          }`}
        >
          <div className="px-4 pb-4 pt-2 flex flex-col gap-1">
            <div className="px-3 py-2 mb-2 bg-gray-50 rounded-lg flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ background: avatarColor(user?._id || '') }}
              >
                {getInitials(userFullName)}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">{userFullName}</div>
                <div className="text-xs text-gray-500">{user?.title || 'Freelancer'}</div>
              </div>
            </div>

            {NAV_LINKS.map(({ label, id }, i) => (
              <button
                key={id}
                className={`w-full text-left px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
                  activeNav === id ? 'bg-green-50 text-green-700' : 'text-gray-700 hover:bg-gray-100'
                } ${mobileMenuOpen ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'}`}
                style={{ transitionDelay: mobileMenuOpen ? `${i * 30}ms` : '0ms' }}
                onClick={() => {
                  setMobileMenuOpen(false);
                  setActiveNav(id);
                }}
              >
                {label}
              </button>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-full text-sm font-medium transition-colors duration-200 hover:border-red-500 hover:text-red-500"
                onClick={handleLogout}
              >
                Sign out
              </button>
              <button
                className="flex-1 py-2 bg-green-600 text-white rounded-full text-sm font-medium transition-colors duration-200 hover:bg-green-700"
                onClick={() => {
                  setMobileMenuOpen(false);
                  navigate('/search');
                }}
              >
                Find work
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden min-h-105 sm:min-h-155 lg:min-h-160 flex flex-col justify-between py-8 sm:py-16 lg:py-20 px-6 sm:px-12 lg:px-16">
        <div className="sm:hidden absolute inset-0 z-0 bg-linear-to-br from-green-900 via-green-700 to-green-600" />
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="hidden sm:block absolute inset-0 w-full h-full object-cover z-0 brightness-[0.75]"
          aria-label="Background video showcasing freelance work"
        >
          <source src="/DesktopHeader.webm" type="video/webm" />
        </video>
        <div className="absolute inset-0 z-10 bg-black/20" />

        <div className="max-w-5xl w-full mx-auto relative z-20 flex-1 flex flex-col justify-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6 sm:mb-8 tracking-tight max-w-3xl">
            Welcome back, <br />
            <span className="font-semibold">{user?.firstName || 'Freelancer'}</span>
          </h1>

          <div className="flex bg-white rounded-lg p-1.5 overflow-hidden max-w-xl sm:max-w-3xl shadow-2xl items-center">
            <input
              type="search"
              placeholder="Search for new jobs or tasks..."
              className="flex-1 border-none outline-none pl-4 sm:pl-5 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 min-w-0 placeholder-gray-400 font-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              aria-label="Search for jobs"
            />
            <button
              onClick={handleSearch}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-800 transition shrink-0 mr-0.5 sm:mr-1"
              aria-label="Search"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 1 5.196 5.196a7.5 7.5 0 0 1 10.603 10.603Z" />
              </svg>
            </button>
          </div>

          <div className="flex gap-2 flex-wrap items-center mt-5 sm:mt-6">
            {POPULAR_TAGS.map((tag) => (
              <button
                key={tag}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-white/40 rounded-md text-xs sm:text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white hover:text-black transition flex items-center gap-1.5 sm:gap-2"
                onClick={() => {
                  setSearchQuery(tag);
                  navigate(`/search?q=${encodeURIComponent(tag)}`);
                }}
              >
                {tag} <span className="text-[10px] sm:text-xs text-white/65 font-light">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="max-w-5xl w-full mx-auto relative z-20 mt-8 sm:mt-12 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <span className="text-xs text-gray-300 font-medium tracking-wide">Trusted by:</span>
            <div className="flex items-center gap-4 sm:gap-8 flex-wrap font-sans text-xs sm:text-base text-white/70 font-semibold select-none">
              <span className="tracking-tighter font-bold text-white/80">Meta</span>
              <span className="font-medium text-white/80">Google</span>
              <span className="font-black tracking-widest text-[10px] sm:text-sm text-white/80">NETFLIX</span>
              <span className="font-bold italic text-white/80">P&G</span>
              <span className="font-bold tracking-tight text-white/80">PayPal</span>
            </div>
          </div>
          <button
            onClick={toggleVideoPlayback}
            className="hidden sm:flex w-8 h-8 rounded-full border border-white/20 bg-black/30 items-center justify-center text-white/80 hover:bg-white/20 transition text-xs"
            aria-label={isVideoPlaying ? 'Pause video' : 'Play video'}
          >
            {isVideoPlaying ? 'Ⅱ' : '▶'}
          </button>
        </div>
      </section>

      {/* ─── MAIN DASHBOARD SECTIONS ─── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-10">
        <div key={activeNav} className="space-y-10 animate-tab-in">
        {/* Overview Stats */}
        {activeNav === 'overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <EnhancedStatCard
              label="Total Earnings"
              value={`$${(stats.totalEarnings || 0).toLocaleString()}`}
              icon={Icons.Earnings}
              trend="up"
              sub="+12% this month"
            />
            <EnhancedStatCard
              label="Active Jobs"
              value={String(stats.activeJobs || 0)}
              icon={Icons.Jobs}
              sub={stats.activeJobs > 0 ? `${stats.activeJobs} in progress` : undefined}
            />
            <EnhancedStatCard
              label="Open Proposals"
              value={String(stats.openProposals || 0)}
              icon={Icons.Proposals}
              sub={stats.openProposals > 0 ? 'Awaiting response' : undefined}
            />
            <EnhancedStatCard
              label="Profile Views"
              value={String(stats.profileViews || 0)}
              icon={Icons.Views}
              sub="From this month"
              trend="up"
            />
          </div>
        )}

        {/* Active Jobs */}
        {(activeNav === 'overview' || activeNav === 'jobs') && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">
                {activeNav === 'overview' ? 'Active Jobs Pipeline' : 'My Assigned Jobs'}
              </h2>
              {activeNav === 'overview' && (
                <button
                  onClick={() => setActiveNav('jobs')}
                  className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardData?.activeJobs?.length ? (
                dashboardData.activeJobs.map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onMessage={handleMessageClient}
                    onSubmit={setShowWorkModal}
                    onView={setSelectedJob}
                  />
                ))
              ) : (
                <EmptyState
                  title="No active contracts"
                  description="You don't have any active jobs right now. Explore work opportunities above."
                  action={
                    <button
                      onClick={() => navigate('/search')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition"
                    >
                      Find Work
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </button>
                  }
                />
              )}
            </div>
          </section>
        )}

        {/* Proposals */}
        {(activeNav === 'overview' || activeNav === 'proposals') && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-800">Submitted Proposals</h2>
              {activeNav === 'overview' && (
                <button
                  onClick={() => setActiveNav('proposals')}
                  className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline"
                >
                  View all →
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-100">
              {dashboardData?.proposals?.length ? (
                dashboardData.proposals.map((p) => (
                  <ProposalItem key={p._id} proposal={p} onWithdraw={handleWithdrawProposal} />
                ))
              ) : (
                <EmptyState
                  title="No proposals yet"
                  description="Start applying to jobs to see your submitted proposals here."
                  action={
                    <button
                      onClick={() => navigate('/search')}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-full hover:bg-green-700 transition"
                    >
                      Browse Jobs
                    </button>
                  }
                />
              )}
            </div>
          </section>
        )}

        {/* Earnings & Transactions */}
        {(activeNav === 'overview' || activeNav === 'earnings') && (
          <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-gray-800">Financial Earnings</h2>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">
                  ${(stats.totalEarnings || 0).toLocaleString()}
                </p>
              </div>
              {activeNav === 'overview' && (
                <button
                  onClick={() => setActiveNav('earnings')}
                  className="text-xs font-medium text-green-600 hover:text-green-700 hover:underline self-start sm:self-center"
                >
                  View full ledger →
                </button>
              )}
            </div>

            {earnings.length > 0 && (
              <div className="mt-6">
                <div className="flex items-end gap-2 h-32 border-b border-gray-200 pb-2">
                  {earnings.map(({ month, amount }) => (
                    <div key={month} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-gray-500">${amount}</span>
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all duration-300"
                        style={{
                          height: `${Math.max(20, (amount / (stats.totalEarnings || 1)) * 100)}%`,
                          minHeight: '4px',
                        }}
                      />
                      <span className="text-[10px] text-gray-400 mt-1">{month}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Recent Transactions</h3>
              {transactions.length > 0 ? (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm text-left">
                    <thead className="border-b bg-gray-50 text-gray-600 font-medium text-xs uppercase">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">Job</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                        <th className="py-2 px-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.slice(0, 5).map((tx) => (
                        <tr key={tx._id} className="hover:bg-gray-50/40 transition">
                          <td className="py-3 px-3 text-gray-600">{new Date(tx.createdAt).toLocaleDateString()}</td>
                          <td className="py-3 px-3 font-medium text-gray-800 truncate max-w-[120px]">{tx.jobTitle}</td>
                          <td className="py-3 px-3 text-right font-semibold text-gray-900">${tx.amount}</td>
                          <td className="py-3 px-3 text-center">
                            <StatusBadge status={tx.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">No transactions recorded yet.</p>
              )}
            </div>
          </section>
        )}

        {/* Messages */}
        {activeNav === 'messages' && user && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="grid md:grid-cols-3 h-[600px]">
              <div className="border-r border-gray-200 overflow-y-auto bg-gray-50/40">
                <ChatConversationList
                  onSelectConversation={(convId, participant) => {
                    setSelectedConvId(convId);
                    setSelectedParticipant(participant);
                  }}
                  selectedId={selectedConvId || undefined}
                />
              </div>
              <div className="md:col-span-2 bg-white">
                {selectedConvId && selectedParticipant ? (
                  <ChatRoom
                    conversationId={selectedConvId}
                    currentUserId={user._id}
                    otherUser={selectedParticipant}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2">
                    <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <p className="text-sm font-light">Select a conversation to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

{activeNav === 'profile' && user && (
  <section className="bg-white rounded-2xl border border-zinc-200 p-6 md:p-8 text-zinc-900 shadow-sm">
    {/* Edit Button */}
    <div className="flex justify-end mb-6">
      <button
        onClick={() => setEditingProfile(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-zinc-500 text-xs font-medium rounded-full hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
        Edit Profile
      </button>
    </div>

    {/* Main Layout */}
    <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8 w-full">

      {/* LEFT — Avatar */}
      <div className="flex-none flex flex-col items-center gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 opacity-30 group-hover:opacity-50 transition duration-300 blur-sm" />
          <div className="relative w-[200px] sm:w-[220px] aspect-square overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center">
            {user?.profileImage ? (
              <img
                src={user.profileImage}
                alt={userFullName}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <span className="text-4xl font-semibold text-zinc-400 uppercase tracking-widest">
                {getInitials(userFullName)}
              </span>
            )}
          </div>
        </div>

        {/* Availability Bar */}
        <div className="w-full px-1">
          <div className="flex justify-between text-[10px] text-zinc-400 mb-1.5 font-medium uppercase tracking-wider">
            <span>Availability</span>
            <span className="text-emerald-500">72%</span>
          </div>
          <div className="h-1 bg-zinc-100 rounded-full overflow-hidden">
            <div className="h-full w-[72%] bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full" />
          </div>
        </div>
      </div>

      {/* RIGHT — Info */}
      <div className="flex-1 space-y-5 text-center lg:text-left w-full">

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
          {/* Online Status */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-medium text-emerald-700">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Exploring AI/ML & Cloud
          </span>

          {/* Hourly Rate */}
          {user?.hourlyRate && user.hourlyRate > 0 && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-teal-50 border border-teal-200 text-[11px] font-semibold text-teal-700">
              <DollarSign className="h-3 w-3" />
              ${user.hourlyRate}/hr
            </span>
          )}

          {/* Rating */}
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-700">
            <Award className="h-3 w-3" />
            {(user?.rating || 5.0).toFixed(1)} ({user?.reviewCount || 0} reviews)
          </span>
        </div>

        {/* Name & Title */}
        <div className="space-y-1">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-zinc-900">
            Hi, I'm {user?.firstName || ''} {user?.lastName || ''}
          </h1>
          {user?.title && (
            <p className="text-sm font-medium text-emerald-600">
              {user.title}
            </p>
          )}
        </div>

        {/* Bio */}
        {user?.bio && (
          <p className="text-sm leading-relaxed text-zinc-500 max-w-2xl mx-auto lg:mx-0">
            {user.bio}
          </p>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Projects', value: '12' },
            { label: 'Avg. Rating', value: (user?.rating || 5.0).toFixed(1) },
            { label: 'Reviews', value: String(user?.reviewCount || 0) },
          ].map(({ label, value }) => (
            <div key={label} className="bg-zinc-50 border border-zinc-100 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-zinc-900">{value}</p>
              <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-medium mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Skills */}
        {user?.skills && user.skills.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">Expertise</p>
            <div className="flex flex-wrap justify-center lg:justify-start gap-2">
              {user.skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-md bg-zinc-50 border border-zinc-200 text-xs font-medium text-zinc-600 hover:border-zinc-300 hover:bg-white transition"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <hr className="border-zinc-100" />

        {/* Footer Meta */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-zinc-400">
            {user?.location?.city && user?.location?.country && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-zinc-300" />
                {user.location.city}, {user.location.country}
              </span>
            )}
            
            {user?.location?.city && user?.location?.country && <span className="text-zinc-200">•</span>}
            
            <span className="flex items-center gap-1.5">
              <Code2 className="h-3.5 w-3.5 text-zinc-300" />
              Full-Stack Developer
            </span>
            
            <span className="text-zinc-200">•</span>
            
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-zinc-300" />
              UTC+5:30
            </span>
          </div>
        </div>

      </div>
    </div>
  </section>
)}

        </div>

        {showProfileModal && user && (
          <ProfileCompletionModal
            user={user}
            onSave={handleSaveProfileAndApply}
            onCancel={() => {
              setShowProfileModal(false);
              setPendingProposal(null);
            }}
            onError={(msg) => showToast('error', msg)}
          />
        )}
      </main>

      {/* ─── CAROUSELS & MARKETING ─── */}
      <Slide slidesToShow={5} arrowsScroll={5}>
        {cards.map((card) => (
          <CatCard key={card.id} card={card} />
        ))}
      </Slide>

      <section className="flex justify-center -mt-10 mb-10 overflow-hidden w-full">
        <div className="w-350 max-[500px]:w-full max-[500px]:px-4">
          <div className="hidden min-[501px]:flex w-full justify-between flex-wrap">
            {items.map((item) => (
              <div
                key={`desktop-${item.id}`}
                className="w-[250px] h-[150px] flex flex-col gap-[10px] items-center justify-center text-center cursor-pointer group"
              >
                <img src={item.img} alt={item.label} className="w-[50px] h-[50px]" />
                <div className="w-[50px] h-[2px] bg-gray-200 transition-all duration-300 group-hover:w-[80px] group-hover:bg-[#1dbf73]" />
                <span className="font-light text-sm">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Mobile marquee */}
          <div
            className="flex min-[501px]:hidden w-full overflow-hidden"
            style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
          >
            <div
              className="flex flex-nowrap gap-4 animation-marquee"
              style={{
                display: 'flex',
                width: 'max-content',
                animation: 'scrollMarquee 20s linear infinite',
              }}
            >
              {[...items, ...items].map((item, index) => (
                <div
                  key={`mobile-${item.id}-${index}`}
                  className="w-[200px] h-[150px] flex flex-col gap-[10px] items-center justify-center text-center flex-shrink-0"
                >
                  <img src={item.img} alt={item.label} className="w-[50px] h-[50px]" />
                  <div className="w-[50px] h-[2px] bg-gray-200" />
                  <span className="font-light text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
          <style>{`
            @keyframes scrollMarquee {
              0% { transform: translate3d(0, 0, 0); }
              100% { transform: translate3d(-50%, 0, 0); }
            }
          `}</style>
        </div>
      </section>

      <TechStack />

      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-6 bg-linear-to-b from-white to-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <SectionBadge label="Workflow" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-10 md:mb-16">
            Ecosystem Pipeline Dynamics
            <div className="w-16 h-1 bg-linear-to-b from-green-500 to-emerald-400 rounded-full mx-auto mt-4" />
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="group flex sm:flex-col items-start sm:items-center gap-5 sm:gap-6 p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:border-green-200/60 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-linear-to-br from-green-600 to-emerald-500 text-white text-lg font-bold flex items-center justify-center shadow-md shadow-green-500/20 sm:mx-auto sm:mb-1 transition-transform duration-300 group-hover:scale-105">
                  {n}
                </div>
                <div className="sm:text-center">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2">{title}</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-gray-50 py-8 sm:py-10 px-4 sm:px-6 lg:px-10 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Contracts</h4>
              <button
                onClick={() => setActiveNav('jobs')}
                className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600"
              >
                Active Pipelines
              </button>
              <button
                onClick={() => navigate('/search')}
                className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600"
              >
                Explore Open Market
              </button>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Finance</h4>
              <button
                onClick={() => setActiveNav('earnings')}
                className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600"
              >
                Ledger Metrics
              </button>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Legal</h4>
              <Link to="/terms" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">
                Terms of Service
              </Link>
              <Link to="/privacy" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">
                Privacy Policy
              </Link>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Workspace</h4>
              <Link to="/" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">
                Portal Hub
              </Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200">
            <Link to="/">
              <Logo />
            </Link>
            <span className="text-xs sm:text-sm text-gray-500">
              © {new Date().getFullYear()} FreelanceFluxo. All rights reserved.
            </span>
          </div>
        </div>
      </footer>

      {/* ─── JOB DETAIL DRAWER (view + apply) ─── */}
      <JobDetailDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        onMessage={handleMessageClient}
        onSubmitWork={setShowWorkModal}
        onApply={handleApplyToJob}
      />

      {/* ─── WORK SUBMISSION MODAL ─── */}
      {showWorkModal && (
        <WorkSubmissionModal
          jobId={showWorkModal}
          onClose={() => setShowWorkModal(null)}
          onSuccess={handleWorkSuccess}
          onError={(msg) => showToast('error', msg)}
        />
      )}

      {/* ─── PROFILE EDITOR MODAL ─── */}
      {editingProfile && user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingProfile(false)}
          />
          <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
            <ProfileEditor
              user={user}
              onSave={handleSaveProfile}
              onCancel={() => setEditingProfile(false)}
              onError={(msg) => showToast('error', msg)}
            />
          </div>
        </div>
      )}
    </>
  );
}