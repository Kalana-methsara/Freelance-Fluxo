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