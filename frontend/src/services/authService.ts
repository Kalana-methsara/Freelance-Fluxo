import api from "./api";
import type { AuthUser, LoginCredentials, RegisterUserPayload } from "../types/auth";

const authService = {
  // ✅ /auth/register/freelancer
  registerFreelancer: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register/freelancer", payload);
    return response.data;
  },

  // ✅ /auth/register/client
  registerClient: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register/client", payload);
    return response.data;
  },

  // ✅ /auth/login
  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // ✅ /auth/me
  getProfile: async (): Promise<AuthUser> => {
    const response = await api.get("/auth/me");
    return response.data?.data ?? response.data;
  },

  // ✅ /auth/register/admin — admin only
  registerAdmin: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register/admin", payload);
    return response.data;
  },

  // ✅ /auth/  — admin only
  getUsers: async () => {
    const response = await api.get("/auth/");
    return response.data;
  },
};

export default authService;