import { model, Schema } from "mongoose";
import { IPayment, PAYMENT_STATUS } from "./payment.interface";


const paymentSchema = new Schema<IPayment>(
    {
        booking: {
            type: Schema.Types.ObjectId,
            ref: "Booking",
            required: true,
            unique: true
        },
        transactionId: {
            type: String,
            required: true,
            unique: true
        },
        amount: {
            type: Number,
            required: true
        },
        totalAmount: {
            type: Number,
            required: true
        },
        guideFee: {
            type: Number,
        },
        companyEarning: {
            type: Number,
        },
        paymentGatewayData: {
            type: Schema.Types.Mixed,
        },
        invoiceUrl: {
            type: String,
        },
        status: {
            type: String,
            enum: Object.values(PAYMENT_STATUS),
            default: PAYMENT_STATUS.UNPAID
        }
    },
    {
        timestamps: true
    }
)


export const Payment = model<IPayment>("Payment", paymentSchema)