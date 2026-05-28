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
  name: string;
  email: string;
  password: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
