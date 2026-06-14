import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";

const HOW_IT_WORKS = [
  { n: "1", title: "Post your job", desc: "Tell us about your project requirements, timeline, and budget in just a few minutes." },
  { n: "2", title: "Browse proposals", desc: "Review profiles and proposals from top-rated freelancers who match your needs." },
  { n: "3", title: "Hire & collaborate", desc: "Work securely with built-in tools for messaging, payments, and progress tracking." },
];

const NAV_LINKS = [
  { label: "Find talent", path: "/search" },
  { label: "Find work", path: "/login" },
  { label: "Why us", path: "/" },
  { label: "Enterprise", path: "/signup" },
];

const POPULAR_TAGS = ["Web Design", "React Developer", "UI/UX Design", "Node.js", "WordPress"];
const TRUSTED_BY = ["Microsoft", "Airbnb", "Bisler", "GE", "Nasdaq", "Automatic"];
const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

function Logo({ size = "md" }: { size?: "sm" | "md" }) {
  const cls = size === "sm" ? "text-xl" : "text-xl sm:text-2xl";
  return (
    <span className={`${cls} font-bold tracking-tight`}>
      <span className="text-green-600">freelance</span>
      <span className="text-gray-900">fluxo</span>
    </span>
  );
}

function SectionBadge({ label }: { label: string }) {
  return (
    <div className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3">
      {label}
    </div>
  );
}

