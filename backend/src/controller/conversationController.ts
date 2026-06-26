import { Request, Response } from "express";
import { Types } from "mongoose";
import { asyncHandler } from "../middleware/asyncHandler";
import { AuthRequest } from "../middleware/authMiddleware";
import { ConversationModel, ConversationType } from "../models/conversationModel";
import { MessageModel } from "../models/messageModel";
import { UserModel } from "../models/userModel";
import { assertParticipant } from "../utils/conversationAuth";

const MAX_PARTICIPANTS = 5;
const VALID_TYPES: ConversationType[] = ["direct", "dispute", "group"];

const participantSelect = "firstName lastName profileImage userRole";

function normalizeParticipantIds(
  body: { participantIds?: string[]; participantId?: string },
  currentUserId: string
): string[] {
  if (Array.isArray(body.participantIds) && body.participantIds.length > 0) {
    return [...new Set(body.participantIds.map(String))];
  }
  if (body.participantId) {
    return [...new Set([currentUserId, String(body.participantId)])];
  }
  return [];
}

async function findExistingConversation(
  participantIds: Types.ObjectId[],
  jobId?: string
) {
  const query: Record<string, unknown> = {
    participants: { $all: participantIds, $size: participantIds.length },
  };

  if (jobId) {
    query.jobId = new Types.ObjectId(jobId);
  } else {
    query.$or = [{ jobId: null }, { jobId: { $exists: false } }];
  }

  return ConversationModel.findOne(query)
    .populate({ path: "participants", select: participantSelect })
    .lean();
}

async function getUnreadCounts(
  conversationIds: Types.ObjectId[],
  userId: string
): Promise<Map<string, number>> {
  if (!conversationIds.length) return new Map();

  const counts = await MessageModel.aggregate([
    {
      $match: {
        conversationId: { $in: conversationIds },
        readBy: { $nin: [new Types.ObjectId(userId)] },
      },
    },
    { $group: { _id: "$conversationId", count: { $sum: 1 } } },
  ]);

  return new Map(counts.map((row) => [row._id.toString(), row.count]));
}

function formatConversation(
  conversation: any,
  unreadCount: number
) {
  return {
    _id: conversation._id,
    participants: conversation.participants,
    jobId: conversation.jobId || null,
    type: conversation.type || "direct",
    title: conversation.title || null,
    createdBy: conversation.createdBy || null,
    lastMessage: conversation.lastMessage || null,
    unreadCount,
    updatedAt: conversation.updatedAt,
  };
}

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!._id.toString();

  const conversations = await ConversationModel.find({ participants: currentUserId })
    .sort({ updatedAt: -1 })
    .populate({ path: "participants", select: participantSelect })
    .lean();

  const unreadMap = await getUnreadCounts(
    conversations.map((c) => c._id as Types.ObjectId),
    currentUserId
  );

  const formatted = conversations.map((conversation) =>
    formatConversation(conversation, unreadMap.get(conversation._id.toString()) || 0)
  );

  res.json({ success: true, data: formatted });
});

export const createConversation = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!._id.toString();
  const { jobId, type, title } = req.body;

  const rawIds = normalizeParticipantIds(req.body, currentUserId);

  if (rawIds.length > MAX_PARTICIPANTS) {
    return res.status(400).json({
      success: false,
      message: `A conversation cannot have more than ${MAX_PARTICIPANTS} participants`,
    });
  }

  if (!rawIds.includes(currentUserId)) {
    return res.status(400).json({
      success: false,
      message: "You must be included in the participants list",
    });
  }

  for (const id of rawIds) {
    if (!Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: `Invalid participant id: ${id}` });
    }
  }

  const uniqueIds = [...new Set(rawIds)];

  if (uniqueIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: "At least 2 unique participants are required",
    });
  }

  if (uniqueIds.length !== rawIds.length) {
    return res.status(400).json({ success: false, message: "Duplicate participants are not allowed" });
  }

  if (jobId && !Types.ObjectId.isValid(jobId)) {
    return res.status(400).json({ success: false, message: "Invalid jobId" });
  }

  const conversationType: ConversationType =
    type && VALID_TYPES.includes(type) ? type : "direct";

  const users = await UserModel.find({ _id: { $in: uniqueIds } })
    .select(participantSelect)
    .lean();

  if (users.length !== uniqueIds.length) {
    return res.status(404).json({ success: false, message: "One or more participants not found" });
  }

  const participantObjectIds = uniqueIds
    .map((id) => new Types.ObjectId(id))
    .sort((a, b) => a.toString().localeCompare(b.toString()));

  let conversation = await findExistingConversation(participantObjectIds, jobId);

  if (!conversation) {
    const created = await ConversationModel.create({
      participants: participantObjectIds,
      jobId: jobId ? new Types.ObjectId(jobId) : undefined,
      type: conversationType,
      title: title?.trim() || undefined,
      createdBy: authReq.user!._id,
    });

    conversation = await ConversationModel.findById(created._id)
      .populate({ path: "participants", select: participantSelect })
      .lean();
  }

  res.status(201).json({
    success: true,
    data: formatConversation(conversation, 0),
  });
});

export const getMessages = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!._id.toString();
  const conversationIdRaw = req.params.id;
  const conversationId = Array.isArray(conversationIdRaw) ? conversationIdRaw[0] : conversationIdRaw;

  const conversation = await assertParticipant(conversationId, currentUserId);

  const messages = await MessageModel.find({ conversationId })
    .sort({ createdAt: 1 })
    .populate({ path: "senderId", select: "firstName lastName profileImage" })
    .lean();

  const participantCount = conversation.participants.length;

  const formatted = messages.map((msg) => ({
    ...msg,
    seen: (msg.readBy || []).some((id) => id.toString() === currentUserId),
    seenByAll: (msg.readBy || []).length >= participantCount,
  }));

  res.json({ success: true, data: formatted });
});

export const addParticipant = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!._id.toString();
  const conversationIdRaw = req.params.id;
  const conversationId = Array.isArray(conversationIdRaw) ? conversationIdRaw[0] : conversationIdRaw;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ success: false, message: "userId is required" });
  }

  if (!Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ success: false, message: "Invalid userId" });
  }

  const conversation = await assertParticipant(conversationId, currentUserId);

  if (conversation.participants.length >= MAX_PARTICIPANTS) {
    return res.status(400).json({
      success: false,
      message: `A conversation cannot have more than ${MAX_PARTICIPANTS} participants`,
    });
  }

  if (conversation.participants.some((p) => p.toString() === userId)) {
    return res.status(400).json({ success: false, message: "User is already a participant" });
  }

  const user = await UserModel.findById(userId).select(participantSelect).lean();
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found" });
  }

  conversation.participants.push(new Types.ObjectId(userId));
  await conversation.save();

  const updated = await ConversationModel.findById(conversation._id)
    .populate({ path: "participants", select: participantSelect })
    .lean();

  res.status(200).json({
    success: true,
    data: formatConversation(updated, 0),
    participant: user,
  });
});

export const markConversationRead = asyncHandler(async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const currentUserId = authReq.user!._id;
  const conversationIdRaw = req.params.id;
  const conversationId = Array.isArray(conversationIdRaw) ? conversationIdRaw[0] : conversationIdRaw;

  await assertParticipant(conversationId, currentUserId.toString());

  const result = await MessageModel.updateMany(
    { conversationId, readBy: { $ne: currentUserId } },
    { $addToSet: { readBy: currentUserId } }
  );

  res.json({
    success: true,
    data: { modifiedCount: result.modifiedCount },
  });
});
