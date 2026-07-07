export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CLIENT: "CLIENT",
  FREELANCER: "FREELANCER",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];


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
  profileImage?: string;
  bio?: string;       
  location?: any;
}

export interface RegisterUserPayload {
  firstName: string;
  lastName: string;  
  email: string;
  password: string;
  userRole?: string[];
  profileImage?: string;
  bio?: string;
  skills?: string[];
  title?: string;
  hourlyRate?: number;
  companyName?: string;
  location?: { country: string };
}

export interface LoginCredentials {
  email: string;
  password: string;
}
