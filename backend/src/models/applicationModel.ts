import { Document, model, Schema, Types } from "mongoose";

export type ApplicationStatus = "pending" | "shortlisted" | "rejected" | "accepted" | "withdrawn";

export interface IApplication extends Document {
  jobId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  bid: number;
  coverLetter?: string;
  status: ApplicationStatus;
}

const applicationSchema = new Schema<IApplication>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "job", required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    bid: { type: Number, required: true },
    coverLetter: { type: String },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "rejected", "accepted", "withdrawn"],
      default: "pending",
    },
  },
  { timestamps: true }
);

applicationSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

export const ApplicationModel = model<IApplication>("application", applicationSchema);
