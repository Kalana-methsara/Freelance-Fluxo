import { z } from "zod";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";

const userRoleEnum = z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]);
const approvalStatusEnum = z.enum(Object.values(ApprovalStatus) as [ApprovalStatus, ...ApprovalStatus[]]);

export const registerSchema = z.object({
  body: z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    profileImage: z.url().optional(),
    userRole: z.array(userRoleEnum).default([UserRole.FREELANCER]).optional(),
    approvalStatus: approvalStatusEnum.default(ApprovalStatus.PENDING).optional(),
    location: z.object({
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      address: z.string(),
      city: z.string(),
      province: z.string(),
      country: z.string(),
    }).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.email(),
    password: z.string().min(6),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    email: z.email().optional(),
    profileImage: z.url().optional(),
    location: z.object({
      coordinates: z.object({
        lat: z.number(),
        lng: z.number(),
      }),
      address: z.string(),
      city: z.string(),
      province: z.string(),
      country: z.string(),
    }).optional(),
  }),
});