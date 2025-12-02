import { model, Schema } from "mongoose";
import { IGuide, GUIDE_STATUS, IGuideApplication, APPLICATION_STATUS } from "./guide.interface";




const guideSchema = new Schema<IGuide>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        experienceYears: {
            type: Number,
            required: true
        },
        languages: {
            type: [String],
            default: []
        },
        // documents: {
        //     type: [String],
        //     default: []
        // },
        status: {
            type: String,
            enum: Object.values(GUIDE_STATUS),
            default: GUIDE_STATUS.PENDING
        },
        perTourCharge: {
            type: Number,
            required: true
        },
        walletBalance: {
            type:Number,
            default: 0
        }

    },
    {
        timestamps: true,
        versionKey: false
    }
);

export const Guide = model<IGuide>("Guide", guideSchema);



const guideApplicationSchema = new Schema<IGuideApplication>(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        tour: {
            type: Schema.Types.ObjectId,
            ref: "Tour",
            required: true
        },
        message: {
            type: String
        },
        status: {
            type: String,
            enum: Object.values(APPLICATION_STATUS),
            default: APPLICATION_STATUS.PENDING
        }
    },
    { timestamps: true }
);

export const GuideApplication = model<IGuideApplication>("GuideApplication", guideApplicationSchema);
