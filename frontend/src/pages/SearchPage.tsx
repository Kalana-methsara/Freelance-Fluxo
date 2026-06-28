import { useEffect, useState, memo, useCallback, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import platformService from "../services/platformService";
import api from "../services/api";
import { getInitials } from "../utils/auth";

const AVATAR_COLORS = ["#059669", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

const SKILL_POOL = {
  "Development": ["React", "Node.js", "TypeScript", "JavaScript", "Python", "Java", "Spring Boot", "Express", "MongoDB", "PostgreSQL", "Next.js", "Docker"],
  "Design & Creative": ["UI/UX Design", "Figma", "Adobe Photoshop", "Illustrator", "Web Design", "Graphic Design"],
  "Writing & Translation": ["Content Writing", "Technical Writing", "Copywriting", "Translation", "SEO Writing"],
  "Marketing & Sales": ["SEO", "Digital Marketing", "Social Media Management", "Google Analytics", "Lead Generation"]
};

const STATUS_PILL: Record<string, string> = {
  approved: "bg-green-100 text-green-800 ring-green-600/20",
  rejected: "bg-red-100 text-red-700 ring-red-600/20",
  pending: "bg-amber-100 text-amber-700 ring-amber-600/20",
  open: "bg-emerald-100 text-emerald-700 ring-emerald-600/20",
  closed: "bg-gray-100 text-gray-600 ring-gray-400/20",
  active: "bg-green-100 text-green-800 ring-green-600/20",
};

// STATUS_STYLES removed (local StatusBadge not used)

function avatarColor(id: string) {
  if (!id) return AVATAR_COLORS[0];
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

const Logo = memo(() => (
  <span className="font-serif text-xl tracking-tight text-gray-900">
    freelance<em className="italic text-emerald-600">fluxo</em>
  </span>
));

// local StatusBadge removed (use shared component from /components/Statusbadge.tsx)
const StatusPill = ({ status }: { status: string }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset capitalize ${STATUS_PILL[status?.toLowerCase()] ?? "bg-gray-100 text-gray-600 ring-gray-400/20"
      }`}
  >
    {status}
  </span>
);


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
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // ── Freelancer Detail Popup ──
  const [selectedFreelancer, setSelectedFreelancer] = useState<any | null>(null);

  // ── Job Detail Popup ──
  const [selectedJobDetail, setSelectedJobDetail] = useState<any | null>(null);

  const [customSkill, setCustomSkill] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form States
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    profileImage: "",
    title: "",
    bio: "",
    hourlyRate: 0,
    companyName: "",
    address: "",
    city: "",
    province: "",
    country: "",
    lat: 6.0329,
    lng: 80.2170
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Local Storage Sync
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        setCurrentUser(parsed);

        setFormData({
          firstName: parsed.firstName || "",
          lastName: parsed.lastName || "",
          email: parsed.email || "",
          profileImage: parsed.profileImage || "",
          title: parsed.title || "",
          bio: parsed.bio || "",
          hourlyRate: parsed.hourlyRate || 0,
          companyName: parsed.companyName || "",
          address: parsed.location?.address || "",
          city: parsed.location?.city || "",
          province: parsed.location?.province || "",
          country: parsed.location?.country || "",
          lat: parsed.location?.coordinates?.lat || 6.0329,
          lng: parsed.location?.coordinates?.lng || 80.2170
        });

        if (parsed.skills && Array.isArray(parsed.skills)) {
          setSelectedSkills(parsed.skills);
        } else if (parsed.skills) {
          setSelectedSkills(String(parsed.skills).split(",").map(s => s.trim()).filter(Boolean));
        } else {
          setSelectedSkills([]);
        }
      }
    } catch (e) {
      console.error("Error loading user data from local storage", e);
    }
  }, [showModal]);

  const roles = currentUser?.userRole || currentUser?.roles || [];
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

  // ── 📸 Laptop එකෙන් Image එක අරන් Cloudinary යවන තැන ──
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    setIsUploadingImage(true);
    try {
      const res = await api.post("/upload/upload-avatar", data, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data && res.data.url) {
        setFormData(prev => ({ ...prev, profileImage: res.data.url }));

        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const parsed = JSON.parse(storedUser);
          parsed.profileImage = res.data.url;
          localStorage.setItem("user", JSON.stringify(parsed));
          setCurrentUser(parsed);
        }
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Failed to upload image to Cloudinary.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
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

  const checkIsProfileComplete = (user: any) => {
    if (!user) return false;
    return !!(
      user.firstName?.trim() &&
      user.lastName?.trim() &&
      user.email?.trim() &&
      user.title?.trim() &&
      user.bio?.trim() &&
      user.profileImage?.trim() &&
      Number(user.hourlyRate) > 0 &&
      user.skills?.length > 0 &&
      user.location?.address?.trim() &&
      user.location?.city?.trim() &&
      user.location?.province?.trim() &&
      user.location?.country?.trim()
    );
  };

  const handleApplyClick = useCallback((e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    const isProfileComplete = checkIsProfileComplete(currentUser);

    if (isProfileComplete) {
      navigate(`/jobs/${jobId}`);
    } else {
      setSelectedJobId(jobId);
      setShowModal(true);
    }
  }, [currentUser, navigate]);

  // ── Freelancer Detail Popup Open ──
  // handleOpenFreelancer removed (not used)

  // ── Job Detail Popup Open ──
  const handleOpenJob = useCallback((e: React.MouseEvent, job: any) => {
    e.stopPropagation();
    setSelectedJobDetail(job);
  }, []);

  // ── 1. handleHireClick function එක (Patch) ──
  const handleHireClick = useCallback((e: React.MouseEvent, freelancerId: string) => {
    e.stopPropagation();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    // ── Client payment method check ──
    const hasPayment = !!(
      currentUser.paymentMethod?.cardLast4 ||
      currentUser.paymentMethod?.walletBalance > 0
    );

    if (!hasPayment) {
      // Payment නැත්නම් HireFreelancerPage ම redirect කරනවා
      // ඒ page එකෙන්ම payment modal handle වෙනවා
      navigate(`/hire/${freelancerId}`);
      return;
    }

    navigate(`/hire/${freelancerId}`);
  }, [currentUser, navigate]);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      alert("Please select at least one skill!");
      return;
    }
    setIsUpdatingProfile(true);

    try {
      const updatedPayload = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        profileImage: formData.profileImage.trim(),
        title: formData.title.trim(),
        bio: formData.bio.trim(),
        hourlyRate: Number(formData.hourlyRate),
        companyName: formData.companyName.trim(),
        skills: selectedSkills,
        location: {
          address: formData.address.trim(),
          city: formData.city.trim(),
          province: formData.province.trim(),
          country: formData.country.trim(),
          coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) }
        }
      };

      const updatedUser = await platformService.updateProfile(updatedPayload);

      const fullUpdatedUser = {
        ...currentUser,
        ...(updatedUser || updatedPayload),
      };

      localStorage.setItem("user", JSON.stringify(fullUpdatedUser));
      setCurrentUser(fullUpdatedUser);
      setShowModal(false);

      if (selectedJobId) {
        navigate(`/jobs/${selectedJobId}`);
      }
    } catch (error: any) {
      console.error("Profile update failed:", error);
      alert("Something went wrong while updating your profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // JobsTab removed (not used in this page)

  const userFullName = currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "User";

  // ── Freelancer Detail Popup Component ──
  const FreelancerDetailModal = () => {
    if (!selectedFreelancer) return null;
    const fl = selectedFreelancer;
    const flName = `${fl.firstName} ${fl.lastName}`;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedFreelancer(null)}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div
          className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">Freelancer Profile</p>
              <h3 className="text-lg font-semibold text-gray-900">{flName}</h3>
            </div>
            <button
              onClick={() => setSelectedFreelancer(null)}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {/* Avatar + Basic Info */}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-gray-200 shrink-0 bg-gray-100 flex items-center justify-center">
                {fl.profileImage ? (
                  <img src={fl.profileImage} alt={flName} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm font-bold text-gray-400">{getInitials(flName)}</span>
                )}
              </div>
              <div>
                <p className="text-base font-semibold text-gray-900">{flName}</p>
                <p className="text-xs font-medium text-emerald-600 mt-0.5">{fl.title || "Professional Freelancer"}</p>
                {fl.email && <p className="text-xs text-gray-400 mt-0.5">{fl.email}</p>}
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Hourly Rate</p>
                <p className="text-sm font-semibold text-gray-800">${fl.hourlyRate || 0}<span className="text-gray-400 font-normal text-xs">/hr</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Location</p>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {[fl.location?.city, fl.location?.country].filter(Boolean).join(", ") || "—"}
                </p>
              </div>
              {fl.rating != null && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Rating</p>
                  <p className="text-sm font-semibold text-gray-800">⭐ {fl.rating} <span className="text-gray-400 text-xs font-normal">({fl.reviewCount || 0} reviews)</span></p>
                </div>
              )}
              {fl.companyName && (
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Company</p>
                  <p className="text-sm font-medium text-gray-800">{fl.companyName}</p>
                </div>
              )}
            </div>

            {/* Bio */}
            {fl.bio && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Bio</p>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                  <p className="text-sm text-gray-700 leading-relaxed">{fl.bio}</p>
                </div>
              </div>
            )}

            {/* Skills */}
            {fl.skills?.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Skills</p>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-wrap gap-2">
                  {fl.skills.map((s: string) => (
                    <span key={s} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg shadow-sm">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex gap-3">
              <button
                onClick={() => { setSelectedFreelancer(null); navigate(`/freelancers/${fl._id}`); }}
                className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
              >
                View Full Profile
              </button>
              {isClient && (
                <button
                  onClick={(e) => { setSelectedFreelancer(null); handleHireClick(e, fl._id); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
                >
                  Hire Now
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-sans flex flex-col">
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

          <div className="shrink-0 flex items-center gap-4">
            <Link
              to={isFreelancer ? "/dashboard/freelancer" : isClient ? "/dashboard/client" : "/"}
              className="hidden md:inline-block text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-2 transition"
            >
              Back to Home
            </Link>

            {currentUser ? (
              <div
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 pl-2 border-l border-gray-200 cursor-pointer rounded-xl p-1 hover:bg-gray-50 transition"
                title="Edit Profile"
              >
                {currentUser.profileImage ? (
                  <img
                    src={currentUser.profileImage}
                    alt={userFullName}
                    className="w-8 h-8 rounded-full object-cover border border-emerald-500 shadow-xs"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs"
                    style={{ background: avatarColor(currentUser._id || '') }}
                  >
                    {getInitials(userFullName)}
                  </div>
                )}
                <span className="text-xs font-semibold text-gray-700 hidden sm:inline max-w-[100px] truncate">
                  {currentUser.firstName}
                </span>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-emerald-600 hover:text-emerald-700">
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ── SEARCH RESULTS MAIN CONTENT ── */}
      <main className="flex-1 pt-24 px-4 sm:px-6 lg:px-8 pb-12 max-w-6xl mx-auto w-full space-y-10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {query ? `Results for “${query}”` : "Browse talent & open jobs"}
          </h1>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <p className="text-gray-400 text-sm animate-pulse font-medium">Loading search items…</p>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Freelancers Section */}
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
                    {/* ── 2. Freelancer Card JSX Updated with Patch ── */}
                    {data?.freelancers?.map((fl: any) => (
                      <div
                        key={fl._id}
                        onClick={() => navigate(`/freelancers/${fl._id}`)}
                        className="bg-white border border-gray-200 rounded-2xl p-5 text-left hover:border-emerald-600 hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between"
                      >
                        <div>
                          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black mb-3 shadow-sm overflow-hidden border bg-gray-100">
                            {fl.profileImage ? (
                              <img src={fl.profileImage} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-sm font-bold text-gray-400">
                                {getInitials(`${fl.firstName} ${fl.lastName}`)}
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900 text-base group-hover:text-emerald-700 transition">
                            {fl.firstName} {fl.lastName}
                          </h3>
                          <p className="text-xs font-medium text-emerald-600 mt-0.5">
                            {fl.title || "Professional Freelancer"}
                          </p>
                          {fl.bio ? (
                            <p className="mt-2 text-sm text-gray-600 leading-relaxed line-clamp-3">
                              {fl.bio}
                            </p>
                          ) : (
                            <p className="mt-2 text-sm text-gray-400">Professional bio coming soon.</p>
                          )}
                          <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-gray-400">
                              <path fillRule="evenodd" d="M9.695 1.5a.75.75 0 0 1 .61 0l6.75 2.812a.75.75 0 0 1 .445.69v5.56a8.25 8.25 0 0 1-4.2 7.16L10 19.5l-2.3-1.78a8.25 8.25 0 0 1-4.2-7.16v-5.56a.75.75 0 0 1 .445-.69L9.695 1.5Zm.305 2.06-5.25 2.188v4.936a6.75 6.75 0 0 0 3.45 5.86l1.8 1.39 1.8-1.39a6.75 6.75 0 0 0 3.45-5.86V5.748l-5.25-2.188Z" clipRule="evenodd" />
                            </svg>
                            <span>
                              {fl.location?.city || fl.location?.province || fl.location?.country
                                ? [fl.location?.city, fl.location?.province, fl.location?.country].filter(Boolean).join(", ")
                                : "Location not added yet"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 mt-2 flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 text-sm">
                            ${fl.hourlyRate || 0}
                            <span className="text-gray-400 font-normal text-xs">/hr</span>
                          </p>

                          <div className="flex items-center gap-2">
                            {isClient && (
                              <button
                                type="button"
                                onClick={(e) => handleHireClick(e, fl._id)}
                                className="px-3.5 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-600/10 transition-all shrink-0"
                              >
                                Hire
                              </button>
                            )}
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

            {/* Jobs Section */}
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
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => handleOpenJob(e, job)}
                            className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-all shrink-0"
                          >
                            Open
                          </button>
                          
                          {(isFreelancer || (!isFreelancer && !isClient)) && (
                            <button
                              type="button"
                              onClick={(e) => handleApplyClick(e, job._id)}
                              className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm shadow-emerald-600/10 transition-all"
                            >
                              Apply Now
                            </button>
                          )}
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

      {/* ── 👤 FREELANCER DETAIL POPUP ── */}
      <FreelancerDetailModal />

      {/* ── 💼 JOB DETAIL POPUP ── */}
      {selectedJobDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedJobDetail(null)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto bg-white rounded-3xl border border-gray-200 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-0.5">Job Details</p>
                <h3 className="text-lg font-semibold text-gray-900">{selectedJobDetail.title}</h3>
              </div>
              <button
                onClick={() => setSelectedJobDetail(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition"
              >
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-5">
              {/* Status + Budget grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1.5">Status</p>
                  <StatusPill status={selectedJobDetail.status || "open"} />
                </div>
                <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                  <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Budget</p>
                  <p className="text-sm font-semibold text-gray-800">${selectedJobDetail.budget || "—"}</p>
                </div>
                {selectedJobDetail.deadline && (
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Deadline</p>
                    <p className="text-sm font-medium text-gray-800">{selectedJobDetail.deadline}</p>
                  </div>
                )}
                {selectedJobDetail.createdAt && (
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
                    <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-1">Posted</p>
                    <p className="text-sm font-medium text-gray-800">
                      {new Date(selectedJobDetail.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Client info */}
              {(selectedJobDetail.clientId?.firstName || selectedJobDetail.clientId?.companyName) && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Client</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-sm font-medium text-gray-800">
                      {selectedJobDetail.clientId?.firstName
                        ? `${selectedJobDetail.clientId.firstName} ${selectedJobDetail.clientId.lastName || ""}`.trim()
                        : selectedJobDetail.clientId?.companyName}
                    </p>
                    {selectedJobDetail.clientId?.email && (
                      <p className="text-xs text-gray-400 mt-0.5">{selectedJobDetail.clientId.email}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Skills required */}
              {selectedJobDetail.skills?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Skills Required</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex flex-wrap gap-2">
                    {selectedJobDetail.skills.map((s: string) => (
                      <span key={s} className="text-xs bg-white border border-gray-200 text-gray-600 px-2.5 py-1 rounded-lg shadow-sm">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedJobDetail.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">Description</p>
                  <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selectedJobDetail.description}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => setSelectedJobDetail(null)}
                  className="flex-1 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
                >
                  Cancel
                </button>
                {(isFreelancer || (!isFreelancer && !isClient)) && (
                  <button
                    onClick={(e) => { setSelectedJobDetail(null); handleApplyClick(e as any, selectedJobDetail._id); }}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-sm"
                  >
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 📌 MODAL FORM ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden transform transition-all border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Complete Your Full Profile Details</h3>
                <p className="text-xs text-gray-500">Verify your data and avatar image before applying.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition">
                <svg fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* SECTION 1: PERSONAL INFO */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">1. Personal Information</h4>

                <div className="flex items-center gap-4 mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-gray-200 border-2 border-white shadow-md shrink-0 flex items-center justify-center">
                    {formData.profileImage ? (
                      <img src={formData.profileImage} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-gray-400 font-bold">No Image</span>
                    )}
                    {isUploadingImage && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-[10px] text-white font-medium animate-pulse">
                        Uploading...
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-gray-700 block">Profile Picture</span>
                    <p className="text-[11px] text-gray-400 mb-1.5">Upload a clean professional portrait from your computer</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-100 shadow-xs transition disabled:opacity-50"
                    >
                      {formData.profileImage ? "Change Image" : "Select Image from Laptop"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-400 outline-none"
                    readOnly
                  />
                </div>
              </div>

              {/* SECTION 2: PROFESSIONAL DETAILS */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">2. Professional Profiles</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Professional Title</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g. Fullstack Developer"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Hourly Rate ($/hr)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={formData.hourlyRate || ""}
                      onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name (Optional)</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Professional Bio</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500 resize-none"
                  />
                </div>
              </div>

              {/* SECTION 3: SKILL SELECTOR */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center justify-between border-b pb-1">
                  <span>3. Select Your Skills</span>
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{selectedSkills.length} Selected</span>
                </h4>

                {selectedSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-xl border border-dashed border-gray-200 mb-3">
                    {selectedSkills.map(skill => (
                      <span key={skill} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-medium">
                        {skill}
                        <button type="button" onClick={() => toggleSkill(skill)} className="hover:bg-emerald-700 p-0.5 rounded-full">✕</button>
                      </span>
                    ))}
                  </div>
                )}

                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={handleAddCustomSkill}
                  placeholder="Type a custom skill and press 'Enter'..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs mb-3 focus:outline-none focus:border-emerald-500"
                />

                <div className="space-y-3 max-h-48 overflow-y-auto border p-3 rounded-xl bg-white shadow-inner">
                  {Object.entries(SKILL_POOL).map(([category, skills]) => (
                    <div key={category} className="space-y-1">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">{category}</span>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.map(skill => {
                          const isSelected = selectedSkills.includes(skill);
                          return (
                            <button
                              type="button" key={skill} onClick={() => toggleSkill(skill)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border ${isSelected ? "bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold" : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                              {skill} {isSelected && "✓"}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* SECTION 4: LOCATION INFO */}
              <div>
                <h4 className="text-sm font-bold text-gray-800 mb-3 border-b pb-1">4. Location Info</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                      <input
                        type="text" required value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Province</label>
                      <input
                        type="text" required value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Country</label>
                      <input
                        type="text" required value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-200 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProfile || isUploadingImage}
                  className="px-5 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUpdatingProfile ? "Syncing Database..." : "Save Profile & Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}