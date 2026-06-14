import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import jobService from "../services/jobService";

interface Job {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  status: string;
  clientId: {
    firstName: string;
    lastName: string;
    companyName?: string;
  };
}

const JobsPage = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await jobService.getJobs();
        setJobs(response || []);
      } catch (err) {
        setError("Failed to load jobs. Please try again later.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading jobs...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Available Jobs</h1>
        <p className="text-gray-600 mb-8">Browse and apply for exciting freelance opportunities</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8 text-red-700">
            {error}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">No jobs available at the moment</p>
            <Link
              to="/search"
              className="inline-block px-6 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              Browse Freelancers Instead
            </Link>
          </div>
        ) : (
          <div className="grid gap-6">
            {jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900 hover:text-emerald-600">
                      <Link to={`/search?jobId=${job._id}`}>{job.title}</Link>
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Posted by {job.clientId?.companyName || `${job.clientId?.firstName} ${job.clientId?.lastName}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-emerald-600">${job.budget}</p>
                    <p className="text-xs text-gray-500 mt-1">Budget</p>
                  </div>
                </div>

                <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">
                      {job.category}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      job.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : job.status === 'in_progress'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Deadline: {new Date(job.deadline).toLocaleDateString()}
                  </p>
                </div>

                <Link
                  to={`/search?jobId=${job._id}`}
                  className="block w-full text-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  View & Apply
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsPage;
