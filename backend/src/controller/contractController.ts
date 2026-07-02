import { Request, Response } from "express";
import { Types } from "mongoose";
import { ContractModel, ContractStatus, BudgetType } from "../models/contractModel";
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

    // String එකක් ලෙස පැමිණියහොත් ආරක්ෂිතව ObjectId බවට පත් කිරීම
    const targetClientId = typeof clientId === "string" ? new Types.ObjectId(clientId) : clientId;
    const targetFreelancerId = typeof freelancerId === "string" ? new Types.ObjectId(freelancerId) : freelancerId;

    const newContract = new ContractModel({
        clientId: targetClientId,
        freelancerId: targetFreelancerId,
        jobId: jobId ? (typeof jobId === "string" ? new Types.ObjectId(jobId) : jobId) : undefined,
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

    try {
        // freelancerId එක ආරක්ෂිතව Mongoose ObjectId එකක් බවට පරිවර්තනය කිරීම
        const targetId = typeof freelancerId === "string" ? new Types.ObjectId(freelancerId) : freelancerId;

        // ලොග් වෙලා ඉන්න Freelancer ට ආපු Pending Offers විතරක් ගන්නවා
        const contracts = await ContractModel.find({
            freelancerId: targetId,
            status: ContractStatus.PENDING,
        })
        // Vercel එකේදී populate Crash වීම වැළැක්වීමට UserModel එක සෘජුවම model ලෙස ලබාදීම
        .populate({
            path: "clientId",
            model: UserModel,
            select: "firstName lastName profileImage companyName"
        })
        .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: contracts });

    } catch (error: any) {
        console.error("Error in getPendingOffers:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

// ── GET /contracts ───────────────────────────────────────────
export const getMyContracts = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const targetUserId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;

        const contracts = await ContractModel.find({
            $or: [
                { clientId: targetUserId },
                { freelancerId: targetUserId },
            ],
        })
        .populate({
            path: "clientId",
            model: UserModel,
            select: "firstName lastName profileImage companyName"
        })
        .populate({
            path: "freelancerId",
            model: UserModel,
            select: "firstName lastName profileImage title hourlyRate"
        })
        .populate("jobId", "title") // JobModel එක සැමවිටම කලින් Register වන නිසා සෘජුවම භාවිතා කළ හැක
        .sort({ createdAt: -1 });

        return res.status(200).json({ success: true, data: contracts });

    } catch (error: any) {
        console.error("Error in getMyContracts:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
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

    try {
        const targetFreelancerId = typeof freelancerId === "string" ? new Types.ObjectId(freelancerId) : freelancerId;
        const contractId = typeof req.params.id === "string" ? new Types.ObjectId(req.params.id) : req.params.id;

        const contract = await ContractModel.findOne({
            _id: contractId,
            freelancerId: targetFreelancerId,
            status: ContractStatus.PENDING,
        });

        if (!contract) {
            return res.status(404).json({ success: false, message: "Contract not found or already responded." });
        }

        contract.status = action === "accept" ? ContractStatus.ACCEPTED : ContractStatus.DECLINED;
        await contract.save();

        return res.status(200).json({ success: true, data: contract });

    } catch (error: any) {
        console.error("Error in respondToOffer:", error);
        return res.status(500).json({ 
            success: false, 
            message: "Internal Server Error", 
            error: error.message 
        });
    }
});

// ── GET /contracts/:id ───────────────────────────────────────
// Fetch a single contract by ID (accessible to client, freelancer, or involved party)
export const getContractById = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const userId = authReq.user?._id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    try {
        const targetUserId = typeof userId === "string" ? new Types.ObjectId(userId) : userId;
        const contractId = typeof req.params.id === "string" ? new Types.ObjectId(req.params.id) : req.params.id;

        const contract = await ContractModel.findById(contractId)
            .populate({
                path: "clientId",
                model: UserModel,
                select: "firstName lastName profileImage companyName email title"
            })
            .populate({
                path: "freelancerId",
                model: UserModel,
                select: "firstName lastName profileImage title hourlyRate rating reviewCount email"
            })
            .populate("jobId", "title description budget status");

        if (!contract) {
            return res.status(404).json({ success: false, message: "Contract not found" });
        }

        // Verify that the requesting user is either the client or freelancer
        const isClient = contract.clientId._id.toString() === targetUserId.toString();
        const isFreelancer = contract.freelancerId._id.toString() === targetUserId.toString();

        if (!isClient && !isFreelancer) {
            return res.status(403).json({ success: false, message: "Forbidden: You can only view your own contracts" });
        }

        return res.status(200).json({ success: true, data: contract });

    } catch (error: any) {
        console.error("Error in getContractById:", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
            error: error.message
        });
    }
});
