// src/services/jobService.ts
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
  // ==================== JOBS ====================
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

  // ==================== APPLICATIONS / PROPOSALS ====================
  applyToJob: async (jobId: string, bid: number, coverLetter?: string) => {
    const response = await api.post(`/jobs/${jobId}/apply`, { bid, coverLetter });
    return response.data.data;
  },

  // Backwards-compatible alias used in some pages/components
  submitProposal: async (jobId: string, payload: { bid: number; coverLetter?: string }) => {
    const response = await api.post(`/jobs/${jobId}/apply`, { bid: payload.bid, coverLetter: payload.coverLetter });
    return response.data.data;
  },

  getMyApplications: async () => {
    const response = await api.get("/jobs/applications/me");
    return response.data.data;
  },

  withdrawProposal: async (applicationId: string) => {
    const response = await api.patch(`/jobs/applications/${applicationId}/withdraw`);
    return response.data.data;
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    const response = await api.patch(`/jobs/applications/${applicationId}/status`, { status });
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

  // ==================== WORK SUBMISSION ====================
  submitWork: async (jobId: string, formData: FormData) => {
    const response = await api.post(`/jobs/${jobId}/submissions`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data.data;
  },

  // ==================== MESSAGING / CONVERSATIONS ====================
  getConversations: async () => {
    const response = await api.get("/conversations");
    return response.data.data;
  },

  createConversation: async (participantId: string, jobId?: string) => {
    const response = await api.post("/conversations", { participantId, jobId });
    return response.data.data;
  },

  getMessages: async (conversationId: string) => {
    const response = await api.get(`/conversations/${conversationId}/messages`);
    return response.data.data;
  },

  addParticipantToConversation: async (conversationId: string, userId: string) => {
    const response = await api.post(`/conversations/${conversationId}/participants`, { userId });
    return response.data;
  },

  // ==================== FREELANCER PROFILE ====================
  updateFreelancerProfile: async (userId: string, updates: any) => {
    const response = await api.patch(`/auth/users/${userId}/profile`, updates);
    return response.data.data;
  },
};

export default jobService;