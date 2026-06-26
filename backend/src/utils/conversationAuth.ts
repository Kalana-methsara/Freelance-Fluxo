import { Types } from "mongoose";
import { ConversationModel, IConversation } from "../models/conversationModel";

export class ConversationAuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ConversationAuthError";
  }
}

export async function assertParticipant(
  conversationId: string,
  userId: string
): Promise<IConversation> {
  if (!Types.ObjectId.isValid(conversationId)) {
    throw new ConversationAuthError("Invalid conversationId", 400);
  }

  const conversation = await ConversationModel.findById(conversationId);
  if (!conversation) {
    throw new ConversationAuthError("Conversation not found", 404);
  }

  if (!conversation.participants.some((p) => p.toString() === userId)) {
    throw new ConversationAuthError("You are not authorized to access this conversation", 403);
  }

  return conversation;
}
