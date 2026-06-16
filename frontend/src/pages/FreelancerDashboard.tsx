import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";
import TechStack from "../components/Skills";
import Slide from "../components/Slide";
import CatCard from "../components/CatCard";
import { cards, items } from "../../data";


const HOW_IT_WORKS = [
  { n: "1", title: "Post your job", desc: "Tell us about your project requirements, timeline, and budget in just a few minutes." },
  { n: "2", title: "Browse proposals", desc: "Review profiles and proposals from top-rated freelancers who match your needs." },
  { n: "3", title: "Hire & collaborate", desc: "Work securely with built-in tools for messaging, payments, and progress tracking." },
];

const NAV_LINKS = [
 { label: "Overview", id: "overview" },
  { label: "My Jobs", id: "jobs" },
  { label: "Proposals", id: "proposals" },
  { label: "Earnings", id: "earnings" },
  { label: "Messages", id: "messages" },
  { label: "Profile", id: "profile" },
];

const POPULAR_TAGS = ["Web Design", "React Developer", "UI/UX Design", "Node.js", "WordPress"];
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
  const [, setCategories] = useState<any[]>([]);
  const [freelancers, setFreelancers] = useState<any[]>([]);
  const [isVideoPlaying, setIsVideoPlaying] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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

  const toggleVideoPlayback = (): void => {
    if (!videoRef.current) return;
    if (isVideoPlaying) {
      videoRef.current.pause();
      setIsVideoPlaying(false);
    } else {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  return (
    <>
      {/* ─── NAV ─── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3">
          <Link to="/" aria-label="Home"><Logo /></Link>
          <div className="hidden md:flex items-center gap-1 mx-4">
            {NAV_LINKS.map(({ label, id }) => (
              <button key={label} onClick={() => navigate(id)}
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
            {NAV_LINKS.map(({ label, id }) => (
              <button key={label} className="w-full text-left px-3 py-2.5 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100"
                onClick={() => { setMobileMenuOpen(false); navigate(id); }}>{label}</button>
            ))}
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <button className="flex-1 py-2 border-2 border-green-600 text-green-600 rounded-full text-sm font-medium" onClick={() => { setMobileMenuOpen(false); navigate("/signup"); }}>Sign up</button>
              <button className="flex-1 py-2 bg-green-600 text-white rounded-full text-sm font-medium" onClick={() => { setMobileMenuOpen(false); navigate("/signup?intent=post-job"); }}>Post a job</button>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden min-h-105 sm:min-h-155 lg:min-h-160 flex flex-col justify-between py-8 sm:py-16 lg:py-20 px-6 sm:px-12 lg:px-16">

        {/* Mobile: solid gradient fallback (no video) */}
        <div className="sm:hidden absolute inset-0 z-0 bg-linear-to-br from-green-900 via-green-700 to-green-600" />

        {/* Desktop: video background */}
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="hidden sm:block absolute inset-0 w-full h-full object-cover z-0 brightness-[0.75]"
        >
          <source src="/DesktopHeader.webm" type="video/webm" />
        </video>

        {/* Overlay — subtle dark tint for text legibility on both mobile + desktop */}
        <div className="absolute inset-0 z-10 bg-black/20" />

        {/* Center Content */}
        <div className="max-w-5xl w-full mx-auto relative z-20 flex-1 flex flex-col justify-center">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6 sm:mb-8 tracking-tight max-w-3xl">
            Our freelancers <br />will take it from here
          </h1>

          {/* Search Bar */}
          <div className="flex bg-white rounded-lg p-1.5 overflow-hidden max-w-xl sm:max-w-3xl shadow-2xl items-center">
            <input
              type="search"
              placeholder="Search for any service..."
              className="flex-1 border-none outline-none pl-4 sm:pl-5 pr-3 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base text-gray-800 min-w-0 placeholder-gray-400 font-light"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="w-10 h-10 sm:w-11 sm:h-11 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-800 transition shrink-0 mr-0.5 sm:mr-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 1 5.196 5.196a7.5 7.5 0 0 1 10.603 10.603Z" />
              </svg>
            </button>
          </div>

          {/* Popular Tags */}
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

        {/* Bottom Row: Trusted Logos + Pause Button */}
        <div className="max-w-5xl w-full mx-auto relative z-20 mt-8 sm:mt-12 flex flex-wrap items-center justify-between gap-4 sm:gap-6">
          <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
            <span className="text-xs text-gray-300 font-medium tracking-wide">Trusted by:</span>
            <div className="flex items-center gap-4 sm:gap-8 flex-wrap font-sans text-xs sm:text-base text-white/70 font-semibold select-none">
              <span className="tracking-tighter font-bold text-white/80">Meta</span>
              <span className="font-medium text-white/80">Google</span>
              <span className="font-black tracking-widest text-[10px] sm:text-sm text-white/80">NETFLIX</span>
              <span className="font-bold italic text-white/80">P&G</span>
              <span className="font-bold tracking-tight text-white/80">PayPal</span>
              <span className="hidden sm:inline font-medium text-white/80">Payoneer</span>
            </div>
          </div>

          {/* Video Pause Button — desktop only */}
          <button
            onClick={toggleVideoPlayback}
            className="hidden sm:flex w-8 h-8 rounded-full border border-white/20 bg-black/30 items-center justify-center text-white/80 hover:bg-white/20 transition text-xs"
          >
            {isVideoPlaying ? 'Ⅱ' : '▶'}
          </button>
        </div>
      </section>
<Slide slidesToShow={5} arrowsScroll={5}>
      {cards.map((card) => (
        <CatCard key={card.id} card={card} />
      ))}
    </Slide>
  <section className="flex justify-center -mt-10 mb-10 overflow-hidden w-full">
  <div className="w-350 max-[500px]:w-full max-[500px]:px-4">
    
    {/* 💻 Desktop එකේදී සාමාන්‍ය විදිහට පේනවා (No Auto-scroll) */}
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

    {/* 📱 Mobile (max-width: 500px) එකේදී විතරක් Auto Move වෙනවා */}
    <div 
      className="flex min-[501px]:hidden w-full overflow-hidden"
      style={{
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
      }}
    >
      <div 
        className="flex flex-nowrap gap-4 animation-marquee"
        style={{
          display: 'flex',
          width: 'max-content',
          animation: 'scrollMarquee 20s linear infinite'
        }}
      >
        {/* Array එක දෙපාරක් map කරනවා නොනැවතී loop වෙන්න */}
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

    {/* 🛠️ Animation එක වැඩ කරන්න මේ CSS ටික Global CSS (index.css) එකට හෝ මෙතනටම දාන්න */}
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes scrollMarquee {
        0% { transform: translate3d(0, 0, 0); }
        100% { transform: translate3d(-50%, 0, 0); }
      }
    `}} />

  </div>
</section>

      <section>
        <img src="/web_page.png" alt="Web page preview" className="w-full" />
      </section>

      {/* ─── FREELANCERS ─── */}
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

      <TechStack />

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-10 md:py-14 px-4 sm:px-6 lg:px-6 bg-linear-to-b from-white to-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <SectionBadge label="How it works" />
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 text-center mb-10 md:mb-16">
            Get started in minutes
            <div className="w-16 h-1 bg-linear-to-b from-green-500 to-emerald-400 rounded-full mx-auto mt-4"></div>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map(({ n, title, desc }) => (
              <div
                key={n}
                className="group flex sm:flex-col items-start sm:items-center gap-5 sm:gap-6 
                     p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 
                     shadow-sm hover:shadow-lg hover:border-green-200/60 
                     transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 shrink-0 rounded-full 
                        bg-linear-to-br from-green-600 to-emerald-500 
                        text-white text-lg font-bold flex items-center justify-center 
                        shadow-md shadow-green-500/20 sm:mx-auto sm:mb-1
                        transition-transform duration-300 group-hover:scale-105">
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

      {/* ─── CTA BANNER ─── */}
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

      {/* ─── FOOTER ─── */}
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