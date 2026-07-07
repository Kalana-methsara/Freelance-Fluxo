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

  search: async (
    q?: string,
    filters?: {
      type?: "all" | "freelancers" | "jobs";
      skills?: string[];
      minBudget?: string;
      maxBudget?: string;
      minRate?: string;
      maxRate?: string;
      ratingMin?: string;
      location?: string;
    }
  ) => {
    const response = await api.get("/platform/search", {
      params: {
        q,
        type: filters?.type ?? "all",
        skills: filters?.skills?.join(",") || undefined,
        minBudget: filters?.minBudget || undefined,
        maxBudget: filters?.maxBudget || undefined,
        minRate: filters?.minRate || undefined,
        maxRate: filters?.maxRate || undefined,
        ratingMin: filters?.ratingMin || undefined,
        location: filters?.location || undefined,
      },
    });
    return response.data.data;
  },

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

  
  getPendingOffers: async () => {
    const res = await api.get("/contracts/pending-offers");
    return res.data?.data ?? [];
  },

  respondToOffer: async (contractId: string, action: "accept" | "decline") => {
    const res = await api.patch(`/contracts/${contractId}/respond`, { action });
    return res.data;
  },

  acceptOffer: async (contractId: string) => {
    return platformService.respondToOffer(contractId, "accept");
  },

  declineOffer: async (contractId: string) => {
    return platformService.respondToOffer(contractId, "decline");
  },

  getContractById: async (contractId: string) => {
    const res = await api.get(`/contracts/${contractId}`);
    return res.data?.data ?? res.data;
  },
 
  updateProfile: async (updates: Partial<Record<string, any>>) => {
    const res = await api.patch("/users/profile", updates);
    return res.data?.data ?? res.data;
  },

  uploadProfileImage: async (formData: FormData) => {
    const res = await api.post("/upload/upload-avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data?.data ?? res.data;
  },
};

export default platformService;