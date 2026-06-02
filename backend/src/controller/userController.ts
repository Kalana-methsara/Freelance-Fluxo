import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";
import { asyncHandler } from "../middleware/asyncHandler";

const createUserWithTokens = async (
    data: { firstName: string; lastName: string; email: string; password: string },
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
    const { firstName, lastName, email, password } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const result = await createUserWithTokens(
        { firstName, lastName, email, password },
        UserRole.FREELANCER,
        ApprovalStatus.PENDING 
    );

    res.status(201).json({ message: "Registration successful", data: result });
});

// 2. Register Client (Public)
export const registerClient = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const result = await createUserWithTokens(
        { firstName, lastName, email, password },
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
export const getMyDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserModel.findById(req.user?._id);
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
    const users = await UserModel.find({});
    res.status(200).json({ success: true, data: users });
});