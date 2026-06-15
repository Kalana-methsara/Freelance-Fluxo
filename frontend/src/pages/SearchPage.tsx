import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";

// ── Constants (shared with main page) ──
const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

// ── Logo component (same as homepage) ──
function Logo() {
  return (
    <span className="text-xl font-bold tracking-tight">
      <span className="text-green-600">freelance</span>
      <span className="text-gray-900">fluxo</span>
    </span>
  );
}

// ── Star rating renderer ──
function renderStars(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [data, setData] = useState<{ freelancers: any[]; jobs: any[] } | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    setLoading(true);
    platformService
      .search(query)
      .then(setData)
      .catch(() => setData({ freelancers: [], jobs: [] }))
      .finally(() => setLoading(false));
  }, [query]);

  const handleSearch = () => {
    if (searchInput.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-10 py-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center gap-4">
          <Link to="/" className="shrink-0">
            <Logo />
          </Link>

          {/* Search bar – matches homepage search style */}
          <div className="flex-1 w-full max-w-xl flex bg-white rounded-lg p-1.5 overflow-hidden border border-gray-300 focus-within:border-green-600 transition">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search for any service..."
              className="flex-1 border-none outline-none pl-4 pr-3 py-2 text-sm text-gray-800 min-w-0 placeholder-gray-400"
            />
            <button
              onClick={handleSearch}
              className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-800 transition shrink-0"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-4 h-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 1 5.196 5.196a7.5 7.5 0 0 1 10.603 10.603Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ── Results ── */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-6">
          {query ? `Results for “${query}”` : "Browse talent & jobs"}
        </h1>

        {loading ? (
          <p className="text-gray-500 text-sm animate-pulse">Loading…</p>
        ) : (
          <div className="space-y-12">
            {/* ── Freelancers section ── */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Freelancers
              </h2>
              <div className="w-10 h-0.5 bg-green-500 mb-6"></div>
              {data?.freelancers?.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.freelancers.map((fl: any) => (
                    <button
                      key={fl._id}
                      onClick={() => navigate(`/freelancers/${fl._id}`)}
                      className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-green-600 hover:shadow-md transition-all hover:-translate-y-0.5"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-3"
                        style={{ background: avatarColor(fl._id) }}
                      >
                        {getInitials(`${fl.firstName} ${fl.lastName}`)}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {fl.firstName} {fl.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mb-2">
                        {fl.title || "Freelancer"}
                      </p>
                      <div className="text-amber-500 text-xs mb-1.5">
                        {renderStars(fl.rating || 5)}{" "}
                        <span className="text-gray-500">
                          ({fl.reviewCount || 0})
                        </span>
                      </div>
                      <p className="font-semibold text-gray-800 text-sm">
                        ${fl.hourlyRate || 0}/hr
                      </p>
                      <div className="flex gap-1.5 flex-wrap mt-2">
                        {(fl.skills || []).slice(0, 3).map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-500 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No freelancers found. Try a different search.
                </p>
              )}
            </section>

            {/* ── Jobs section ── */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Open jobs
              </h2>
              <div className="w-10 h-0.5 bg-green-500 mb-6"></div>
              {data?.jobs?.length ? (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 shadow-sm">
                  {data.jobs.map((job: any) => (
                    <div
                      key={job._id}
                      className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50 transition"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">
                          {job.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {job.clientId?.companyName ||
                            job.clientId?.firstName}{" "}
                          · ${job.budget}
                        </p>
                      </div>
                      <span className="text-xs bg-green-50 text-green-700 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
                        {job.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No open jobs match your search.
                </p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}