// ============================================================
// pages/SearchPage.tsx — REFACTORED
// Changes vs original:
//   • StatusBadge → shared component/ui/StatusBadge
//   • Avatar → shared component/ui/Avatar (no more avatarColor helper duplicate)
//   • EmptyState → shared component
//   • PageLoader → shared component
//   • avatarColor logic → tokens.ts
//   • All data-fetching unchanged; UI presentational layer cleaned up
// ============================================================

import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import platformService from "../services/platformService";
import api from "../services/api";

import StatusBadge from "../components/Statusbadge";
import Avatar from "../components/Avatar";
import EmptyState from "../components/Emptystate";
import { PageLoader } from "../components/Loaders";
import Logo from "../components/Logo";

const SKILL_POOL: Record<string, string[]> = {
  "Development": ["React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "Spring Boot", "Express", "MongoDB", "PostgreSQL", "Next.js", "Docker"],
  "Design & Creative": ["UI/UX Design", "Figma", "Adobe Photoshop", "Illustrator", "Web Design", "Graphic Design"],
  "Writing & Translation": ["Content Writing", "Technical Writing", "Copywriting", "Translation", "SEO Writing"],
  "Marketing & Sales": ["SEO", "Digital Marketing", "Social Media Management", "Google Analytics", "Lead Generation"],
};

type SearchFilterState = {
  type: "all" | "freelancers" | "jobs";
  skills: string[];
  minBudget: string;
  maxBudget: string;
  minRate: string;
  maxRate: string;
  ratingMin: string;
  location: string;
};

const emptyFilters: SearchFilterState = {
  type: "all",
  skills: [],
  minBudget: "",
  maxBudget: "",
  minRate: "",
  maxRate: "",
  ratingMin: "",
  location: "",
};

const parseFiltersFromParams = (params: URLSearchParams): SearchFilterState => ({
  type: (params.get("type") as SearchFilterState["type"] | null) || "all",
  skills: (params.get("skills") || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean),
  minBudget: params.get("minBudget") || "",
  maxBudget: params.get("maxBudget") || "",
  minRate: params.get("minRate") || "",
  maxRate: params.get("maxRate") || "",
  ratingMin: params.get("ratingMin") || "",
  location: params.get("location") || "",
});

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();

  const [data, setData] = useState<{ freelancers: any[]; jobs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);
  const [tab, setTab] = useState<"freelancers" | "jobs">("freelancers");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilterState>(emptyFilters);

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [selectedFreelancer, setSelectedFreelancer] = useState<any | null>(null);
  const [selectedJobDetail, setSelectedJobDetail] = useState<any | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", profileImage: "",
    title: "", bio: "", hourlyRate: 0, companyName: "",
    address: "", city: "", province: "", country: "",
    lat: 6.0329, lng: 80.2170,
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const profileModalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchInput(query);
    setFilters(parseFiltersFromParams(searchParams));
  }, [query, searchParams]);

  useEffect(() => {
    if (!showProfileModal) return;
    const previousOverflow = document.body.style.overflow;
    const timer = window.setTimeout(() => profileModalRef.current?.focus(), 0);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, [showProfileModal]);

  // Load stored user
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed = JSON.parse(stored);
        setCurrentUser(parsed);
        setFormData({
          firstName: parsed.firstName || "", lastName: parsed.lastName || "",
          email: parsed.email || "", profileImage: parsed.profileImage || "",
          title: parsed.title || "", bio: parsed.bio || "",
          hourlyRate: parsed.hourlyRate || 0, companyName: parsed.companyName || "",
          address: parsed.location?.address || "", city: parsed.location?.city || "",
          province: parsed.location?.province || "", country: parsed.location?.country || "",
          lat: parsed.location?.coordinates?.lat || 6.0329,
          lng: parsed.location?.coordinates?.lng || 80.2170,
        });
        setSelectedSkills(
          Array.isArray(parsed.skills) ? parsed.skills
            : parsed.skills ? String(parsed.skills).split(",").map((s: string) => s.trim()).filter(Boolean)
            : []
        );
      }
    } catch {}
  }, [showProfileModal]);

  const roles = currentUser?.userRole || currentUser?.roles || [];
  const isFreelancer = roles.map((r: string) => String(r).toUpperCase()).includes("FREELANCER");
  const isClient = roles.map((r: string) => String(r).toUpperCase()).includes("CLIENT");
  const isGuest = !isFreelancer && !isClient;

  useEffect(() => {
    setLoading(true);
    platformService.search(query || undefined, filters)
      .then(setData)
      .catch(() => setData({ freelancers: [], jobs: [] }))
      .finally(() => setLoading(false));
  }, [query, filters]);

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    const trimmedQuery = searchInput.trim();
    if (trimmedQuery) params.set("q", trimmedQuery);
    if (filters.type !== "all") params.set("type", filters.type);
    if (filters.skills.length) params.set("skills", filters.skills.join(","));
    if (filters.minBudget) params.set("minBudget", filters.minBudget);
    if (filters.maxBudget) params.set("maxBudget", filters.maxBudget);
    if (filters.minRate) params.set("minRate", filters.minRate);
    if (filters.maxRate) params.set("maxRate", filters.maxRate);
    if (filters.ratingMin) params.set("ratingMin", filters.ratingMin);
    if (filters.location) params.set("location", filters.location);
    setSearchParams(params);
  }, [filters, searchInput, setSearchParams]);

  const handleClearFilters = useCallback(() => {
    setFilters(emptyFilters);
    setSearchInput(query);
    setSearchParams(new URLSearchParams(query ? { q: query } : {}));
  }, [query, setSearchParams]);

  const toggleSkillFilter = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter((item) => item !== skill) : [...prev.skills, skill],
    }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    setIsUploadingImage(true);
    try {
      const res = await api.post("/upload/upload-avatar", fd, { headers: { "Content-Type": "multipart/form-data" } });
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, profileImage: res.data.url }));
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          parsed.profileImage = res.data.url;
          localStorage.setItem("user", JSON.stringify(parsed));
          setCurrentUser(parsed);
        }
      }
    } catch { alert("Failed to upload image."); }
    finally { setIsUploadingImage(false); }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      const payload = {
        ...formData,
        skills: selectedSkills,
        location: {
          address: formData.address, city: formData.city,
          province: formData.province, country: formData.country,
          coordinates: { lat: formData.lat, lng: formData.lng },
        },
      };
      const res = await api.patch("/users/profile", payload);
      const updated = res.data?.data || res.data;
      if (updated) {
        localStorage.setItem("user", JSON.stringify(updated));
        setCurrentUser(updated);
      }
      setShowProfileModal(false);
      alert("Profile updated successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally { setIsUpdatingProfile(false); }
  };

  const handleApply = async (jobId: string) => {
    if (!currentUser) { navigate("/login"); return; }
    if (!isFreelancer) { alert("Only freelancers can apply."); return; }
    const bid = prompt("Enter your bid amount ($/hr):");
    const letter = prompt("Enter a short cover letter:");
    if (!bid) return;
    try {
      await api.post(`/jobs/${jobId}/apply`, {
        bid: Number(bid),
        coverLetter: letter || "",
        estimatedDays: 7,
      });
      alert("Proposal submitted!");
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to apply.");
    }
  };

  if (loading) return <PageLoader />;

  const freelancers = data?.freelancers ?? [];
  const jobs = data?.jobs ?? [];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#f8fffe_0%,_#f7faf9_100%)]">
      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100/60 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <button onClick={() => navigate("/")} className="shrink-0">
            <Logo size="sm" />
          </button>

          {/* Search bar */}
          <div className="flex-1 flex items-center gap-2 bg-white/70 border border-gray-200/80 rounded-xl px-3 py-2 max-w-lg shadow-sm">
            <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"/>
            </svg>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search freelancers, jobs, skills…"
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="px-3 py-2 text-sm font-medium text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
            >
              {showFilters ? "Hide filters" : "Filters"}
            </button>
            {currentUser && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-50 transition text-sm font-medium text-gray-700 border border-gray-200"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                Edit Profile
              </button>
            )}
            {!currentUser && (
              <>
                <button onClick={() => navigate("/login")} className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2">Log in</button>
                <button onClick={() => navigate("/signup")} className="text-sm font-semibold bg-teal-600 text-white px-4 py-2 rounded-xl hover:bg-teal-700 transition">Sign up</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {showFilters && (
          <div className="mb-6 rounded-2xl border border-gray-100/60 bg-white/80 backdrop-blur-sm p-5 shadow-lg">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Advanced filters</h2>
                <p className="text-xs text-gray-500">Refine freelancers and jobs with multiple criteria.</p>
              </div>
              <button type="button" onClick={handleClearFilters} className="text-sm font-medium text-teal-700 hover:underline">
                Clear all
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm text-gray-600">
                <span className="block mb-1">Search scope</span>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value as SearchFilterState["type"] }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="all">All</option>
                  <option value="freelancers">Freelancers</option>
                  <option value="jobs">Jobs</option>
                </select>
              </label>

              <label className="text-sm text-gray-600">
                <span className="block mb-1">Location</span>
                <input
                  value={filters.location}
                  onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="City or country"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <label className="text-sm text-gray-600">
                <span className="block mb-1">Min budget</span>
                <input
                  type="number"
                  min="0"
                  value={filters.minBudget}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minBudget: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <label className="text-sm text-gray-600">
                <span className="block mb-1">Max budget</span>
                <input
                  type="number"
                  min="0"
                  value={filters.maxBudget}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxBudget: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <label className="text-sm text-gray-600">
                <span className="block mb-1">Min hourly rate</span>
                <input
                  type="number"
                  min="0"
                  value={filters.minRate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, minRate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <label className="text-sm text-gray-600">
                <span className="block mb-1">Max hourly rate</span>
                <input
                  type="number"
                  min="0"
                  value={filters.maxRate}
                  onChange={(e) => setFilters((prev) => ({ ...prev, maxRate: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>

              <label className="text-sm text-gray-600">
                <span className="block mb-1">Minimum rating</span>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={filters.ratingMin}
                  onChange={(e) => setFilters((prev) => ({ ...prev, ratingMin: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </label>
            </div>

            <div className="mt-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-2">Skills</p>
              <div className="flex flex-wrap gap-2">
                {Object.values(SKILL_POOL).flat().map((skill) => {
                  const active = filters.skills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkillFilter(skill)}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${active ? "bg-teal-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button type="button" onClick={handleSearch} className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 transition">
                Apply filters
              </button>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-white/80 backdrop-blur-sm border border-gray-100/60 rounded-2xl p-1 w-fit mb-8 shadow-sm">
          {(isGuest || isClient) && (
            <button
              onClick={() => setTab("freelancers")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${tab === "freelancers" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              Freelancers {freelancers.length > 0 && <span className="ml-1 text-xs opacity-70">({freelancers.length})</span>}
            </button>
          )}
          {(isGuest || isFreelancer) && (
            <button
              onClick={() => setTab("jobs")}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${tab === "jobs" ? "bg-teal-600 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"}`}
            >
              Jobs {jobs.length > 0 && <span className="ml-1 text-xs opacity-70">({jobs.length})</span>}
            </button>
          )}
        </div>

        {/* Results */}
        {tab === "freelancers" && (
          freelancers.length === 0 ? (
            <EmptyState title="No freelancers found" description={`We couldn't find freelancers matching "${query}". Try a different search.`} />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freelancers.map((fl) => (
                <button
                  key={fl._id}
                  onClick={() => setSelectedFreelancer(fl)}
                  className="bg-white/90 border border-gray-100/80 rounded-2xl p-5 text-left hover:border-teal-300 hover:shadow-lg transition-all group shadow-sm"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar person={{ _id: fl._id, firstName: fl.firstName, lastName: fl.lastName, profileImage: fl.profileImage }} size="lg" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition truncate">{fl.firstName} {fl.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{fl.title || "Freelancer"}</p>
                      <p className="text-xs text-amber-400 mt-0.5">{"★".repeat(Math.round(fl.rating || 5))} <span className="text-gray-400">({fl.reviewCount || 0})</span></p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1.5 flex-wrap">
                      {(fl.skills || []).slice(0, 3).map((s: string) => (
                        <span key={s} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-md font-medium">{s}</span>
                      ))}
                    </div>
                    <span className="text-sm font-bold text-gray-900 shrink-0">${fl.hourlyRate || 0}/hr</span>
                  </div>
                </button>
              ))}
            </div>
          )
        )}

        {tab === "jobs" && (
          jobs.length === 0 ? (
            <EmptyState title="No jobs found" description={`No jobs match "${query}". Try broader keywords.`} />
          ) : (
            <div className="space-y-3">
              {jobs.map((job: any) => (
                <div
                  key={job._id}
                  onClick={() => setSelectedJobDetail(job)}
                  className="bg-white/90 border border-gray-100/80 rounded-2xl p-5 hover:border-teal-300 hover:shadow-lg transition-all cursor-pointer shadow-sm group"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-teal-700 transition">{job.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                    </div>
                    <StatusBadge status={job.status} />
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                    <span className="font-bold text-gray-900">${job.budget?.toLocaleString()}</span>
                    {job.skills?.length > 0 && (
                      <div className="flex gap-1.5">
                        {job.skills.slice(0, 3).map((s: string) => (
                          <span key={s} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-[11px] rounded-md font-medium">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </main>

      {/* ── Freelancer detail popover ── */}
      {selectedFreelancer && (
        <Popover onClose={() => setSelectedFreelancer(null)}>
          <div className="flex items-start gap-4 mb-5">
            <Avatar person={{ _id: selectedFreelancer._id, firstName: selectedFreelancer.firstName, lastName: selectedFreelancer.lastName, profileImage: selectedFreelancer.profileImage }} size="xl" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedFreelancer.firstName} {selectedFreelancer.lastName}</h2>
              <p className="text-sm text-gray-500">{selectedFreelancer.title}</p>
              <p className="text-sm font-bold text-teal-700 mt-1">${selectedFreelancer.hourlyRate}/hr</p>
            </div>
          </div>
          {selectedFreelancer.bio && <p className="text-sm text-gray-600 mb-4 leading-relaxed">{selectedFreelancer.bio}</p>}
          {selectedFreelancer.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {selectedFreelancer.skills.map((s: string) => (
                <span key={s} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg font-medium">{s}</span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            {isClient && (
              <button onClick={() => { navigate(`/hire/${selectedFreelancer._id}`); setSelectedFreelancer(null); }}
                className="flex-1 py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition">
                Hire {selectedFreelancer.firstName}
              </button>
            )}
            <button onClick={() => { navigate(`/freelancers/${selectedFreelancer._id}`); setSelectedFreelancer(null); }}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition">
              Full profile
            </button>
          </div>
        </Popover>
      )}

      {/* ── Job detail popover ── */}
      {selectedJobDetail && (
        <Popover onClose={() => setSelectedJobDetail(null)}>
          <div className="flex items-start justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">{selectedJobDetail.title}</h2>
            <StatusBadge status={selectedJobDetail.status} />
          </div>
          <p className="text-sm text-gray-600 mb-5 leading-relaxed">{selectedJobDetail.description}</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Budget</p>
              <p className="text-sm font-bold text-gray-900">${selectedJobDetail.budget?.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-sm font-bold text-gray-900">{new Date(selectedJobDetail.deadline).toLocaleDateString()}</p>
            </div>
          </div>
          {selectedJobDetail.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-5">
              {selectedJobDetail.skills.map((s: string) => (
                <span key={s} className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs rounded-lg font-medium">{s}</span>
              ))}
            </div>
          )}
          {isFreelancer && (
            <button
              onClick={() => { handleApply(selectedJobDetail._id); setSelectedJobDetail(null); }}
              className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition"
            >
              Apply now
            </button>
          )}
          {!currentUser && (
            <button onClick={() => navigate("/login")} className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 transition">
              Log in to apply
            </button>
          )}
        </Popover>
      )}

      {/* ── Profile Edit Modal ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div ref={profileModalRef} tabIndex={-1} className="bg-white/95 backdrop-blur-sm rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl outline-none">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">Edit Profile</h2>
              <button onClick={() => setShowProfileModal(false)} className="text-gray-400 hover:text-gray-700 p-1">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4">
              {/* Avatar upload */}
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-teal-100 flex items-center justify-center shrink-0">
                  {formData.profileImage
                    ? <img src={formData.profileImage} alt="Avatar" className="w-full h-full object-cover" />
                    : <span className="text-teal-700 font-bold text-lg">{(formData.firstName[0] ?? "") + (formData.lastName[0] ?? "")}</span>
                  }
                </div>
                <div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm font-medium text-teal-700 hover:underline">
                    {isUploadingImage ? "Uploading…" : "Change photo"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[["firstName", "First name"], ["lastName", "Last name"]].map(([k, l]) => (
                  <label key={k} className="block">
                    <span className="text-xs font-medium text-gray-600">{l}</span>
                    <input
                      value={(formData as any)[k]}
                      onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
                      className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500"
                    />
                  </label>
                ))}
              </div>

              {[["title", "Professional title"], ["bio", "Bio"]].map(([k, l]) => (
                <label key={k} className="block">
                  <span className="text-xs font-medium text-gray-600">{l}</span>
                  {k === "bio"
                    ? <textarea rows={3} value={(formData as any)[k]} onChange={(e) => setFormData({ ...formData, [k]: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500 resize-none" />
                    : <input value={(formData as any)[k]} onChange={(e) => setFormData({ ...formData, [k]: e.target.value })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                  }
                </label>
              ))}

              {isFreelancer && (
                <label className="block">
                  <span className="text-xs font-medium text-gray-600">Hourly Rate ($/hr)</span>
                  <input type="number" value={formData.hourlyRate} onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })} className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-teal-500" />
                </label>
              )}

              {/* Skills */}
              {isFreelancer && (
                <div>
                  <span className="text-xs font-medium text-gray-600 block mb-2">Skills</span>
                  {Object.entries(SKILL_POOL).map(([cat, skills]) => (
                    <div key={cat} className="mb-3">
                      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1.5">{cat}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => toggleSkill(s)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                              selectedSkills.includes(s)
                                ? "bg-teal-600 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input
                      value={customSkill}
                      onChange={(e) => setCustomSkill(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customSkill.trim()) {
                          e.preventDefault();
                          if (!selectedSkills.includes(customSkill.trim())) setSelectedSkills([...selectedSkills, customSkill.trim()]);
                          setCustomSkill("");
                        }
                      }}
                      placeholder="Add custom skill…"
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="w-full py-2.5 bg-teal-600 text-white text-sm font-semibold rounded-xl hover:bg-teal-700 disabled:opacity-60 transition mt-2"
              >
                {isUpdatingProfile ? "Saving…" : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared slide-up popover used for freelancer / job detail ──

function Popover({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const timer = window.setTimeout(() => modalRef.current?.focus(), 0);
    document.body.style.overflow = "hidden";
    return () => {
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm">
      <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true" className="bg-white/95 backdrop-blur-sm w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl p-6 max-h-[85vh] overflow-y-auto relative outline-none">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 p-1">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {children}
      </div>
    </div>
  );
}