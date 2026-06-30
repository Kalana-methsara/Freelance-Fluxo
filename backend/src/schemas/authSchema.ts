import { z } from "zod";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";

const userRoleEnum = z.enum(Object.values(UserRole) as [UserRole, ...UserRole[]]);
const approvalStatusEnum = z.enum(Object.values(ApprovalStatus) as [ApprovalStatus, ...ApprovalStatus[]]);

// ✅ Base schema — reusable
const baseRegisterSchema = z.object({
    firstName: z.string().min(2),
    lastName: z.string().min(2),
    email: z.email(),
    password: z.string().min(6),
    profileImage: z.string().url().optional(),
    bio: z.string().max(500).optional(),
    skills: z.array(z.string()).optional(),
    location: z.object({
        coordinates: z.object({
            lat: z.number(),
            lng: z.number(),
        }).optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        province: z.string().optional(),
        country: z.string().optional(),
    }).optional(),
});

// ✅ Public register (freelancer / client)
export const registerSchema = z.object({
    body: baseRegisterSchema,
});

// ✅ Admin register (by admin only)
export const registerAdminSchema = z.object({
    body: baseRegisterSchema.extend({
        userRole: z.array(userRoleEnum).default([UserRole.ADMIN]).optional(),
        approvalStatus: approvalStatusEnum.default(ApprovalStatus.APPROVED).optional(),
    }),
});

export const loginSchema = z.object({
    body: z.object({
        email: z.email(),
        password: z.string().min(6),
    }),
});

export const updateProfileSchema = z.object({
    body: baseRegisterSchema.partial(),
});