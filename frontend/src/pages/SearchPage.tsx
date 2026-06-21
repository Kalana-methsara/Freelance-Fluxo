// ============================================================
// SearchPage.tsx – With Conditional Profile Completion Form
// ============================================================

import { useEffect, useState, memo, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import platformService from "../services/platformService";
// userService එකක් තියෙනවා නම් ඒකෙන් profile update කරන්න පුළුවන්
// import userService from "../services/userService"; 
import { getInitials } from "../utils/auth";

const AVATAR_COLORS = ["#059669", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-blue-50 text-blue-700 border-blue-100',
  open: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-100',
  completed: 'bg-purple-50 text-purple-700 border-purple-100',
};

function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const Logo = memo(() => (
  <span className="font-serif text-xl tracking-tight text-gray-900">
    freelance<em className="italic text-emerald-600">fluxo</em>
  </span>
));

const StatusBadge = memo(({ status }: { status: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border capitalize ${STATUS_STYLES[status?.toLowerCase()] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
    {status?.replace('_', ' ')}
  </span>
));

function renderStars(rating: number) {
  return "★".repeat(Math.min(5, Math.max(0, rating))) + "☆".repeat(Math.min(5, Math.max(0, 5 - rating)));
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  
  const [data, setData] = useState<{ freelancers: any[]; jobs: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  // ── Modal & Profile States ──
  const [showModal, setShowModal] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Form State Fields
  const [formData, setFormData] = useState({
    title: "",
    bio: "",
    hourlyRate: 0,
    skills: "",
    address: "",
    city: "",
    country: ""
  });

  // Local Storage එකෙන් දැනට ලොග් වෙලා ඉන්න User ව ගන්නවා
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);
        
        // Form එකට දැනට තියෙන දත්ත pre-fill කරනවා
        setFormData({
          title: parsed.title || "",
          bio: parsed.bio || "",
          hourlyRate: parsed.hourlyRate || 0,
          skills: parsed.skills ? parsed.skills.join(", ") : "",
          address: parsed.location?.address || "",
          city: parsed.location?.city || "",
          country: parsed.location?.country || ""
        });
      }
    } catch (e) {
      console.error("Error loading user data", e);
    }
  }, [showModal]); // Modal එක ඇරෙන හැම පාරම sync වෙනවා

  const roles = currentUser?.roles || [];
  const isFreelancer = roles.map((r: string) => String(r).toUpperCase()).includes("FREELANCER");
  const isClient = roles.map((r: string) => String(r).toUpperCase()).includes("CLIENT");
  
  const showFreelancersSection = isClient || (!isFreelancer && !isClient);
  const showJobsSection = isFreelancer || (!isFreelancer && !isClient);

  useEffect(() => {
    setLoading(true);
    platformService
      .search(query)
      .then(setData)
      .catch(() => setData({ freelancers: [], jobs: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = useCallback(() => {
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }, [searchInput, navigate]);

  // ── Profile එක සම්පූර්ණද කියලා Check කරන Function එක ──
  const checkIsProfileComplete = (user: any) => {
    if (!user) return false;
    return !!(
      user.title?.trim() &&
      user.bio?.trim() &&
      user.hourlyRate > 0 &&
      user.skills?.length > 0 &&
      user.location?.address?.trim()
    );
  };

  const handleApplyClick = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation(); // Row click navigation එක නවත්තනවා
    
    // User ලොග් වෙලා නැත්නම් login එකට යවනවා
    if (!currentUser) {
      navigate("/login");
      return;
    }

    // Profile එක complete ද කියලා බලනවා
    const isProfileComplete = checkIsProfileComplete(currentUser);

    if (isProfileComplete) {
      // Profile එක හරිනම් කෙළින්ම Apply Page එකට යවනවා
      navigate(`/jobs/${jobId}/apply`);
    } else {
      // අඩුපාඩු තියෙනවා නම් Form Modal එක පෙන්වනවා
      setSelectedJobId(jobId);
      setShowModal(true);
    }
  }, [currentUser, navigate]);

  // ── Profile Form එක Submit කරලා Update කරන එක ──
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const updatedPayload = {
        ...currentUser,
        title: formData.title,
        bio: formData.bio,
        hourlyRate: Number(formData.hourlyRate),
        skills: formData.skills.split(",").map(s => s.trim()).filter(Boolean),
        location: {
          ...currentUser.location,
          address: formData.address,
          city: formData.city,
          country: formData.country,
        }
      };

      // Backend API එකට Update request එක යවන්න (ඔයාගේ API එකට ගැලපෙන සේ වෙනස් කරගන්න)
      // await userService.updateProfile(updatedPayload);
      
      // Local Storage එක update කරනවා අලුත් දත්ත වලින්
      localStorage.setItem("user", JSON.stringify(updatedPayload));
      setCurrentUser(updatedPayload);
      setShowModal(false);

      // Profile එක සාර්ථකව Update වුනාට පස්සේ කෙළින්ම Apply route එකට යවනවා
      if (selectedJobId) {
        navigate(`/jobs/${selectedJobId}/apply`);
      }
    } catch (error) {
      alert("Failed to update profile. Please try again.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans flex flex-col">
      {/* ── HEADER NAVBAR ── */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4 justify-between w-full">
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <Logo />
          </Link>

          <div className="flex-1 max-w-xl flex bg-white rounded-xl p-1 overflow-hidden border border-gray-200 focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-500/10 transition shadow-sm">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for talent, skills, or jobs..."
              className="flex-1 border-none outline-none pl-4 pr-2 py-1.5 text-sm text-gray-800 min-w-0 placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="w-9 h-9 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-800 transition shrink-0 shadow-sm"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 1 5.196 5.196a7.5 7.5 0 0 1 10.603 10.603Z" />
              </svg>
            </button>
          </div>

          <div className="shrink-0 hidden sm:block">
            <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 rounded-xl transition">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* ── SEARCH RESULTS MAIN CONTENT ── */}
      <main className="flex-1 pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto w-full space-y-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {query ? `Results for “${query}”` : "Browse talent & open jobs"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">Found matching services on freelancefluxo platform</p>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <p className="text-gray-400 text-sm animate-pulse font-medium">Loading search items…</p>
          </div>
        ) : (
          <div className="space-y-12">
            
            {/* ── 1. FREELANCERS SECTION ── */}
            {showFreelancersSection && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Available Freelancers</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {data?.freelancers?.length || 0}
                  </span>
                </div>
                
                {data?.freelancers?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {data.freelancers.map((fl: any) => (
                      <div
                        key={fl._id}
                        onClick={() => navigate(`/freelancers/${fl._id}`)}
                        className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-emerald-600 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black mb-3 shadow-sm"
                            style={{ background: avatarColor(fl._id) }}
                          >
                            {getInitials(`${fl.firstName} ${fl.lastName}`)}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-base group-hover:text-emerald-700 transition">
                            {fl.firstName} {fl.lastName}
                          </h3>
                          <p className="text-xs font-medium text-emerald-600 mt-0.5">
                            {fl.title || "Professional Freelancer"}
                          </p>
                          
                          <div className="flex items-center gap-1.5 text-amber-500 text-xs my-2 font-medium">
                            <span>{renderStars(fl.rating || 5)}</span>
                            <span className="text-gray-400 font-normal">({fl.reviewCount || 0})</span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 mt-2 flex flex-col gap-3">
                          <p className="font-bold text-gray-900 text-sm">
                            ${fl.hourlyRate || 0}<span className="text-gray-400 font-normal text-xs">/hr</span>
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            {(fl.skills || []).slice(0, 3).map((skill: string) => (
                              <span
                                key={skill}
                                className="px-2 py-0.5 bg-gray-50 border border-gray-100 rounded-lg text-[11px] text-gray-500 font-medium"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                    No talent found matching your filters.
                  </div>
                )}
              </section>
            )}

            {/* ── 2. JOBS SECTION ── */}
            {showJobsSection && (
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-gray-800 tracking-tight">Open Opportunities</h2>
                  <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-semibold">
                    {data?.jobs?.length || 0}
                  </span>
                </div>

                {data?.jobs?.length ? (
                  <div className="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100 shadow-sm overflow-hidden">
                    {data.jobs.map((job: any) => (
                      <div
                        key={job._id}
                        onClick={() => navigate(`/jobs/${job._id}`)}
                        className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors cursor-pointer group"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <h3 className="font-semibold text-gray-900 text-base group-hover:text-emerald-700 transition truncate">
                            {job.title}
                          </h3>
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 flex-wrap">
                            <span className="font-medium text-gray-700">
                              {job.clientId?.companyName || `${job.clientId?.firstName || ""} ${job.clientId?.lastName || ""}`.trim() || 'Client'}
                            </span>
                            <span>•</span>
                            <span className="text-emerald-600 font-semibold">${job.budget?.toLocaleString()} Budget</span>
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                          <StatusBadge status={job.status || "open"} />
                          
                          <button
                            type="button"
                            onClick={(e) => handleApplyClick(e, job._id)}
                            className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm hover:shadow transition-all duration-200"
                          >
                            Apply Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-500">
                    No open freelance project postings available.
                  </div>
                )}
              </section>
            )}
          </div>
        )}
      </main>

      {/* ── 3. MODAL POPUP: COMPLETE PROFILE FORM ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden transform transition-all border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Complete Your Profile</h3>
                <p className="text-xs text-gray-500">You must fill in these details before applying for a job.</p>
              </div>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Professional Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Professional Title</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Full-Stack Developer"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Hourly Rate */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Hourly Rate ($)</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.hourlyRate || ""}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                  placeholder="e.g. 35"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Skills Input */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Skills (Comma separated)</label>
                <input
                  type="text"
                  required
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="React, Node.js, TypeScript, UI Design"
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Professional Bio */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Professional Bio</label>
                <textarea
                  required
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell clients about your expertise, experience, and workflow..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Location Data */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Address</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Colombo"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Country</label>
                  <input
                    type="text"
                    required
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    placeholder="Sri Lanka"
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition disabled:opacity-50"
                >
                  {isUpdatingProfile ? "Saving..." : "Save & Apply Now"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}