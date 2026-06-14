import { Document, model, Schema, Types } from "mongoose";

export type ReportType = "spam" | "misconduct" | "payment";

export interface IReport extends Document {
  type: ReportType;
  description: string;
  jobId?: Types.ObjectId;
  reportedBy?: Types.ObjectId;
  resolved: boolean;
}

const reportSchema = new Schema<IReport>(
  {
    type: { type: String, enum: ["spam", "misconduct", "payment"], required: true },
    description: { type: String, required: true },
    jobId: { type: Schema.Types.ObjectId, ref: "job" },
    reportedBy: { type: Schema.Types.ObjectId, ref: "user" },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const ReportModel = model<IReport>("report", reportSchema);
