import { Request, Response } from "express";
import { Types } from "mongoose";
import { ContractModel, ContractStatus, BudgetType } from "../models/Contractmodel";
import { UserModel } from "../models/userModel";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "../enums/userRole";

const PLATFORM_FEE_RATE = 0.05;

// ── POST /contracts/hire ─────────────────────────────────────
// Client sends a hire offer to a freelancer
export const sendHireOffer = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const clientId = authReq.user?._id;
    if (!clientId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const {
        freelancerId,
        jobId,
        contractTitle,
        budgetType,
        totalAmount,
        hourlyRate,
        estimatedHours,
        deadline,
        message,
        milestones = [],
        escrowAmount,
    } = authReq.body;

    if (!freelancerId || !contractTitle || !budgetType || !deadline || !message) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (!Object.values(BudgetType).includes(budgetType)) {
        return res.status(400).json({ success: false, message: "Invalid budget type." });
    }

    const newContract = new ContractModel({
        clientId,
        freelancerId,
        jobId: jobId || undefined,
        contractTitle,
        budgetType,
        totalAmount,
        hourlyRate,
        estimatedHours,
        deadline,
        message,
        milestones,
        escrowAmount,
        escrowFunded: true, // Client card link කරලා ආපු නිසා true කරනවා
        status: ContractStatus.PENDING,
    });

    await newContract.save();
    return res.status(201).json({ success: true, data: newContract });
});

// ── 💡 NEW: GET /contracts/pending-offers ──────────────────────
// Fetches pending offers for the logged-in Freelancer
export const getPendingOffers = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const freelancerId = authReq.user?._id;

    if (!freelancerId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // ලොග් වෙලා ඉන්න Freelancer ට ආපු Pending Offers විතරක් ගන්නවා
    // Client ගේ නම සහ රූපය පෙන්වන්න clientId එක populate කරනවා
    const contracts = await ContractModel.find({
        freelancerId,
        status: ContractStatus.PENDING,
    })
    .populate("clientId", "firstName lastName profileImage companyName")
    .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: contracts });
});

// ── GET /contracts ───────────────────────────────────────────
export const getMyContracts = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const contracts = await ContractModel.find({
        $or: [
            { clientId: userId },
            { freelancerId: userId },
        ],
    })
        .populate("clientId", "firstName lastName profileImage companyName")
        .populate("freelancerId", "firstName lastName profileImage title hourlyRate")
        .populate("jobId", "title")
        .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, data: contracts });
});

// ── PATCH /contracts/:id/respond ────────────────────────────
// Freelancer accepts or declines the offer
export const respondToOffer = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    const freelancerId = authReq.user?._id;
    if (!freelancerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { action } = authReq.body; // "accept" | "decline"
    if (!["accept", "decline"].includes(action)) {
        return res.status(400).json({ success: false, message: "Action must be 'accept' or 'decline'." });
    }

    const contract = await ContractModel.findOne({
        _id: authReq.params.id,
        freelancerId,
        status: ContractStatus.PENDING,
    });

    if (!contract) {
        return res.status(404).json({ success: false, message: "Contract not found or already responded." });
    }

    contract.status = action === "accept" ? ContractStatus.ACCEPTED : ContractStatus.DECLINED;
    await contract.save();

    return res.status(200).json({ success: true, data: contract });
});