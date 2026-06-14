import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";

const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

function avatarColor(id: string) {
  const idx = id.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const navigate = useNavigate();
  const [data, setData] = useState<{ freelancers: any[]; jobs: any[] } | null>(null);
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
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <Link to="/" className="font-serif text-lg text-gray-900 shrink-0">
            freelance<em className="italic text-emerald-700">fluxo</em>
          </Link>
          <div className="flex flex-1 max-w-xl">
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="Search skills, jobs, freelancers…"
              className="flex-1 border border-gray-300 rounded-l-lg px-4 py-2 text-sm focus:outline-none focus:border-emerald-700"
            />
            <button
              onClick={handleSearch}
              className="px-4 py-2 bg-emerald-700 text-white text-sm font-medium rounded-r-lg hover:bg-emerald-800"
            >
              Search
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {query ? `Results for "${query}"` : "Browse talent & jobs"}
        </h1>

        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : (
          <div className="space-y-10">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Freelancers</h2>
              {data?.freelancers?.length ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.freelancers.map((fl: any) => (
                    <button
                      key={fl._id}
                      onClick={() => navigate(`/freelancers/${fl._id}`)}
                      className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-emerald-600 hover:shadow-md transition-all"
                    >
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold mb-3"
                        style={{ background: avatarColor(fl._id) }}
                      >
                        {getInitials(`${fl.firstName} ${fl.lastName}`)}
                      </div>
                      <p className="font-semibold text-gray-900">{fl.firstName} {fl.lastName}</p>
                      <p className="text-sm text-gray-500">{fl.title || "Freelancer"}</p>
                      <p className="text-sm font-medium text-gray-800 mt-1">${fl.hourlyRate || 0}/hr</p>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No freelancers found.</p>
              )}
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Open jobs</h2>
              {data?.jobs?.length ? (
                <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
                  {data.jobs.map((job: any) => (
                    <div key={job._id} className="px-5 py-4 flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{job.title}</p>
                        <p className="text-xs text-gray-500">
                          {job.clientId?.companyName || job.clientId?.firstName} · ${job.budget}
                        </p>
                      </div>
                      <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">{job.status}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No jobs found.</p>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
