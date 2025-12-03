import { Types } from "mongoose";

export enum GUIDE_STATUS {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export interface IGuide {
    user: Types.ObjectId;
    experienceYears: number;
    languages: string[];
    // documents?: string[]; 
    status: GUIDE_STATUS;
    perTourCharge: number;
    walletBalance: number;
    averageRating?: number;
    totalReviews?: number;
    createdAt?: Date;
}



export enum APPLICATION_STATUS {
    PENDING = "PENDING",
    APPROVED = "APPROVED",
    REJECTED = "REJECTED"
}

export interface IGuideApplication {
    user: Types.ObjectId;
    tour: Types.ObjectId;
    message?: string;
    status: APPLICATION_STATUS;
    createdAt?: Date;
    updatedAt?: Date;
}

