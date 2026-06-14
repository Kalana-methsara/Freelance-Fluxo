import { Request, Response } from "express";
import mongoose from "mongoose";                      // ← add this
import { UserModel } from "../models/userModel";
import { JobModel } from "../models/jobModel";        // ← add this
import { ReportModel } from "../models/reportModel";  // ← add this
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../utils/generateToken";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import jwt from "jsonwebtoken";

type CreateUserData = {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profileImage?: string;
    bio?: string;
    skills?: string[];
    hourlyRate?: number;
    companyName?: string;
    title?: string;
    location?: any;
};

const createUserWithTokens = async (
    data: CreateUserData,
    role: UserRole,
    approvalStatus: ApprovalStatus
) => {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await UserModel.create({
        ...data,
        password: hashedPassword,
        userRole: [role],
        approvalStatus,
    });
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    return { user, accessToken, refreshToken };
};

// 1. Register Freelancer (Public)
export const registerFreelancer = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, profileImage, bio, skills, title, hourlyRate, companyName, location } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const result = await createUserWithTokens(
        { firstName, lastName, email, password, profileImage, bio, skills, title, hourlyRate, companyName, location },
        UserRole.FREELANCER,
        ApprovalStatus.PENDING 
    );

    res.status(201).json({ message: "Registration successful", data: result });
});

// 2. Register Client (Public)
export const registerClient = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password, profileImage, bio, skills, title, hourlyRate, companyName, location } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const result = await createUserWithTokens(
        { firstName, lastName, email, password, profileImage, bio, skills, title, hourlyRate, companyName, location },
        UserRole.CLIENT,
        ApprovalStatus.PENDING  
    );

    res.status(201).json({ message: "Registration successful", data: result });
});

// 3. Login User
export const loginUser = asyncHandler(async (req: Request, res: Response) => {

    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.status(200).json({ message: "Login successful", data: { user, accessToken, refreshToken } });
});

// 4. Get My Details
export const getMyDetails = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const user = await UserModel.findById(authReq.user?._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: user });
});

// 5. Register Admin (By Admin only)
export const registerAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const { user } = await createUserWithTokens(
        { firstName, lastName, email, password },
        UserRole.ADMIN,
        ApprovalStatus.APPROVED 
    );

    res.status(201).json({ message: "Admin created successfully", data: user });
});

// 6. Get All Users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await UserModel.find({}).select("-password");
    res.status(200).json({ success: true, data: users });
});

// 7. Get user by ID (admin)
export const getUserById = asyncHandler(async (req: Request, res: Response) => {
    const user = await UserModel.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.status(200).json({ success: true, data: user });
});

// 8. Refresh access token
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken: token } = req.body;
    if (!token) {
        return res.status(400).json({ message: "Refresh token required" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { sub: string };
        const user = await UserModel.findById(decoded.sub);
        if (!user) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const accessToken = signAccessToken(user);
        res.status(200).json({ success: true, data: { accessToken } });
    } catch {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }
});

// 8. Update user approval status (admin)
export const updateUserApproval = asyncHandler(async (req: Request, res: Response) => {
    const { status } = req.body;
    if (!Object.values(ApprovalStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid approval status" });
    }

    const user = await UserModel.findByIdAndUpdate(
        req.params.id,
        { approvalStatus: status },
        { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: user });
});

// 9. Update user profile (self or admin)
export const updateUserProfile = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const requesterId = authReq.user?._id?.toString();
    const targetId = req.params.id;
    const isAdmin = authReq.user?.userRole?.includes(UserRole.ADMIN);

    if (!isAdmin && requesterId !== targetId) {
        return res.status(403).json({ message: "Forbidden" });
    }

    const allowedUpdates = [
        "firstName",
        "lastName",
        "profileImage",
        "bio",
        "skills",
        "title",
        "hourlyRate",
        "companyName",
        "location",
        "email",
    ];

    const updates: Record<string, any> = {};
    for (const key of Object.keys(req.body)) {
        if (allowedUpdates.includes(key)) {
            updates[key] = req.body[key];
        }
    }

    const user = await UserModel.findByIdAndUpdate(targetId, updates, {
        new: true,
        runValidators: true,
        context: "query",
    }).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: user });
});

// 10. Update user role (admin)
export const updateUserRole = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const { role, action = "add" } = req.body as { role: UserRole; action?: "add" | "remove" };

    if (!Object.values(UserRole).includes(role)) {
        return res.status(400).json({ message: "Invalid user role" });
    }

    if (!['add', 'remove'].includes(action)) {
        return res.status(400).json({ message: "Invalid action" });
    }

    const requesterRoles = authReq.user?.userRole || [];
    const isSuperAdmin = requesterRoles.includes(UserRole.SUPER_ADMIN);

    const targetUser = await UserModel.findById(req.params.id);
    if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
    }

    const targetIsAdmin = targetUser.userRole.includes(UserRole.ADMIN);
    const targetIsSuperAdmin = targetUser.userRole.includes(UserRole.SUPER_ADMIN);

    if (!isSuperAdmin) {
        if (targetIsSuperAdmin) {
            return res.status(403).json({ message: "Only a super admin can modify a super admin account" });
        }
        if (action === "add" && role === UserRole.SUPER_ADMIN) {
            return res.status(403).json({ message: "Only a super admin can assign super admin role" });
        }
        if (action === "remove" && targetIsAdmin && role === UserRole.ADMIN) {
            return res.status(403).json({ message: "Only a super admin can remove admin privileges" });
        }
    }

    const currentRoles = Array.from(new Set(targetUser.userRole));
    let updatedRoles = currentRoles;

    if (action === "add") {
        if (!updatedRoles.includes(role)) {
            updatedRoles = [...updatedRoles, role];
        }
    } else {
        if (updatedRoles.length <= 1) {
            return res.status(400).json({ message: "A user must have at least one role" });
        }
        updatedRoles = updatedRoles.filter((r) => r !== role);
    }

    const user = await UserModel.findByIdAndUpdate(
        req.params.id,
        { userRole: updatedRoles },
        { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: user });
});
export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const userId = req.params.userId;
        const user = await UserModel.findById(userId).session(session);
        if (!user) {
            await session.abortTransaction();
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Prevent self-deletion
        const authReq = req as AuthRequest;
        if (userId === authReq.user?._id?.toString()) {
            await session.abortTransaction();
            return res.status(400).json({ success: false, message: "Cannot delete your own account" });
        }

        // Delete related data (jobs, reports, proposals if any)
        await JobModel.deleteMany({ clientId: userId }).session(session);
        await ReportModel.deleteMany({ reportedBy: userId }).session(session);
        // Add ProposalModel.deleteMany({ userId }) if you have proposals

        await user.deleteOne({ session });
        await session.commitTransaction();
        res.status(200).json({ success: true, message: "User deleted permanently" });
    } catch (error) {
        await session.abortTransaction();
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    } finally {
        session.endSession();
    }
});