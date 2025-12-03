import { Types } from "mongoose";

export enum REVIEW_TARGET {
  TOUR = "TOUR",
  GUIDE = "GUIDE"
}

export interface IReview {
  user: Types.ObjectId;
  booking?: Types.ObjectId;   // link to booking (to ensure only booked users review)
  targetType: REVIEW_TARGET;  // TOUR or GUIDE
  tour?: Types.ObjectId;      // required if TOUR
  guide?: Types.ObjectId;     // required if GUIDE
  rating: number;             // 1-5
  comment?: string;
  createdAt?: Date;
}