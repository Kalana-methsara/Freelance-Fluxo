import type { AuthUser } from "../types/auth";

interface BackendUser {
  _id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  userRole?: string[];
  approvalStatus?: string;
  accessToken?: string;
  refreshToken?: string;
  title?: string;
  skills?: string[];
  hourlyRate?: number;
  companyName?: string;
}

export function normalizeBackendUser(
  raw: BackendUser,
  tokens?: { accessToken?: string; refreshToken?: string }
): AuthUser {
  const roles = (raw.userRole || []).map((r) => String(r).toUpperCase());
  return {
    _id: raw._id,
    email: raw.email,
    firstName: raw.firstName,
    lastName: raw.lastName,
    name: [raw.firstName, raw.lastName].filter(Boolean).join(" ") || raw.email,
    roles,
    approvalStatus: raw.approvalStatus as AuthUser["approvalStatus"],
    accessToken: tokens?.accessToken || raw.accessToken || "",
    refreshToken: tokens?.refreshToken || raw.refreshToken || "",
    title: raw.title,
    skills: raw.skills,
    hourlyRate: raw.hourlyRate,
    companyName: raw.companyName,
  };
}

export function getDashboardPath(roles: AuthUser["roles"] = []): string {
  const r = roles.map((role) => String(role).toUpperCase());
  if (r.includes("SUPER_ADMIN") || r.includes("ADMIN")) return "/admin";
  if (r.includes("CLIENT")) return "/dashboard/client";
  if (r.includes("FREELANCER")) return "/dashboard/freelancer";
  return "/";
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
