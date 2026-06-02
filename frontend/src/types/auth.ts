export const UserRole = {
  USER: "USER",
  MANAGER: "MANAGER",
  ADMIN: "ADMIN",
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export interface AuthUser {
  email: string;
  name?: string;
  roles: UserRole[] | string[];
  accessToken: string;
  refreshToken: string;
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
