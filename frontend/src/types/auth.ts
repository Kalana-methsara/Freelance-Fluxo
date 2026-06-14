export const UserRole = {
  ADMIN: "ADMIN",
  CLIENT: "CLIENT",
  FREELANCER: "FREELANCER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// types/auth.ts
export interface AuthUser {
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  roles: UserRole[] | string[];
  accessToken?: string;
  refreshToken?: string;
  approvalStatus?: "pending" | "approved" | "rejected";
  title?: string;
  skills?: string[];
  hourlyRate?: number;
  companyName?: string;
  rating?: number;
  reviewCount?: number;
}

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;  
  email: string;
  password: string;
  userRole?: string[];
  location?: { country: string };
}

export interface LoginCredentials {
  email: string;
  password: string;
}
