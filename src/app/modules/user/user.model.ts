import { model, Schema } from "mongoose";
import { IAuthProvider, IGuideInfo, IsActive, IUser, Role } from "./user.interface";
import { GUIDE_STATUS } from "../guide/guide.interface";


const authProviderSchema = new Schema<IAuthProvider>(
    {
        provider: {
            type: String,
            required: true
        },
        providerId: {
            type: String,
            required: true
        }
    },
    {
        versionKey: false,
        _id: false
    }
)

const guideInfoSchema = new Schema<IGuideInfo>(
    {
        bio: {
            type: String,
            required: false
        },
        location: {
            type: String,
            required: false
        },
        languages: {
            type: [String],
            required: false
        },
        experienceYears: {
            type: Number,
            required: false
        },
        perTourCharge: {
            type: Number,
            required: false
        },
        availableTours: [
            {
                type: Schema.Types.ObjectId,
                ref: "Tour"
            }
        ],
    },
    { _id: false }
);


const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String
        },
        role: {
            type: String,
            enum: Object.values(Role),
            default: Role.USER
        },
        phone: {
            type: String,
            unique: true,
            sparse: true, 
            required: false
        },
        picture: {
            type: String
        },
        address: {
            type: String
        },
        isDeleted: {
            type: Boolean,
            default: false
        },
        isActive: {
            type: String,
            enum: Object.values(IsActive),
            default: IsActive.ACTIVE
        },
        isVerified: {
            type: Boolean,
            // default: false
            default: true
        },
        auths: [authProviderSchema],

        guideInfo: guideInfoSchema,
        guideStatus: {
            type: String,
            enum: Object.values(GUIDE_STATUS),
            default: GUIDE_STATUS.PENDING
        }

    },
    {
        timestamps: true,
        versionKey: false
    }
)


export const User = model<IUser>("User", userSchema);