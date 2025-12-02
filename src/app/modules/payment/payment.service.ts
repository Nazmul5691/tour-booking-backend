/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/appError";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
import { sendEmail } from "../../utils/sendEmail";
import { BOOKING_STATUS } from "../booking/booking.interface";
import { Booking } from "../booking/booking.model";
import { Guide } from "../guide/guide.model";
import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
import { SSLService } from "../sslCommerz/sslCommerz.service";
import { ITour } from "../tour/tour.interface";
import { IUser } from "../user/user.interface";
import { PAYMENT_STATUS } from "./payment.interface";
import { Payment } from "./payment.model";
import httpStatus from 'http-status-codes'



const initPayment = async (bookingId: string) => {

    const payment = await Payment.findOne({ booking: bookingId });

    if (!payment) {
        throw new AppError(httpStatus.NOT_FOUND, "Payment not found . You have not booked this tour")
    }

    const booking = await Booking.findById(payment.booking)

    const userAddress = (booking?.user as any).address;
    const userEmail = (booking?.user as any).email;
    const userPhoneNumber = (booking?.user as any).phone;
    const userName = (booking?.user as any).name

    // console.log(userName);


    const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phone: userPhoneNumber,
        name: userName,
        amount: payment.totalAmount,
        transactionId: payment.transactionId
    }

    // console.log('after',sslPayload.name);

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    return {
        paymentURL: sslPayment.GatewayPageURL
    }
};


const successPayment = async (query: Record<string, string>) => {

    // Update Booking Status to Confirm 
    // Update Payment Status to PAID
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {

            status: PAYMENT_STATUS.PAID,

        }, { runValidators: true, session: session })

        if (!updatedPayment) {
            throw new AppError(401, "Payment not found")
        }

        // const updateBooking = await Booking
        const updatedBooking = await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            ).populate("tour", "title")
            .populate("user", "name email")
            .populate("guide");


        if (!updatedBooking) {
            throw new AppError(401, "Booking not found")
        }


        // ⭐⭐⭐⭐⭐ GUIDE WALLET UPDATE — ONLY NEW PART ⭐⭐⭐⭐⭐
        if (updatedBooking.guide && updatedBooking.guideFee) {
            await Guide.findOneAndUpdate(
                { user: updatedBooking.guide },           // guide.user stored here
                { $inc: { walletBalance: updatedBooking.guideFee } },
                { session }
            );
            console.log("Guide wallet updated +", updatedBooking.guideFee);
        }

        // console.log("Guide wallet updated +", updatedBooking.guideFee);


        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.totalAmount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name
        }

        const pdfBuffer = await generatePdf(invoiceData)

        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice")

        // console.log(cloudinaryResult);

        if (!cloudinaryResult) {
            throw new AppError(401, "Error uploading pdf")
        }

        await Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true, session })


        await sendEmail({
            to: (updatedBooking.user as unknown as IUser).email,
            subject: "Your Booking Invoice",
            templateName: "invoice",
            templateData: invoiceData,
            attachments: [
                {
                    filename: "invoice.pdf",
                    content: pdfBuffer,
                    contentType: "application/pdf"
                }
            ]
        })

        await session.commitTransaction();       //transaction
        session.endSession();

        return { success: true, message: "Payment Completed Successfully" };


    } catch (error) {
        await session.abortTransaction();        //rollBack
        session.endSession();
        throw error;
    }
};


// const successPayment = async (query: Record<string, string>) => {

//     const session = await Booking.startSession();
//     session.startTransaction();

//     try {
//         // 1. Update Payment status
//         const updatedPayment = await Payment.findOneAndUpdate(
//             { transactionId: query.transactionId },
//             { status: PAYMENT_STATUS.PAID },
//             { new: true, runValidators: true, session }
//         );

//         if (!updatedPayment) {
//             throw new AppError(401, "Payment not found");
//         }

