import api from "./api";

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

  // ── HireFreelancerPage.tsx එකේ use වෙනවා ──
  getFreelancerById: async (id: string) => {
    const response = await api.get(`/platform/freelancers/${id}`);
    return response.data.data;
  },

  search: async (q?: string) => {
    const response = await api.get("/platform/search", { params: { q } });
    return response.data.data;
  },

  updateProfile: async (profileData: any) => {
    const response = await api.patch("/users/profile", profileData);
    return response.data.data;
  },

  // ── Hire Offer submit කරන endpoint ──
  sendHireOffer: async (offerData: {
    freelancerId: string | undefined;
    jobId: string | null;
    contractTitle: string;
    budgetType: "fixed" | "hourly";
    totalAmount: number;
    hourlyRate?: number;
    estimatedHours?: number;
    deadline: string;
    message: string;
    milestones: { id: string; title: string; amount: number; dueDate: string }[];
    escrowAmount: number;
  }) => {
    const response = await api.post("/contracts/hire", offerData);
    return response.data.data;
  },
};

export default platformService;