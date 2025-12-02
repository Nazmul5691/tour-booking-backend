import { model, Schema } from "mongoose";
import { BOOKING_STATUS, IBooking } from "./booking.interface";



const bookingSchema = new Schema<IBooking>(
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
        payment: {
            type: Schema.Types.ObjectId,
            ref: "Payment"
        },
        status: {
            type: String,
            enum: Object.values(BOOKING_STATUS),
            default: BOOKING_STATUS.PENDING
        },
        guestCount: {
            type: Number,
            required: true,
        },
        guide: {
            type: Schema.Types.ObjectId,
            ref: "User"
        },
        totalAmount: {
            type: Number
        },
        guideFee: {
            type: Number
        },
        companyEarning: {
            type: Number
        }
    },
    {
        timestamps: true
    })


export const Booking = model<IBooking>("Booking", bookingSchema)