//         // 2. Update Booking status
//         const updatedBooking = await Booking.findByIdAndUpdate(
//             updatedPayment.booking,
//             { status: BOOKING_STATUS.COMPLETE },
//             { new: true, runValidators: true, session }
//         )
//             .populate("tour", "title")
//             .populate("user", "name email")
//             .populate("guide"); // IMPORTANT: Added populate guide here

//         if (!updatedBooking) {
//             throw new AppError(401, "Booking not found");
//         }

//         // 3. ⭐ ADD GUIDE WALLET UPDATE LOGIC HERE ⭐
//         const guideUserId = updatedBooking.guide; // guide.user ObjectId already stored

//         await Guide.findOneAndUpdate(
//             { user: guideUserId },              // Match by Guide.user
//             { $inc: { walletBalance: updatedBooking.guideFee } }, // Add guide fee
//             { session }
//         );

//         // console.log("Guide wallet updated +", updatedBooking.guideFee);

//         // 4. Generate invoice
//         const invoiceData: IInvoiceData = {
//             bookingDate: updatedBooking.createdAt as Date,
//             guestCount: updatedBooking.guestCount,
//             totalAmount: updatedPayment.amount,   // FIXED
//             tourTitle: (updatedBooking.tour as any).title,
//             transactionId: updatedPayment.transactionId,
//             userName: (updatedBooking.user as any).name
//         };

//         const pdfBuffer = await generatePdf(invoiceData);

//         const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

//         if (!cloudinaryResult) {
//             throw new AppError(401, "Error uploading pdf");
//         }

//         // 5. Add Invoice URL
//         await Payment.findByIdAndUpdate(
//             updatedPayment._id,
//             { invoiceUrl: cloudinaryResult.secure_url },
//             { runValidators: true, session }
//         );

//         // 6. Email invoice
//         await sendEmail({
//             to: (updatedBooking.user as any).email,
//             subject: "Your Booking Invoice",
//             templateName: "invoice",
//             templateData: invoiceData,
//             attachments: [
//                 {
//                     filename: "invoice.pdf",
//                     content: pdfBuffer,
//                     contentType: "application/pdf"
//                 }
//             ]
//         });

//         // 7. Commit transaction
//         await session.commitTransaction();
//         session.endSession();

//         return { success: true, message: "Payment Completed Successfully" };

//     } catch (error) {
//         await session.abortTransaction();
//         session.endSession();
//         throw error;
//     }
// };




const failPayment = async (query: Record<string, string>) => {
    // Update Booking Status to fail 
    // Update Payment Status to fail

    const session = await Booking.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {

            status: PAYMENT_STATUS.FAILED,

        }, { runValidators: true, session: session })

        // const updateBooking = await Booking
        await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.FAILED },
                // { new: true, runValidators: true, session }
                { runValidators: true, session }
            )

        await session.commitTransaction();       //transaction
        session.endSession();

        return { success: false, message: "Payment failed" };

    } catch (error) {
        await session.abortTransaction();        //rollBack
        session.endSession();
        throw error;
    }
};


const cancelPayment = async (query: Record<string, string>) => {
    // Update Booking Status to cancel 
    // Update Payment Status to cancel
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {

            status: PAYMENT_STATUS.CANCELLED,

        }, { runValidators: true, session: session })

        // const updateBooking = await Booking
        await Booking
            .findByIdAndUpdate(
                updatedPayment?.booking,
                { status: BOOKING_STATUS.CANCEL },
                { runValidators: true, session }
            )

        await session.commitTransaction();       //transaction
        session.endSession();

        return { success: false, message: "Payment cancelled" };

    } catch (error) {
        await session.abortTransaction();        //rollBack
        session.endSession();
        throw error;
    }
};


const getInvoiceDownloadUrl = async (paymentId: string) => {
    const payment = await Payment.findById(paymentId)
        .select("invoiceUrl")

    if (!payment) {
        throw new AppError(401, "Payment not found")
    }

    if (!payment.invoiceUrl) {
        throw new AppError(401, "No invoice found")
    }

    return payment.invoiceUrl
};



export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl
};