function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function FreelancerPlatform() {
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    platformService.getCategories().then(setCategories).catch(() => setCategories([]));
    platformService.getFreelancers().then(setFreelancers).catch(() => setFreelancers([]));
  }, []);

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      navigate("/search");
      return;
    }
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <Link to="/" aria-label="Home"><Logo /></Link>
          <div className="hidden md:flex items-center gap-1 mx-4">
            {NAV_LINKS.map(({ label, path }) => (
              <button key={label} onClick={() => navigate(path)}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 transition-colors whitespace-nowrap">
                {label}
              </button>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100" onClick={() => navigate("/login")}>Log in</button>
            <button className="px-4 py-2 border-2 border-green-600 text-green-600 rounded-full text-sm font-medium hover:bg-green-50" onClick={() => navigate("/signup")}>Sign up</button>
            <button className="px-4 py-2 bg-green-600 text-white rounded-full text-sm font-medium hover:bg-green-700" onClick={() => navigate("/signup?intent=post-job")}>Post a job</button>
          </div>
          <div className="flex md:hidden items-center gap-2">
            <button className="px-3 py-1.5 text-sm font-medium text-gray-700" onClick={() => navigate("/login")}>Log in</button>
            <button className="p-2 rounded-md hover:bg-gray-100" onClick={() => setMobileMenuOpen((v) => !v)} aria-label="Menu">
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
            {NAV_LINKS.map(({ label, path }) => (
              <button key={label} className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => { setMobileMenuOpen(false); navigate(path); }}>{label}</button>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button className="flex-1 py-2 border-2 border-green-600 text-green-600 rounded-full text-sm font-medium" onClick={() => { setMobileMenuOpen(false); navigate("/signup"); }}>Sign up</button>
              <button className="flex-1 py-2 bg-green-600 text-white rounded-full text-sm font-medium" onClick={() => { setMobileMenuOpen(false); navigate("/signup?intent=post-job"); }}>Post a job</button>
            </div>
          </div>
        )}
      </nav>

      <section className="bg-[#001e00] py-12 sm:py-16 lg:py-20 px-4 sm:px-6 lg:px-10 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-6">
            How work<br />should <em className="text-green-500 not-italic">work.</em>
          </h1>
          <div className="flex flex-col xs:flex-row bg-white rounded-lg overflow-hidden max-w-xl shadow-lg">
            <input type="search" placeholder="Search for any skill or service..." className="flex-1 border-none outline-none px-4 py-3.5 text-sm sm:text-base text-gray-800 min-w-0"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} />
            <button onClick={handleSearch} className="px-5 py-3 sm:py-3.5 bg-green-600 text-white font-semibold text-sm sm:text-base hover:bg-green-700 shrink-0">Search</button>
          </div>
          <div className="flex gap-2 flex-wrap items-center mt-4">
            <span className="text-xs sm:text-sm text-gray-400">Popular:</span>
            {POPULAR_TAGS.map((tag) => (
              <button key={tag} className="px-3 py-1 border border-white/25 rounded-full text-xs text-gray-200 bg-white/10 hover:border-green-500 hover:text-green-400"
                onClick={() => setSearchQuery(tag)}>{tag}</button>
            ))}
          </div>
        </div>
      </section>

      <div className="overflow-x-auto border-b border-gray-200">
        <div className="flex items-center gap-5 sm:gap-8 py-4 px-4 sm:px-6 lg:px-10 min-w-max sm:min-w-0 sm:flex-wrap">
          <span className="text-xs sm:text-sm text-gray-500 font-medium shrink-0">Trusted by</span>
          {TRUSTED_BY.map((brand) => <span key={brand} className="text-sm sm:text-base font-semibold text-gray-400 tracking-tight shrink-0">{brand}</span>)}
        </div>
      </div>

      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-5xl mx-auto">
          <SectionBadge label="Browse categories" />
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Explore talent by category</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-lg">Find skilled professionals across every field, ready to help your business grow.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
            {categories.map((cat) => (
              <button key={cat._id} className="bg-gray-50 rounded-xl p-4 sm:p-5 text-left border-2 border-transparent hover:border-green-600 hover:bg-white hover:-translate-y-0.5 hover:shadow-md transition-all"
                onClick={() => navigate(`/categories/${cat._id}`)}>
                <div className="text-2xl sm:text-3xl mb-2">{cat.icon}</div>
                <h3 className="text-xs sm:text-sm font-semibold text-gray-900 mb-0.5 leading-snug">{cat.title}</h3>
                <span className="text-[11px] sm:text-xs text-gray-500">{cat.skills}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <SectionBadge label="Top freelancers" />
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-2">Work with the best talent</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8 max-w-lg">Handpicked professionals with verified skills and top-rated reviews.</p>
          <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
            {freelancers.map((fl, i) => (
              <button key={fl._id} className="snap-start shrink-0 w-[72vw] xs:w-64 sm:w-auto bg-white border border-gray-200 rounded-xl p-4 sm:p-5 text-left hover:border-green-600 hover:shadow-md transition-all"
                onClick={() => navigate(`/freelancers/${fl._id}`)}>
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white mb-3" style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}>
                  {getInitials(`${fl.firstName} ${fl.lastName}`)}
                </div>
                <div className="font-semibold text-gray-900 text-sm mb-0.5">{fl.firstName} {fl.lastName}</div>
                <div className="text-xs text-gray-500 mb-2">{fl.title || "Freelancer"}</div>
                <div className="text-amber-500 text-xs mb-1.5">{renderStars(fl.rating || 5)} <span className="text-gray-500">({fl.reviewCount || 0})</span></div>
                <div className="font-semibold text-gray-800 text-sm">${fl.hourlyRate || 0}/hr</div>
                <div className="flex gap-1.5 flex-wrap mt-2">
                  {(fl.skills || []).slice(0, 3).map((skill: string) => (
                    <span key={skill} className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">{skill}</span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="py-10 sm:py-14 px-4 sm:px-6 lg:px-10 bg-white">
        <div className="max-w-4xl mx-auto">
          <SectionBadge label="How it works" />
          <h2 className="text-2xl sm:text-3xl font-semibold text-gray-900 text-center mb-8">Get started in minutes</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map(({ n, title, desc }) => (
              <div key={n} className="flex sm:flex-col items-start sm:items-center gap-4 sm:text-center p-4 sm:p-6">
                <div className="w-10 h-10 shrink-0 rounded-full bg-green-100 text-green-700 text-base font-bold flex items-center justify-center sm:mx-auto sm:mb-4">{n}</div>
                <div><h3 className="text-sm font-semibold text-gray-900 mb-1">{title}</h3><p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="bg-[#001e00] py-10 sm:py-14 px-4 sm:px-6 lg:px-10">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <h2 className="text-2xl sm:text-3xl font-semibold text-white leading-tight text-center sm:text-left">
            Ready to find the <em className="text-green-500 not-italic">perfect</em> freelancer?
          </h2>
          <div className="flex gap-3 shrink-0">
            <button className="px-5 py-2.5 bg-white text-gray-900 rounded-full text-sm font-semibold hover:opacity-85" onClick={() => navigate("/signup?intent=post-job")}>Post a job</button>
            <button className="px-5 py-2.5 bg-transparent text-white border border-white/40 rounded-full text-sm font-semibold hover:border-white" onClick={() => navigate("/search")}>Find freelancers</button>
          </div>
        </div>
      </div>

      <footer className="bg-gray-50 py-8 sm:py-10 px-4 sm:px-6 lg:px-10 border-t border-gray-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">For clients</h4>
              <button onClick={() => navigate("/signup?intent=post-job")} className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Post a job</button>
              <button onClick={() => navigate("/search")} className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Find talent</button>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">For freelancers</h4>
              <button onClick={() => navigate("/signup")} className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Find work</button>
              <button onClick={() => navigate("/login")} className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Log in</button>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Legal</h4>
              <Link to="/terms" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Terms of Service</Link>
              <Link to="/privacy" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Privacy Policy</Link>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-3">Company</h4>
              <Link to="/" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">About us</Link>
              <Link to="/login" className="block text-xs sm:text-sm text-gray-500 mb-2 hover:text-green-600">Contact</Link>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 mt-6 border-t border-gray-200">
            <Link to="/"><Logo /></Link>
            <span className="text-xs sm:text-sm text-gray-500">© {new Date().getFullYear()} FreelanceFluxo. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </>
  );
}
