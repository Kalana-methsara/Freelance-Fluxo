import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import platformService from "../services/platformService";
import { getInitials } from "../utils/auth";

const AVATAR_COLORS = ["#14a800", "#7c3aed", "#dc2626", "#d97706", "#0891b2"];

export default function FreelancerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    platformService
      .getFreelancer(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500 text-sm">Loading profile…</p>
      </div>
    );
  }

  if (!data?.freelancer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-gray-600">Freelancer not found</p>
        <Link to="/search" className="text-emerald-700 hover:underline text-sm">Browse freelancers</Link>
      </div>
    );
  }

  const { freelancer, completedJobs } = data;
  const name = `${freelancer.firstName} ${freelancer.lastName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="text-sm text-emerald-700 hover:underline">
            ← Back
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
          <div className="flex items-start gap-5">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0"
              style={{ background: AVATAR_COLORS[0] }}
            >
              {getInitials(name)}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">{name}</h1>
              <p className="text-gray-500">{freelancer.title || "Freelancer"}</p>
              <p className="text-lg font-semibold text-gray-800 mt-2">${freelancer.hourlyRate || 0}/hr</p>
              {freelancer.rating && (
                <p className="text-amber-500 text-sm mt-1">
                  {"★".repeat(freelancer.rating)} ({freelancer.reviewCount || 0} reviews)
                </p>
              )}
            </div>
          </div>

          {freelancer.skills?.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {freelancer.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => navigate("/login")}
              className="px-5 py-2.5 bg-emerald-700 text-white text-sm font-medium rounded-full hover:bg-emerald-800"
            >
              Hire {freelancer.firstName}
            </button>
            <button
              onClick={() => navigate("/search")}
              className="px-5 py-2.5 border border-gray-300 text-sm font-medium rounded-full hover:bg-gray-50"
            >
              Browse more talent
            </button>
          </div>
        </div>

        {completedJobs?.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed projects</h2>
            <div className="bg-white border border-gray-200 rounded-xl divide-y">
              {completedJobs.map((job: any) => (
                <div key={job._id} className="px-5 py-4">
                  <p className="font-medium text-gray-900">{job.title}</p>
                  <p className="text-xs text-gray-500">
                    {job.clientId?.companyName || job.clientId?.firstName} · ${job.budget}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
