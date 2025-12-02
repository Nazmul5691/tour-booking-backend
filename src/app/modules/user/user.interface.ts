import { Types } from "mongoose";
import { GUIDE_STATUS } from "../guide/guide.interface";

export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    USER = "USER",
    GUIDE = "GUIDE"
}

// auth providers
/***
 * email, password
 * google authentication
 */

export interface IAuthProvider {
    // provider: string;       //"google", "credentials"
    provider: "google" | "credentials";       //"google", "credentials"
    providerId: string;
}

export enum IsActive {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    BLOCKED = "BLOCKED"
}


export interface IGuideInfo {
    bio?: string;
    location?: string;
    languages?: string[];
    experienceYears?: number;
    perTourCharge?: number;
    availableTours?: Types.ObjectId[];
}


export interface IUser {
    _id?: Types.ObjectId;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    picture?: string;
    address?: string;
    isDeleted?: string;
    isActive?: IsActive;
    isVerified?: boolean;
    role: Role;
    auths: IAuthProvider[];
    bookings?: Types.ObjectId[];
    // guides?: Types.ObjectId[];
    guideInfo?: IGuideInfo;
    guideStatus?: GUIDE_STATUS;
    createdAt?: Date
}