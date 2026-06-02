import { Request, Response } from "express";
import { UserModel } from "../models/userModel";
import bcrypt from "bcryptjs";
import { signAccessToken, signRefreshToken } from "../utils/generateToken";
import { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";
import { asyncHandler } from "../middleware/asyncHandler";

// 1. Register User
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    const existing = await UserModel.findOne({ email });
    if (existing) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
        firstName, lastName, email, password: hashedPassword
    });

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.status(201).json({
        message: "Registration successful",
        data: { user, accessToken, refreshToken }
    });
});

// 2. Login User
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await UserModel.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ message: "Invalid email or password" });
    }

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    res.status(200).json({
        message: "Login successful",
        data: { user, accessToken, refreshToken }
    });
});

// 3. Get My Details
export const getMyDetails = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await UserModel.findById(req.user?._id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ success: true, data: user });
});

// 4. Register Admin (By Admin)
export const registerAdmin = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = await UserModel.create({
        firstName, lastName, email,
        password: hashedPassword,
        userRole: [UserRole.ADMIN],
        approvalStatus: ApprovalStatus.APPROVED
    });

    res.status(201).json({ message: "Admin created successfully", data: admin });
});

// 5. Register Manager (By Admin)
export const registerManager = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, email, password } = req.body;

    if (await UserModel.findOne({ email })) {
        return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newManager = await UserModel.create({
        firstName, lastName, email,
        password: hashedPassword,
        userRole: [UserRole.FREELANCER],
        approvalStatus: ApprovalStatus.APPROVED
    });

    res.status(201).json({ message: "Manager created successfully", data: newManager });
});

// 6. Get All Users
export const getUsers = asyncHandler(async (req: Request, res: Response) => {
    const users = await UserModel.find({});
    res.status(200).json({ success: true, data: users });
});