import { Request, Response } from "express";
import { Types } from "mongoose";
import { ContractModel, ContractStatus, BudgetType } from "../models/contractModel";
import { UserModel } from "../models/userModel";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { UserRole } from "../enums/userRole";

const PLATFORM_FEE_RATE = 0.05;



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
        escrowFunded: true, 
        status: ContractStatus.PENDING,
    });

    await newContract.save();
    return res.status(201).json({ success: true, data: newContract });
});



export const getPendingOffers = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const freelancerId = authReq.user?._id;

    if (!freelancerId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    try {
        
        const targetId = typeof freelancerId === "string" ? new Types.ObjectId(freelancerId) : freelancerId;

        
        const contracts = await ContractModel.find({
            freelancerId: targetId,
            status: ContractStatus.PENDING,
        })
        
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
        .populate("jobId", "title") 
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



export const respondToOffer = asyncHandler(async (req: Request, res: Response) => {
    const authReq = req as AuthRequest;

    const freelancerId = authReq.user?._id;
    if (!freelancerId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const { action } = authReq.body; 
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
