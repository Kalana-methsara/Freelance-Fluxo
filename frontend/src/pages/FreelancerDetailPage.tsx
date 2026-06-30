import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import platformService from "../services/platformService";
import jobService from "../services/jobService";
import { getInitials } from "../utils/auth";
import {
  MapPin,
  Code2,
  Clock,
  Award,
  Briefcase,
  CheckCircle2,
  Mail,
  Globe,
  ArrowLeft,
  Star,
} from "lucide-react";

const AVATAR_COLORS = ["#7c3aed", "#0891b2", "#d97706", "#dc2626", "#059669", "#c026d3"];

function getAvatarColor(seed: string) {
  const idx = seed
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
  }, []);

  const roles = currentUser?.userRole || currentUser?.roles || [];
  const isClient = roles.map((r: string) => String(r).toUpperCase()).includes("CLIENT");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    platformService
      .getFreelancer(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!data?.freelancer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-600">Freelancer not found</p>
        <Link to="/search" className="text-emerald-700 hover:underline text-sm">
          Browse freelancers
        </Link>
      </div>
    );
  }

  const { freelancer, completedJobs = [] } = data;
  const name = `${freelancer.firstName} ${freelancer.lastName}`;
  const avatarColor = getAvatarColor(freelancer._id || name);
  const rating = freelancer.rating || 5.0;
  const reviewCount = freelancer.reviewCount || 0;
  const totalEarned = completedJobs.reduce(
    (sum: number, job: any) => sum + (job.budget || 0),
    0
  );

  const handleHire = () => {
    if (!currentUser) { navigate("/login"); return; }
    if (!isClient) { alert("Only clients can hire freelancers."); return; }
    navigate(`/hire/${freelancer._id}`);
  };

  const handleMessage = async () => {
    if (!currentUser) { navigate("/login"); return; }
    if (!isClient) { alert("Only clients can message freelancers."); return; }
    setMessaging(true);
    try {
      const conv = await jobService.createConversation(freelancer._id);
      navigate("/dashboard/client", {
        state: { openMessages: true, conversationId: conv._id, participant: conv.participant },
      });
    } catch {
      alert("Could not start conversation. Try hiring this freelancer to a project first.");
    } finally {
      setMessaging(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-emerald-700 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Link to="/search" className="text-sm text-emerald-700 hover:underline">
            Browse talent
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column: profile summary ── */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 text-center lg:sticky lg:top-24">
              <div
                className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center text-white text-3xl font-bold mx-auto shadow-md shrink-0"
                style={{ background: avatarColor }}
              >
                {freelancer.profileImage ? (
                  <img
                    src={freelancer.profileImage}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(name)
                )}
              </div>

              <h1 className="text-xl font-bold text-gray-900 mt-4">{name}</h1>
              {freelancer.title && (
                <p className="text-sm font-medium text-emerald-600 mt-0.5">{freelancer.title}</p>
              )}

              <div className="flex items-center justify-center gap-1.5 mt-3">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-medium text-amber-700">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  {rating.toFixed(1)} ({reviewCount} reviews)
                </span>
              </div>

              <p className="text-2xl font-bold text-gray-900 mt-5">
                ${freelancer.hourlyRate || 0}
                <span className="text-sm font-medium text-gray-400">/hr</span>
              </p>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleHire}
                  className="flex-1 px-4 py-2.5 bg-emerald-700 text-white text-sm font-semibold rounded-full hover:bg-emerald-800 transition"
                >
                  Hire {freelancer.firstName}
                </button>
              </div>
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="w-full mt-2.5 px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-full hover:bg-gray-50 disabled:opacity-60 transition inline-flex items-center justify-center gap-1.5"
              >
                <Mail className="h-3.5 w-3.5" />
                {messaging ? "Starting…" : "Message"}
              </button>

              <hr className="border-gray-100 my-6" />

              <div className="space-y-3 text-left">
                {freelancer.location?.city && freelancer.location?.country && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                    {freelancer.location.city}, {freelancer.location.country}
                  </div>
                )}
                {freelancer.title && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Code2 className="h-4 w-4 text-gray-400 shrink-0" />
                    {freelancer.title}
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-sm text-gray-600">
                  <Clock className="h-4 w-4 text-gray-400 shrink-0" />
                  UTC+5:30
                </div>
                {freelancer.email && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                    <span className="truncate">{freelancer.email}</span>
                  </div>
                )}
                {freelancer.website && (
                  <div className="flex items-center gap-2.5 text-sm text-gray-600">
                    <Globe className="h-4 w-4 text-gray-400 shrink-0" />
                    <a
                      href={freelancer.website}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-emerald-700 hover:underline"
                    >
                      {freelancer.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right column: details ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Completed Jobs", value: String(completedJobs.length), icon: Briefcase },
                { label: "Total Earned", value: `$${totalEarned.toLocaleString()}`, icon: Award },
                { label: "Avg. Rating", value: rating.toFixed(1), icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div
                  key={label}
                  className="bg-white border border-gray-200 rounded-xl p-4 text-center"
                >
                  <Icon className="h-4 w-4 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-lg font-bold text-gray-900">{value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-gray-400 mt-0.5">
                    {label}
                  </p>
                </div>
              ))}
            </div>

            {/* About */}
            {freelancer.bio && (
              <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  About
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {freelancer.bio}
                </p>
              </section>
            )}

            {/* Skills */}
            {freelancer.skills?.length > 0 && (
              <section className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">
                  Skills & Expertise
                </h2>
                <div className="flex flex-wrap gap-2">
                  {freelancer.skills.map((skill: string) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:border-emerald-300 hover:text-emerald-700 transition"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Portfolio / completed projects */}
            <section className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 sm:px-8 py-5 border-b border-gray-100">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                  Completed Projects
                </h2>
              </div>
              {completedJobs.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {completedJobs.map((job: any) => (
                    <div
                      key={job._id}
                      className="px-6 sm:px-8 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/60 transition"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 text-sm truncate">
                            {job.title}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {job.clientId?.companyName || job.clientId?.firstName || "Client"}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 shrink-0">
                        ${job.budget?.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-6 sm:px-8 py-10 text-center">
                  <Briefcase className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No completed projects yet</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}