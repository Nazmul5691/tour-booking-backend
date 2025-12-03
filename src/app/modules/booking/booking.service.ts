
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import AppError from "../../errorHelpers/appError";
import { User } from "../user/user.model"
import { BOOKING_STATUS, IBooking } from "./booking.interface"
import httpStatus from 'http-status-codes'
import { Booking } from "./booking.model";
import { Payment } from "../payment/payment.model";
import { PAYMENT_STATUS } from "../payment/payment.interface";
import { Tour } from "../tour/tour.model";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { getTransactionId } from "../../utils/getTransactionId";
import { Guide } from "../guide/guide.model";
import { IUser } from "../user/user.interface";



const createBooking = async (payload: Partial<IBooking>, userId: string) => {
    const transactionId = getTransactionId();
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        // 1. Check user profile
        const user = await User.findById(userId);
        if (!user?.phone || !user?.address) {
            throw new AppError(httpStatus.BAD_REQUEST, "Please update your profile to book a tour");
        }

        // 2. Find Tour + discount info
        const tour = await Tour.findById(payload.tour).select(
            "costFrom guides startDate discountDate discountPercentage"
        );
        if (!tour) throw new AppError(400, "Tour not found");

        // 3. Check guide
        const guideUserId = tour.guides?.[0];
        if (!guideUserId) throw new AppError(400, "No guide assigned to this tour");

        const guide = await Guide.findOne({ user: guideUserId, status: "APPROVED" });
        if (!guide) throw new AppError(400, "Guide not approved");

        // 4. Calculate total amount
        const baseAmount = Number(tour.costFrom) * Number(payload.guestCount!);

        let discountPercentage = 0;
        let discountAmount = 0;
        let totalAmount = baseAmount;

        // Apply discount if eligible
        if (tour.discountDate && tour.discountPercentage) {
            const now = new Date();
            const deadline = new Date(tour.discountDate);

            if (now <= deadline) {
                discountPercentage = Number(tour.discountPercentage);
                discountAmount = (baseAmount * discountPercentage) / 100;
                totalAmount = baseAmount - discountAmount; // user pays discounted amount
            }
        }

        // Guide fee
        const guideFee = Number(guide.perTourCharge);

        // Company earning = discounted total - guide fee
        const companyEarning = totalAmount - guideFee;

        // 5. Create booking
        const booking = await Booking.create(
            [{
                user: userId,
                tour: tour._id,
                status: BOOKING_STATUS.PENDING,
                guide: guide.user,
                guestCount: payload.guestCount,
                baseAmount,
                discountPercentage,
                amountAfterDiscount: totalAmount,          // amount after discount
                guideFee,
                companyEarning,
                ...payload
            }],
            { session }
        );

        // 6. Create payment
        const payment = await Payment.create(
            [{
                booking: booking[0]._id,
                status: PAYMENT_STATUS.UNPAID,
                transactionId,
                baseAmount,           // original total before discount (optional, for reference)
                discountPercentage,
                totalAmount,          // required by schema (discounted total)
                amount: totalAmount,  // what user actually pays
                guideFee,
                companyEarning
            }],
            { session }
        );

        // 7. Attach payment to booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            booking[0]._id,
            { payment: payment[0]._id },
            { new: true, session }
        )
            .populate("user", "name email phone address")
            .populate("tour", "title costFrom startDate discountDate discountPercentage")
            .populate("payment")
            .populate("guide", "name email");

        // 8. Initialize SSL payment
        const userObj = updatedBooking?.user as unknown as IUser;
        const sslPayload: ISSLCommerz = {
            address: userObj.address,
            email: userObj.email,
            phone: userObj.phone,
            name: userObj.name,
            amount: totalAmount,  // user pays discounted total
            transactionId
        };

        const sslPayment = await SSLService.sslPaymentInit(sslPayload);

        await session.commitTransaction();
        session.endSession();

        return {
            payment: sslPayment.GatewayPageURL,
            booking: updatedBooking
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};



const getUserBookings = async () => {

    return {

    }
}


const getBookingById = async () => {

    return {

    }
}


const updateBookingStatus = async () => {

    return {

    }
}


const getAllBookings = async () => {

    return {}
}



export const BookingService = {
    createBooking,
    getUserBookings,
    getBookingById,
    updateBookingStatus,
    getAllBookings
}


