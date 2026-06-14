import { Document, model, Schema, Types } from "mongoose";

export type JobStatus =
  | "draft"
  | "open"
  | "in_progress"
  | "under_review"
  | "completed"
  | "flagged";

export interface IJob extends Document {
  title: string;
  description: string;
  budget: number;
  spent: number;
  deadline: Date;
  status: JobStatus;
  clientId: Types.ObjectId;
  freelancerId?: Types.ObjectId;
  categoryId?: Types.ObjectId;
  skills: string[];
}

const jobSchema = new Schema<IJob>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    budget: { type: Number, required: true },
    spent: { type: Number, default: 0 },
    deadline: { type: Date, required: true },
    status: {
      type: String,
      enum: ["draft", "open", "in_progress", "under_review", "completed", "flagged"],
      default: "open",
    },
    clientId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: "user" },
    categoryId: { type: Schema.Types.ObjectId, ref: "category" },
    skills: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const JobModel = model<IJob>("job", jobSchema);
