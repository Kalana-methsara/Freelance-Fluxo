
import api from "./api";
import type { AuthUser, LoginCredentials, RegisterUserPayload } from "../types/auth";
import { normalizeBackendUser } from "../utils/auth";
import { STORAGE_KEYS } from "../utils/storageKeys";


interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface UsersListResponse {
  users: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    userRole: string[];
    approvalStatus: "approved" | "rejected" | "pending";
    createdAt: string;
  }>;
  total: number;
}

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

  getUsers: async (params?: { page?: number; limit?: number; search?: string }): Promise<UsersListResponse> => {
    const response = await api.get("/auth/", { params });
    return response.data;
  },

  getUserById: async (userId: string) => {
    const response = await api.get(`/auth/users/${userId}`);
    return response.data.data;
  },

  updateUserApproval: async (userId: string, status: "approved" | "rejected" | "pending") => {
    const response = await api.patch(`/auth/users/${userId}/approval`, { status });
    return response.data;
  },

  updateUserRole: async (
    userId: string,
    role: "SUPER_ADMIN" | "ADMIN" | "CLIENT" | "FREELANCER",
    action: "add" | "remove" = "add"
  ) => {
    const response = await api.patch(`/auth/users/${userId}/role`, { role, action });
    return response.data;
  },

  updateMyProfile: async (updates: Partial<Record<string, any>>) => {
    const response = await api.patch("/users/profile", updates);
    return response.data.data;
  },

  
  deleteUser: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },
};

export default authService;