import { Types } from "mongoose";

export enum BOOKING_STATUS{
    PENDING = "PENDING",
    CANCEL = "CANCEL",
    COMPLETE = "COMPLETE",
    FAILED = "FAILED"
}

export interface IBooking {
    user: Types.ObjectId;
    tour: Types.ObjectId;
    payment?: Types.ObjectId;
    guestCount: number;
    status: BOOKING_STATUS;
    baseAmount?: number;
    discountPercentage?: number;
    amountAfterDiscount?: number;
    discountDate?: Date;
    guide?: Types.ObjectId;
    guideFee?: number;
    companyEarning?: number;
    createdAt?: Date;
    hasReview?: boolean; 
}