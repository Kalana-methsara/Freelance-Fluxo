import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";

const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    platformService
      .getCategory(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading category…</p>
      </div>
    );
  }

  if (!data?.category) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-600">Category not found</p>
        <Link to="/" className="text-emerald-700 hover:underline text-sm">Back to home</Link>
      </div>
    );
  }

  const { category, jobs, freelancers } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-5xl mx-auto">
          <Link to="/" className="text-sm text-emerald-700 hover:underline">← Back to home</Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <span className="text-4xl">{category.icon}</span>
          <h1 className="text-3xl font-semibold text-gray-900 mt-2">{category.title}</h1>
          <p className="text-gray-500">{category.skills}</p>
        </div>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Freelancers in this category</h2>
          {freelancers?.length ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {freelancers.map((fl: any, i: number) => (
                <button
                  key={fl._id}
                  onClick={() => navigate(`/freelancers/${fl._id}`)}
                  className="bg-white border border-gray-200 rounded-xl p-5 text-left hover:border-emerald-600 transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold mb-2"
                    style={{ background: AVATAR_COLORS[i % AVATAR_COLORS.length] }}
                  >
                    {getInitials(`${fl.firstName} ${fl.lastName}`)}
                  </div>
                  <p className="font-medium text-gray-900">{fl.firstName} {fl.lastName}</p>
                  <p className="text-xs text-gray-500">{fl.title}</p>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No freelancers yet in this category.</p>
          )}
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Open jobs</h2>
          {jobs?.length ? (
            <div className="bg-white border border-gray-200 rounded-xl divide-y">
              {jobs.map((job: any) => (
                <div key={job._id} className="px-5 py-4 flex justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    <p className="text-xs text-gray-500">${job.budget}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No open jobs in this category yet.</p>
          )}
        </section>
      </main>
    </div>
  );
}
