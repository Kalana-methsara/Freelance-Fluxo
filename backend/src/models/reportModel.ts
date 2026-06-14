import { Document, model, Schema, Types } from "mongoose";

export type ReportType = 
  | "scam" 
  | "harassment" 
  | "spam" 
  | "payment"
  | "misconduct" 
  | "other";

export interface IReport extends Document {
  type: ReportType;
  description: string;
  jobId?: Types.ObjectId;
  reportedBy?: Types.ObjectId;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: Types.ObjectId;
  createdAt: Date;   // ✅ added (from timestamps)
  updatedAt: Date;   // ✅ added (from timestamps)
}

const reportSchema = new Schema<IReport>(
  {
    type: {
      type: String,
      enum: ["scam", "harassment", "spam", "payment", "misconduct", "other"],
      required: true,
    },
    description: { type: String, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "job" },
    reportedBy: { type: Schema.Types.ObjectId, ref: "user" },
    resolved: { type: Boolean, default: false },
    resolvedAt: { type: Date },
    resolvedBy: { type: Schema.Types.ObjectId, ref: "user" },
  },
  { timestamps: true }
);

export const ReportModel = model<IReport>("report", reportSchema);