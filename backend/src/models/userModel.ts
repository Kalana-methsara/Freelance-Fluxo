import { Document, model, Schema } from 'mongoose';
import { UserRole } from "../enums/userRole";
import { ApprovalStatus } from "../enums/approvalStatus";
import locationSchema from './locationsModel';

export interface IUser extends Document {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    profileImage?: string;
    userRole: UserRole[];
    approvalStatus: ApprovalStatus;
    title?: string;
    skills?: string[];
    hourlyRate?: number;
    rating?: number;
    reviewCount?: number;
    companyName?: string;
    location?: {
        coordinates: { lat: number; lng: number };
        address: string;
        city: string;
        province: string;
        country: string;
    };
}

const userSchema = new Schema<IUser>({
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profileImage: { type: String },
    userRole: {
        type: [String],
        enum: Object.values(UserRole),
        default: [UserRole.FREELANCER]
    },
    approvalStatus: {
        type: String,
        enum: Object.values(ApprovalStatus),
        default: ApprovalStatus.PENDING,
        index: true
    },
    title: { type: String },
    skills: { type: [String], default: [] },
    hourlyRate: { type: Number, default: 0 },
    rating: { type: Number, default: 5, min: 1, max: 5 },
    reviewCount: { type: Number, default: 0 },
    companyName: { type: String },
    location: {
        type: locationSchema,
        required: false
    }
}, { 
    timestamps: true,
    toJSON: {
    transform: (_, res) => {
        delete (res as Partial<IUser>).password;
        return res;
    }
}
});

export const UserModel = model<IUser>('user', userSchema);