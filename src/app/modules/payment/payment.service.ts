/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
import AppError from "../../errorHelpers/appError";
import { generatePdf, IInvoiceData } from "../../utils/invoice";
// import { sendEmail } from "../../utils/sendEmail";
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

   


    const sslPayload: ISSLCommerz = {
        address: userAddress,
        email: userEmail,
        phone: userPhoneNumber,
        name: userName,
        amount: payment.totalAmount,
        transactionId: payment.transactionId
    }

    

    const sslPayment = await SSLService.sslPaymentInit(sslPayload);

    return {
        paymentURL: sslPayment.GatewayPageURL
    }
};


// Shared function to process successful payment and generate invoice
const processSuccessfulPayment = async (transactionId: string) => {
    
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        // CRITICAL FIX: Check status BEFORE updating
        const existingPayment = await Payment.findOne({ transactionId: transactionId }).session(session);

        if (!existingPayment) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
        }


        // If already fully processed (PAID + has invoice), skip
        if (existingPayment.status === PAYMENT_STATUS.PAID && existingPayment.invoiceUrl) {
            await session.commitTransaction();
            session.endSession();
            return {
                success: true,
                message: "Payment already processed",
                bookingId: existingPayment.booking.toString()
            };
        }

        // Now update payment to PAID
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: transactionId },
            { status: PAYMENT_STATUS.PAID },
            { runValidators: true, session: session, new: true }
        );

        if (!updatedPayment) {
            throw new AppError(httpStatus.NOT_FOUND, "Failed to update payment");
        }

        const updatedBooking = await Booking
            .findByIdAndUpdate(
                updatedPayment.booking,
                { status: BOOKING_STATUS.COMPLETE },
                { new: true, runValidators: true, session }
            )
            .populate("tour", "title")
            .populate("user", "name email")
            .populate("guide");

        if (!updatedBooking) {
            console.log("❌ [INVOICE] Booking not found");
            throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
        }


        // GUIDE WALLET UPDATE 
        if (updatedBooking.guide && updatedBooking.guideFee) {
            await Guide.findOneAndUpdate(
                { user: updatedBooking.guide },
                { $inc: { walletBalance: updatedBooking.guideFee } },
                { session }
            );
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.totalAmount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name
        };

        
        const pdfBuffer = await generatePdf(invoiceData);
        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

        if (!cloudinaryResult) {
            throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading pdf to Cloudinary");
        }

        const finalPayment = await Payment.findByIdAndUpdate(
            updatedPayment._id,
            { invoiceUrl: cloudinaryResult.secure_url },
            { runValidators: true, session, new: true }
        );


        await session.commitTransaction();
        session.endSession();


        return {
            success: true,
            message: "Payment Completed Successfully",
            bookingId: updatedBooking._id.toString()
        };

    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};


const successPayment = async (query: Record<string, string>) => {
    return await processSuccessfulPayment(query.transactionId);
};




const failPayment = async (query: Record<string, string>) => {
    

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

        await session.commitTransaction();      
        session.endSession();

        return { success: false, message: "Payment failed" };

    } catch (error) {
        await session.abortTransaction();       
        session.endSession();
        throw error;
    }
};


const cancelPayment = async (query: Record<string, string>) => {
   
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

        await session.commitTransaction();       
        session.endSession();

        return { success: false, message: "Payment cancelled" };

    } catch (error) {
        await session.abortTransaction();       
        session.endSession();
        throw error;
    }
};


const getInvoiceDownloadUrl = async (paymentId: string) => {
    const payment = await Payment.findById(paymentId).select("invoiceUrl");

    if (!payment) {
        throw new AppError(404, "Payment not found");
    }

    if (!payment.invoiceUrl) {
        throw new AppError(404, "No invoice found");
    }

    return { invoiceUrl: payment.invoiceUrl };
};


// Function to handle IPN validation and trigger invoice generation
const validateAndProcessPayment = async (ipnData: any) => {

    try {
        // Validate the payment with SSLCommerz
        await SSLService.validatePayment(ipnData);

        // Check the payment status from IPN data
        if (ipnData.status !== 'VALID' && ipnData.status !== 'VALIDATED') {
            return { success: false, message: "Payment status is not VALID" };
        }

      
        // Find payment
        const payment = await Payment.findOne({ transactionId: ipnData.tran_id });

        if (!payment) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found for transaction: " + ipnData.tran_id);
        }

        

        // Update payment gateway data (always update this)
        
        await Payment.findByIdAndUpdate(payment._id, {
            paymentGatewayData: ipnData
        });
        

        // Check if already fully processed
        if (payment.status === PAYMENT_STATUS.PAID && payment.invoiceUrl) {
           
            return { success: true, message: "Payment already processed" };
        }

       
        const result = await processSuccessfulPayment(ipnData.tran_id);
        
        return result;

    } catch (error: any) {
        
        console.error("Message:", error.message);
        
        throw error;
    }
};



export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    validateAndProcessPayment
};
















