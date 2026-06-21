import api from "./api";

const userService = {
  getMyProfile: async () => {
    const response = await api.get("/users/me");
    return response.data.data;
  },

  updateProfile: async (updates: Partial<Record<string, any>>) => {
    const response = await api.patch("/users/profile", updates);
    return response.data.data;
  },
};

export default userService;
