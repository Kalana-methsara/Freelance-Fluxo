import { Document, model, Schema, Types } from "mongoose";

export interface IMessageSummary {
  text: string;
  senderId: Types.ObjectId;
  createdAt: Date;
}

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  jobId?: Types.ObjectId;
  lastMessage?: IMessageSummary;
  createdAt: Date;
  updatedAt: Date;
}

const messageSummarySchema = new Schema<IMessageSummary>(
  {
    text: { type: String, required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    createdAt: { type: Date, required: true },
  },
  { _id: false }
);

const conversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "user", required: true }],
    jobId: { type: Schema.Types.ObjectId, ref: "job" },
    lastMessage: { type: messageSummarySchema },
  },
  {
    timestamps: true,
  }
);

export const ConversationModel = model<IConversation>("conversation", conversationSchema);
