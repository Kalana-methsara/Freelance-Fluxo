// services/dashboardService.ts
import api from "./api";

// ─── Types for better TypeScript support ──────────────────────────────
// services/dashboardService.ts
export interface DashboardStats {
  totalUsers: number;
  totalJobs: number;
  openReports: number;
  flaggedJobs: number;
  recentUsers: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    userRole: string[];
    approvalStatus: string;   // ← string, not union
    createdAt: string;
  }>;
  recentJobs: Array<{
    _id: string;
    title: string;
    budget: number;
    status: string;
    clientId: { firstName?: string; companyName?: string };
    createdAt: string;
  }>;
  reports: Array<{
    _id: string;
    type: string;
    description: string;
    resolved: boolean;
    createdAt: string;
  }>;
}

// You can also export aliases for convenience
export type User = DashboardStats['recentUsers'][0];
export type Job = DashboardStats['recentJobs'][0];
export type Report = DashboardStats['reports'][0];


export interface JobListResponse {
  jobs: Array<{
    _id: string;
    title: string;
    description: string;
    budget: number;
    status: "open" | "in_progress" | "completed" | "cancelled";
    clientId: { _id: string; firstName: string; companyName?: string };
    createdAt: string;
  }>;
  total: number;
}

export interface ReportListResponse {
  reports: Array<{
    _id: string;
    type: "scam" | "harassment" | "spam" | "other";
    description: string;
    resolved: boolean;
    createdAt: string;
    reportedBy: { _id: string; firstName: string; lastName: string };
  }>;
  total: number;
}

const dashboardService = {
  // ─── Existing methods (preserved) ──────────────────────────────────
  getFreelancerDashboard: async () => {
    const response = await api.get("/dashboard/freelancer");
    return response.data.data;
  },

  getClientDashboard: async () => {
    const response = await api.get("/dashboard/client");
    return response.data.data;
  },

  getAdminDashboard: async (): Promise<DashboardStats> => {
    const response = await api.get("/dashboard/admin");
    return response.data.data;
  },

  getJobById: async (jobId: string) => {
    const response = await api.get(`/jobs/${jobId}`);
    return response.data.data;
  },

  getConversations: () => api.get('/conversations'),
  getMessages: (conversationId: string) => api.get(`/conversations/${conversationId}/messages`),
  createConversation: (participantId: string, jobId?: string) => api.post('/conversations', { participantId, jobId }),

  // ─── NEW: Admin Job Management ─────────────────────────────────────
  getAllJobs: async (params?: { page?: number; limit?: number; status?: string }): Promise<JobListResponse> => {
    const response = await api.get("/admin/jobs", { params });
    return response.data;
  },

  deleteJob: async (jobId: string): Promise<{ success: boolean; message?: string }> => {
    const response = await api.delete(`/admin/jobs/${jobId}`);
    return response.data;
  },

  flagJob: async (jobId: string, reason: string): Promise<any> => {
    const response = await api.post(`/admin/jobs/${jobId}/flag`, { reason });
    return response.data;
  },

  // ─── NEW: Admin Report Management ──────────────────────────────────
  getAllReports: async (params?: { resolved?: boolean; page?: number; limit?: number }): Promise<ReportListResponse> => {
    const response = await api.get("/admin/reports", { params });
    return response.data;
  },

  resolveReport: async (reportId: string): Promise<{ success: boolean }> => {
    const response = await api.patch(`/admin/reports/${reportId}/resolve`);
    return response.data;
  },

  deleteReport: async (reportId: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/reports/${reportId}`);
    return response.data;
  },

  createReport: async (payload: { type: string; description: string; jobId?: string }) => {
    const response = await api.post("/reports", payload);
    return response.data.data;
  },

  getPlatformStats: async () => {
    const response = await api.get("/admin/stats");
    return response.data;
  },
};

export default dashboardService;