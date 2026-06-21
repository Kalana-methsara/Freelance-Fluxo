import { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { ConversationModel } from "../models/conversationModel";
import { MessageModel } from "../models/messageModel";
import { UserModel } from "../models/userModel";

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user?._id;

  const conversations = await ConversationModel.find({ participants: currentUserId })
    .sort({ updatedAt: -1 })
    .populate({ path: "participants", select: "firstName lastName profileImage userRole" })
    .lean();

  const formatted = conversations.map((conversation) => {
    const participants = conversation.participants as any[];
    const otherUser = participants.find((user) => user._id.toString() !== currentUserId.toString()) || participants[0];

    return {
      _id: conversation._id,
      participant: otherUser,
      jobId: conversation.jobId,
      lastMessage: conversation.lastMessage || null,
      updatedAt: conversation.updatedAt,
    };
  });

  res.json({ success: true, data: formatted });
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user?._id;
  const { participantId, jobId } = req.body;

  if (!participantId) {
    return res.status(400).json({ success: false, message: "participantId is required" });
  }

  if (participantId === currentUserId?.toString()) {
    return res.status(400).json({ success: false, message: "Cannot create a conversation with yourself" });
  }

  if (!Types.ObjectId.isValid(participantId)) {
    return res.status(400).json({ success: false, message: "Invalid participantId" });
  }

  const participant = await UserModel.findById(participantId).select("firstName lastName profileImage userRole").lean();
  if (!participant) {
    return res.status(404).json({ success: false, message: "Participant not found" });
  }

  const query: any = {
    participants: { $all: [currentUserId, participantId] },
  };

  if (jobId) {
    if (!Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({ success: false, message: "Invalid jobId" });
    }
    query.jobId = jobId;
  }

  let conversation = await ConversationModel.findOne(query).populate({ path: "participants", select: "firstName lastName profileImage userRole" }).lean();

  if (!conversation) {
    conversation = await ConversationModel.create({
      participants: [currentUserId, participantId],
      jobId: jobId ? new Types.ObjectId(jobId) : undefined,
    });
  }

  const participantData = participant;
  res.status(201).json({
    success: true,
    data: {
      _id: conversation._id,
      participant: participantData,
      jobId: conversation.jobId || null,
      lastMessage: conversation.lastMessage || null,
    },
  });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user?._id;
  const conversationIdRaw = req.params.id;
  const conversationId = Array.isArray(conversationIdRaw) ? conversationIdRaw[0] : conversationIdRaw;

  if (!conversationId || Array.isArray(conversationIdRaw) || !Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({ success: false, message: "Invalid conversationId" });
  }

  const conversation = await ConversationModel.findById(conversationId).lean();
  if (!conversation) {
    return res.status(404).json({ success: false, message: "Conversation not found" });
  }

  const isParticipant = conversation.participants.some(
    (participant) => participant.toString() === currentUserId?.toString(),
  );

  if (!isParticipant) {
    return res.status(403).json({ success: false, message: "You are not authorized to view these messages" });
  }

  const messages = await MessageModel.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate({ path: "senderId", select: "firstName lastName profileImage" })
    .lean();

  res.json({ success: true, data: messages });
});
