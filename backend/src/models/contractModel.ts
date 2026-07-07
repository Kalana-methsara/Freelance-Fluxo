import { Schema, model, Types, Document } from "mongoose";


export enum ContractStatus {
  PENDING   = "pending",    
  ACCEPTED  = "accepted",   
  DECLINED  = "declined",   
  COMPLETED = "completed",  
  CANCELLED = "cancelled",  
  DISPUTED  = "disputed",   
}

export enum BudgetType {
  FIXED  = "fixed",
  HOURLY = "hourly",
}


export interface IMilestone {
  title: string;
  amount: number;
  dueDate: Date;
  status: "pending" | "released";
}

export interface IContract extends Document {
  clientId: Types.ObjectId;
  freelancerId: Types.ObjectId;
  jobId?: Types.ObjectId;
  contractTitle: string;
  budgetType: BudgetType;
  totalAmount: number;
  hourlyRate?: number;
  estimatedHours?: number;
  deadline: Date;
  message: string;
  milestones: IMilestone[];
  escrowAmount: number;
  escrowFunded: boolean;
  status: ContractStatus;
  createdAt: Date; 
  updatedAt: Date;
}


const MilestoneSchema = new Schema<IMilestone>({
  title:   { type: String, required: true },
  amount:  { type: Number, required: true },
  dueDate: { type: Date,   required: true },
  status:  { type: String, enum: ["pending", "released"], default: "pending" },
});

const ContractSchema = new Schema<IContract>(
  {
    clientId:       { type: Schema.Types.ObjectId, ref: "User", required: true },
    freelancerId:   { type: Schema.Types.ObjectId, ref: "User", required: true },
    jobId:          { type: Schema.Types.ObjectId, ref: "Job" },
    contractTitle:  { type: String, required: true, trim: true },
    budgetType:     { type: String, enum: Object.values(BudgetType), required: true },
    totalAmount:    { type: Number, required: true, min: 0 },
    hourlyRate:     { type: Number },
    estimatedHours: { type: Number },
    deadline:       { type: Date, required: true },
    message:        { type: String, required: true, trim: true },
    milestones:     { type: [MilestoneSchema], default: [] },
    escrowAmount:   { type: Number, required: true, min: 0 },
    escrowFunded:   { type: Boolean, default: false },
    status:         { type: String, enum: Object.values(ContractStatus), default: ContractStatus.PENDING },
  },
  { 
    timestamps: true 
  }
);


export const ContractModel = model<IContract>("contract", ContractSchema);