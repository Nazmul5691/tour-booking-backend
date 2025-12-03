// src/app/modules/review/review.model.ts
import { model, Schema } from "mongoose";
import { IReview, REVIEW_TARGET } from "./review.interface";

const reviewSchema = new Schema<IReview>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true
        },
        targetType: {
            type: String,
            enum: Object.values(REVIEW_TARGET),
            required: true
        },
        tour: {
            type: Schema.Types.ObjectId,
            ref: "Tour"
        },
        guide: {
            type: Schema.Types.ObjectId,
            ref: "Guide"
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },
        comment: {
            type: String
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Prevent duplicate review for same booking + target
// reviewSchema.index({ booking: 1, targetType: 1 }, { unique: true });

// Prevent multiple guide reviews for the same booking
reviewSchema.index({ booking: 1, guide: 1 }, { unique: true });

// Prevent multiple tour reviews for the same booking
reviewSchema.index({ booking: 1, tour: 1 }, { unique: true });


export const Review = model<IReview>("Review", reviewSchema);
