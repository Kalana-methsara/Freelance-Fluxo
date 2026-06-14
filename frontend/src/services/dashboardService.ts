import api from "./api";

const dashboardService = {
  getFreelancerDashboard: async () => {
    const response = await api.get("/dashboard/freelancer");
    return response.data.data;
  },

  getClientDashboard: async () => {
    const response = await api.get("/dashboard/client");
    return response.data.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get("/dashboard/admin");
    return response.data.data;
  },
};

export default dashboardService;
