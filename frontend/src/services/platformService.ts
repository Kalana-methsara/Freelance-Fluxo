// ─────────────────────────────────────────────────────────────────────────────
// Add these methods to your existing platformService object/class.
// Assumes `api` is your configured axios instance (e.g. from services/api.ts)
// with the Authorization header already set via an interceptor.
// ─────────────────────────────────────────────────────────────────────────────

import api from "./api";

export interface HireOfferPayload {
  freelancerId?: string;
  jobId?: string | null;
  contractTitle: string;
  budgetType: "fixed" | "hourly";
  totalAmount?: number;
  hourlyRate?: number;
  estimatedHours?: number;
  deadline: string;
  message: string;
  milestones?: {
    title: string;
    amount: number;
    dueDate: string;
  }[];
  escrowAmount: number;
}

const platformService = {
  getCategories: async () => {
    const response = await api.get("/platform/categories");
    return response.data.data;
  },

  getCategory: async (id: string) => {
    const response = await api.get(`/platform/categories/${id}`);
    return response.data.data;
  },

  getFreelancers: async (q?: string) => {
    const response = await api.get("/platform/freelancers", { params: { q } });
    return response.data.data;
  },

  getFreelancer: async (id: string) => {
    const response = await api.get(`/platform/freelancers/${id}`);
    return response.data.data;
  },

  search: async (q?: string) => {
    const response = await api.get("/platform/search", { params: { q } });
    return response.data.data;
  },

  // New contract-related methods
  getFreelancerById: async (freelancerId: string) => {
    const res = await api.get(`/platform/freelancers/${freelancerId}`);
    return res.data?.data ?? res.data;
  },

  sendHireOffer: async (payload: HireOfferPayload) => {
    const res = await api.post("/contracts/hire", payload);
    return res.data;
  },

  getMyContracts: async () => {
    const res = await api.get("/contracts");
    return res.data?.data ?? [];
  },

  respondToOffer: async (contractId: string, action: "accept" | "decline") => {
    const res = await api.patch(`/contracts/${contractId}/respond`, { action });
    return res.data;
  },
 
  // Self profile update helper
  updateProfile: async (updates: Partial<Record<string, any>>) => {
    const res = await api.patch("/users/profile", updates);
    return res.data?.data ?? res.data;
  },
};

export default platformService;
export {
  platformService as platformServiceObj,
  // named exports for compatibility
  platformService as namedPlatformService,
};
