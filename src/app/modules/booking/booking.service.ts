
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





// const createBooking = async (payload: Partial<IBooking>, userId: string) => {

//     const transactionId = getTransactionId();

//     const session = await Booking.startSession();
//     session.startTransaction();


//     try {
//         const user = await User.findById(userId);
//         // console.log(user?.phone, user?.address);

//         if (!user?.phone || !user?.address) {
//             throw new AppError(httpStatus.BAD_REQUEST, "Please update your profile to Book a tour")
//         }

//         const tour = await Tour.findById(payload.tour).select("costFrom")

//         if (!tour?.costFrom) {
//             throw new AppError(httpStatus.BAD_REQUEST, "No tour cost found")
//         }

//         const amount = Number(tour?.costFrom) * Number(payload.guestCount!)

//         const booking = await Booking.create([{
//             user: userId,
//             status: BOOKING_STATUS.PENDING,
//             ...payload
//         }], { session })

//         // throw new Error("some fake error")

//         const payment = await Payment.create([{
//             booking: booking[0]._id,
//             status: PAYMENT_STATUS.UNPAID,
//             transactionId: transactionId,
//             amount: amount
//         }], { session })

//         const updateBooking = await Booking
//             .findByIdAndUpdate(
//                 booking[0]._id,
//                 { payment: payment[0]._id },
//                 { new: true, runValidators: true, session }
//             )
//             .populate("user", "name email phone address")
//             .populate("tour", "title costFrom")
//             .populate("payment")

//         const userAddress = (updateBooking?.user as any).address;
//         const userEmail = (updateBooking?.user as any).email;
//         const userPhoneNumber = (updateBooking?.user as any).phone;
//         const userName = (updateBooking?.user as any).name

//         // console.log(userName);


// const sslPayload: ISSLCommerz = {
//     address: userAddress,
//     email: userEmail,
//     phoneNumber: userPhoneNumber,
//     name: userName,
//     amount: amount,
//     transactionId: transactionId
// }

//         // console.log('after',sslPayload.name);

//         const sslPayment = await SSLService.sslPaymentInit(sslPayload);

//         await session.commitTransaction();       //transaction
//         session.endSession();

//         return {
//             payment: sslPayment.GatewayPageURL,
//             booking: updateBooking 
//         };


//     } catch (error) {
//         await session.abortTransaction();        //rollBack
//         session.endSession();
//         throw error;
//     }

// }


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

        // 2. Find Tour + check pricing
        const tour = await Tour.findById(payload.tour).select("costFrom guides");
        if (!tour) throw new AppError(400, "Tour not found");

        // must have at least 1 approved guide
        const guideUserId = tour.guides?.[0];
        if (!guideUserId) throw new AppError(400, "No guide assigned to this tour");

        const guide = await Guide.findOne({ user: guideUserId, status: "APPROVED" });
        if (!guide) throw new AppError(400, "Guide not approved");

        // 3. Pricing calculations
        const totalAmount = Number(tour.costFrom) * Number(payload.guestCount!); // total = costFrom × guest
        const guideFee = Number(guide.perTourCharge); // per booking
        const companyEarning = totalAmount - guideFee;

        // 4. Create initial booking
        const booking = await Booking.create(
            [{
                user: userId,
                status: BOOKING_STATUS.PENDING,
                guide: guide.user,
                totalAmount,
                guideFee,
                companyEarning,
                ...payload
            }],
            { session }
        );

        // 5. Create payment
        const payment = await Payment.create(
            [{
                booking: booking[0]._id,
                status: PAYMENT_STATUS.UNPAID,
                transactionId,
                amount: totalAmount,
                totalAmount,          // <-- ADD THIS
                guideFee,
                companyEarning        // <-- if you want to save these in payment table
            }],
            { session }
        );

        // 6. Attach payment to booking
        const updatedBooking = await Booking.findByIdAndUpdate(
            booking[0]._id,
            { payment: payment[0]._id },
            { new: true, session }
        )
            .populate("user", "name email phone address")
            .populate("tour", "title costFrom")
            .populate("payment")
            .populate("guide", "name email");

            

        // 7. Payment initialization
        const userObj = updatedBooking?.user as unknown as IUser;

        const sslPayload: ISSLCommerz = {
            address: userObj.address,
            email: userObj.email,
            phone: userObj.phone,
            name: userObj.name,
            amount: totalAmount,
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




// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Complete -> Backend(localhost:5000/api/v1/payment/success) -> Update Payment(PAID) & Booking(CONFIRM) -> redirect to frontend -> Frontend(localhost:5173/payment/success)

// Frontend(localhost:5173) - User - Tour - Booking (Pending) - Payment(Unpaid) -> SSLCommerz Page -> Payment Fail / Cancel -> Backend(localhost:5000) -> Update Payment(FAIL / CANCEL) & Booking(FAIL / CANCEL) -> redirect to frontend -> Frontend(localhost:5173/payment/cancel or localhost:5173/payment/fail)




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


