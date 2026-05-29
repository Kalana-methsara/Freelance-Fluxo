import api from "./api";
import type { AuthUser, LoginCredentials, RegisterUserPayload } from "../types/auth";

const authService = {
  /** Public signup — backend always creates USER role */
  registerUser: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register", payload);
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  getProfile: async (): Promise<AuthUser> => {
    const response = await api.get("/auth/profile");
    return response.data?.data ?? response.data;
  },

  /** Admin only — not used on public register page */
  registerAdmin: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/admin/register", payload);
    return response.data;
  },

  /** Admin or Manager only */
  registerManager: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/manager/register", payload);
    return response.data;
  },

  getAdminUsers: async () => {
    const response = await api.get("/auth/admin/users");
    return response.data;
  },
};

export default authService;
