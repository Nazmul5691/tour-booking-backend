import { Types } from "mongoose";

export enum REVIEW_TARGET {
  TOUR = "TOUR",
  GUIDE = "GUIDE"
}

export interface IReview {
  user: Types.ObjectId;
  booking?: Types.ObjectId;  
  targetType: REVIEW_TARGET;
  tour?: Types.ObjectId;      
  guide?: Types.ObjectId;     
  rating: number;             
  comment?: string;
  createdAt?: Date;
}