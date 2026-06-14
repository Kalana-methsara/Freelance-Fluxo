import api from "./api";
import type { AuthUser, LoginCredentials, RegisterUserPayload } from "../types/auth";
import { normalizeBackendUser } from "../utils/auth";
import { STORAGE_KEYS } from "../utils/storageKeys";

const authService = {
  registerFreelancer: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register/freelancer", payload);
    return response.data;
  },

  registerClient: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register/client", payload);
    return response.data;
  },

  login: async (credentials: LoginCredentials) => {
    const response = await api.post("/auth/login", credentials);
    const { data } = response.data;
    return normalizeBackendUser(data.user, {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
    });
  },

  getProfile: async (): Promise<AuthUser> => {
    const response = await api.get("/auth/me");
    const user = response.data?.data ?? response.data;
    const token = localStorage.getItem(STORAGE_KEYS.accessToken) || "";
    const refresh = localStorage.getItem(STORAGE_KEYS.refreshToken) || "";
    return normalizeBackendUser(user, { accessToken: token, refreshToken: refresh });
  },

  registerAdmin: async (payload: RegisterUserPayload) => {
    const response = await api.post("/auth/register/admin", payload);
    return response.data;
  },

  getUsers: async () => {
    const response = await api.get("/auth/");
    return response.data;
  },

  updateUserApproval: async (userId: string, status: "approved" | "rejected" | "pending") => {
    const response = await api.patch(`/auth/users/${userId}/approval`, { status });
    return response.data;
  },
};

export default authService;
