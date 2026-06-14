import api from "./api";

export interface CreateJobPayload {
  title: string;
  description: string;
  budget: number;
  deadline: string;
  categoryId?: string;
  skills?: string[];
  status?: string;
}

const jobService = {
  getJobs: async (params?: { q?: string; category?: string; status?: string }) => {
    const response = await api.get("/jobs", { params });
    return response.data.data;
  },

  getJob: async (id: string) => {
    const response = await api.get(`/jobs/${id}`);
    return response.data.data;
  },

  createJob: async (payload: CreateJobPayload) => {
    const response = await api.post("/jobs", payload);
    return response.data.data;
  },

  applyToJob: async (jobId: string, bid: number, coverLetter?: string) => {
    const response = await api.post(`/jobs/${jobId}/apply`, { bid, coverLetter });
    return response.data.data;
  },

  getMyApplications: async () => {
    const response = await api.get("/jobs/applications/me");
    return response.data.data;
  },

  getClientJobs: async () => {
    const response = await api.get("/jobs/my/client");
    return response.data.data;
  },

  getJobApplications: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}/applications`);
    return response.data.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    const response = await api.patch(`/jobs/applications/${applicationId}/status`, { status });
    return response.data.data;
  },
};

export default jobService;
