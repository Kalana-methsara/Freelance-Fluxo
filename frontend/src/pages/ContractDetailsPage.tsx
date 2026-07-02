import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Zap,
  MessageSquare,
  Star,
} from "lucide-react";

const AVATAR_COLORS = [
  "#7c3aed",
  "#0891b2",
  "#d97706",
  "#dc2626",
  "#059669",
  "#c026d3",
];

function getAvatarColor(seed: string) {
  const idx = seed
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getStatusColor(status: string) {
  const colors: Record<string, { bg: string; text: string; icon: string }> = {
    pending: { bg: "bg-amber-50", text: "text-amber-700", icon: "⏳" },
    accepted: { bg: "bg-teal-50", text: "text-teal-700", icon: "✓" },
    declined: { bg: "bg-red-50", text: "text-red-700", icon: "✕" },
    completed: { bg: "bg-blue-50", text: "text-blue-700", icon: "★" },
    cancelled: { bg: "bg-gray-50", text: "text-gray-700", icon: "∅" },
    disputed: { bg: "bg-orange-50", text: "text-orange-700", icon: "!" },
  };
  return colors[status] || colors.pending;
}

interface Milestone {
  title: string;
  amount: number;
  dueDate: string;
  status: string;
}

interface Contract {
  _id: string;
  contractTitle: string;
  budgetType: "fixed" | "hourly";
  totalAmount?: number;
  hourlyRate?: number;
  estimatedHours?: number;
  deadline: string;
  message: string;
  status: string;
  milestones: Milestone[];
  clientId: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    companyName?: string;
    email: string;
    title?: string;
  };
  freelancerId: {
    _id: string;
    firstName: string;
    lastName: string;
    profileImage?: string;
    title?: string;
    hourlyRate?: number;
    rating?: number;
    reviewCount?: number;
    email: string;
  };
  jobId?: {
    _id: string;
    title: string;
    description?: string;
    budget?: number;
    status?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function ContractDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    platformService
      .getContractById(id)
      .then((data) => {
        setContract(data);
      })
      .catch((err) => {
        console.error("Error fetching contract:", err);
        setError(
          err.response?.data?.message || "Failed to load contract details"
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fffe_0%,_#f7faf9_100%)]">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-100/60 bg-white/80 px-6 py-5 shadow-lg backdrop-blur-sm">
          <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading contract details…</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top,_#f8fffe_0%,_#f7faf9_100%)] gap-4">
        <div className="rounded-2xl border border-gray-100/60 bg-white/80 px-8 py-8 text-center shadow-lg backdrop-blur-sm">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 font-medium">
            {error || "Contract not found"}
          </p>
        </div>
        <Link
          to="/dashboard/client"
          className="text-teal-700 hover:underline text-sm font-medium"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const client = contract.clientId;
  const freelancer = contract.freelancerId;
  const clientName = `${client.firstName} ${client.lastName}`;
  const freelancerName = `${freelancer.firstName} ${freelancer.lastName}`;
  const clientAvatarColor = getAvatarColor(client._id || clientName);
  const freelancerAvatarColor = getAvatarColor(freelancer._id || freelancerName);
  const statusColor = getStatusColor(contract.status);

  const totalBudget =
    contract.budgetType === "fixed"
      ? contract.totalAmount || 0
      : (contract.hourlyRate || 0) * (contract.estimatedHours || 0);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fffe_0%,_#f7faf9_100%)]">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100/60 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-teal-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${statusColor.bg} ${statusColor.text}`}>
            {statusColor.icon} {contract.status}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Contract Title & Overview */}
        <div className="grid grid-cols-1 gap-6 mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-100/60 p-6 sm:p-8 shadow-lg">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {contract.contractTitle}
            </h1>
            {contract.jobId && (
              <p className="text-sm text-gray-500">
                Related to job:{" "}
                <span className="font-medium text-teal-700">
                  {contract.jobId.title}
                </span>
              </p>
            )}
            <p className="text-gray-600 mt-4 leading-relaxed">
              {contract.message}
            </p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Parties Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Client Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                Client
              </p>
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-bold mx-auto shadow-md shrink-0 mb-3"
                style={{ background: clientAvatarColor }}
              >
                {client.profileImage ? (
                  <img
                    src={client.profileImage}
                    alt={clientName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(clientName)
                )}
              </div>
              <h3 className="text-center font-bold text-gray-900 mb-1">
                {clientName}
              </h3>
              {client.companyName && (
                <p className="text-center text-xs text-teal-600 font-medium mb-3">
                  {client.companyName}
                </p>
              )}
              {client.title && (
                <p className="text-center text-xs text-gray-600 mb-3">
                  {client.title}
                </p>
              )}
              <p className="text-xs text-gray-500 text-center break-all">
                {client.email}
              </p>
            </div>

            {/* Freelancer Card */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                Freelancer
              </p>
              <div
                className="w-16 h-16 rounded-full overflow-hidden flex items-center justify-center text-white text-xl font-bold mx-auto shadow-md shrink-0 mb-3"
                style={{ background: freelancerAvatarColor }}
              >
                {freelancer.profileImage ? (
                  <img
                    src={freelancer.profileImage}
                    alt={freelancerName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(freelancerName)
                )}
              </div>
              <h3 className="text-center font-bold text-gray-900 mb-1">
                {freelancerName}
              </h3>
              {freelancer.title && (
                <p className="text-center text-xs text-teal-600 font-medium mb-3">
                  {freelancer.title}
                </p>
              )}
              {freelancer.rating !== undefined && freelancer.rating > 0 && (
                <div className="flex items-center justify-center gap-1 mb-3">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-gray-900">
                    {freelancer.rating.toFixed(1)}
                  </span>
                  {freelancer.reviewCount !== undefined && (
                    <span className="text-xs text-gray-500">
                      ({freelancer.reviewCount} reviews)
                    </span>
                  )}
                </div>
              )}
              {freelancer.hourlyRate && (
                <p className="text-center text-xs text-gray-600 mb-3">
                  ${freelancer.hourlyRate}/hr
                </p>
              )}
              <p className="text-xs text-gray-500 text-center break-all">
                {freelancer.email}
              </p>
            </div>
          </div>

          {/* Right Column: Contract Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Budget & Timeline */}
            <div className="grid grid-cols-2 gap-4">
              {/* Budget Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-5 w-5 text-teal-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Budget
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalBudget)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {contract.budgetType === "fixed" ? "Fixed" : "Hourly"} Rate
                </p>
                {contract.budgetType === "hourly" && (
                  <p className="text-xs text-gray-600 mt-2">
                    {contract.hourlyRate && formatCurrency(contract.hourlyRate)}
                    /hr × {contract.estimatedHours} hours
                  </p>
                )}
              </div>

              {/* Deadline Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-5 w-5 text-teal-600" />
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Deadline
                  </p>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(contract.deadline)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.max(
                    0,
                    Math.ceil(
                      (new Date(contract.deadline).getTime() -
                        new Date().getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{" "}
                  days remaining
                </p>
              </div>
            </div>

            {/* Milestones Section */}
            {contract.milestones && contract.milestones.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Zap className="h-5 w-5 text-teal-600" />
                  <h2 className="text-sm font-bold text-gray-900">Milestones</h2>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg">
                    {contract.milestones.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {contract.milestones.map((milestone, idx) => {
                    const isCompleted = milestone.status === "released";
                    return (
                      <div
                        key={idx}
                        className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition"
                      >
                        <div className="flex-shrink-0">
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-teal-600" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900">
                            {milestone.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Due: {formatDate(milestone.dueDate)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(milestone.amount)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contract Metadata */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-gray-500 font-medium mb-1">Created</p>
                <p className="font-bold text-gray-900">
                  {formatDate(contract.createdAt)}
                </p>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-gray-500 font-medium mb-1">Last Updated</p>
                <p className="font-bold text-gray-900">
                  {formatDate(contract.updatedAt)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">
                Quick Actions
              </p>
              <div className="flex flex-col gap-3">
                <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-teal-50 text-teal-700 hover:bg-teal-100 rounded-xl font-medium text-sm transition">
                  <MessageSquare className="h-4 w-4" />
                  Message {contract.clientId._id === freelancer._id ? "Freelancer" : "Client"}
                </button>
                {contract.status === "accepted" && (
                  <button className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-medium text-sm transition">
                    <CheckCircle2 className="h-4 w-4" />
                    View Progress
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
