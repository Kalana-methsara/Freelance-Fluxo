import { Document, model, Schema, Types } from "mongoose";

export type ConversationType = "direct" | "dispute" | "group";

export interface IMessageSummary {
  text: string;
  senderId: Types.ObjectId;
  createdAt: Date;
}

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  jobId?: Types.ObjectId;
  type?: ConversationType;
  title?: string;
  createdBy?: Types.ObjectId;
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
    type: {
      type: String,
      enum: ["direct", "dispute", "group"],
      default: "direct",
    },
    title: { type: String },
    createdBy: { type: Schema.Types.ObjectId, ref: "user" },
    lastMessage: { type: messageSummarySchema },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ participants: 1, jobId: 1 });

export const ConversationModel = model<IConversation>("conversation", conversationSchema);
