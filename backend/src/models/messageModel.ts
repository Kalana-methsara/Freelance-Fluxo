import { Document, model, Schema, Types } from "mongoose";

export interface IMessage extends Document {
  conversationId: Types.ObjectId;
  senderId: Types.ObjectId;
  text: string;
  readBy: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "conversation", required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    text: { type: String, required: true },
    readBy: [{ type: Schema.Types.ObjectId, ref: "user", default: [] }],
  },
  {
    timestamps: true,
  }
);

export const MessageModel = model<IMessage>("message", messageSchema);
