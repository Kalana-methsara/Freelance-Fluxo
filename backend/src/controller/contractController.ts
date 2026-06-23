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

    // ── Validation ──
    if (!freelancerId || !contractTitle || !budgetType || !deadline || !message) {
        return res.status(400).json({ success: false, message: "Missing required fields." });
    }

    if (!Object.values(BudgetType).includes(budgetType)) {
        return res.status(400).json({ success: false, message: "Invalid budget type." });
    }

    // ── Freelancer exists check ──
    const freelancer = await UserModel.findOne({
        _id: new Types.ObjectId(freelancerId),
        userRole: UserRole.FREELANCER,
    });
    if (!freelancer) {
        return res.status(404).json({ success: false, message: "Freelancer not found." });
    }

    // ── Prevent hiring yourself ──
    if (freelancerId.toString() === clientId.toString()) {
        return res.status(400).json({ success: false, message: "You cannot hire yourself." });
    }

    // ── Escrow amount server-side recalculate (don't trust client) ──
    let contractAmount: number;
    if (budgetType === BudgetType.FIXED) {
        if (milestones.length > 0) {
            contractAmount = milestones[0].amount; // First milestone only funded upfront
        } else {
            contractAmount = Number(totalAmount);
        }
    } else {
        contractAmount = Number(hourlyRate) * Number(estimatedHours);
    }

    if (contractAmount <= 0) {
        return res.status(400).json({ success: false, message: "Contract amount must be greater than 0." });
    }

    const calculatedEscrow = contractAmount * (1 + PLATFORM_FEE_RATE);

    // ── Create contract ──
    const contract = await ContractModel.create({
        clientId: new Types.ObjectId(clientId),
        freelancerId: new Types.ObjectId(freelancerId),
        jobId: jobId ? new Types.ObjectId(jobId) : undefined,
        contractTitle: contractTitle.trim(),
        budgetType,
        totalAmount: contractAmount,
        hourlyRate: budgetType === BudgetType.HOURLY ? Number(hourlyRate) : undefined,
        estimatedHours: budgetType === BudgetType.HOURLY ? Number(estimatedHours) : undefined,
        deadline: new Date(deadline),
        message: message.trim(),
        milestones: milestones.map((m: any) => ({
            title: m.title.trim(),
            amount: Number(m.amount),
            dueDate: new Date(m.dueDate),
            status: "pending",
        })),
        escrowAmount: calculatedEscrow,
        escrowFunded: true, // Real payment gateway integrate කළාම මේක payment confirm වෙලා true කරන්න
        status: ContractStatus.PENDING,
    });

    // ── TODO: Send notification + email to freelancer ──
    // await notificationService.sendHireOfferNotification(freelancer, contract);
    // await emailService.sendHireOfferEmail(freelancer.email, contract);

    return res.status(201).json({
        success: true,
        message: "Hire offer sent successfully.",
        data: contract,
    });
});

// ── GET /contracts ───────────────────────────────────────────
// Client හෝ Freelancer ගේ contracts list
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

    // ── TODO: Notify client ──
    // await notificationService.sendOfferResponseNotification(contract, action);

    return res.status(200).json({
        success: true,
        message: `Offer ${action}ed successfully.`,
        data: contract,
    });
});