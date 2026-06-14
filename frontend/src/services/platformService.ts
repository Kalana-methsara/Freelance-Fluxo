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

  search: async (q?: string) => {
    const response = await api.get("/platform/search", { params: { q } });
    return response.data.data;
  },
};

export default platformService;
