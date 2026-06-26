import { Document, model, Schema, Types } from "mongoose";

export interface ISubmission extends Document {
  jobId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  description: string;
  fileUrl: string;
  fileName: string;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<ISubmission>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: "job", required: true },
    freelancerId: { type: Schema.Types.ObjectId, ref: "user", required: true },
    description: { type: String, required: true },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
  },
  { timestamps: true }
);

export const SubmissionModel = model<ISubmission>("submission", submissionSchema);
