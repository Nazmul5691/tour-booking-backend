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
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: transactionId },
            { status: PAYMENT_STATUS.PAID },
            { runValidators: true, session: session, new: true }
        );

        if (!updatedPayment) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
        }

        // Check if invoice already exists (avoid duplicate processing)
        if (updatedPayment.invoiceUrl) {
            console.log("Invoice already exists for transaction:", transactionId);
            await session.commitTransaction();
            session.endSession();
            return {
                success: true,
                message: "Payment already processed",
                bookingId: updatedPayment.booking.toString()
            };
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
            throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
        }

        // GUIDE WALLET UPDATE 
        if (updatedBooking.guide && updatedBooking.guideFee) {
            await Guide.findOneAndUpdate(
                { user: updatedBooking.guide },
                { $inc: { walletBalance: updatedBooking.guideFee } },
                { session }
            );
            console.log("Guide wallet updated +", updatedBooking.guideFee);
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.totalAmount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name
        };

        console.log("Generating PDF for transaction:", transactionId);
        const pdfBuffer = await generatePdf(invoiceData);

        console.log("Uploading PDF to Cloudinary for transaction:", transactionId);
        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

        if (!cloudinaryResult) {
            throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading pdf");
        }

        console.log("PDF uploaded successfully:", cloudinaryResult.secure_url);

        await Payment.findByIdAndUpdate(
            updatedPayment._id,
            { invoiceUrl: cloudinaryResult.secure_url },
            { runValidators: true, session }
        );

        await session.commitTransaction();
        session.endSession();

        return {
            success: true,
            message: "Payment Completed Successfully",
            bookingId: updatedBooking._id.toString()
        };

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("Error in processSuccessfulPayment:", error);
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


// const getInvoiceDownloadUrl = async (paymentId: string) => {
//     const payment = await Payment.findById(paymentId)
//         .select("invoiceUrl")

//     if (!payment) {
//         throw new AppError(401, "Payment not found")
//     }

//     if (!payment.invoiceUrl) {
//         throw new AppError(401, "No invoice found")
//     }

//     return payment.invoiceUrl
// };



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


// NEW: Function to handle IPN validation and trigger invoice generation
const validateAndProcessPayment = async (ipnData: any) => {
    console.log("Processing IPN data:", ipnData);

    // Validate the payment with SSLCommerz (this just validates, doesn't return status)
    await SSLService.validatePayment(ipnData);

    // Check the payment status from IPN data
    if (ipnData.status === 'VALID' || ipnData.status === 'VALIDATED') {
        // Check if payment is already processed
        const payment = await Payment.findOne({ transactionId: ipnData.tran_id });

        if (!payment) {
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found for transaction: " + ipnData.tran_id);
        }

        // If payment is already PAID and has invoiceUrl, skip
        if (payment.status === PAYMENT_STATUS.PAID && payment.invoiceUrl) {
            console.log("Payment already processed with invoice:", ipnData.tran_id);
            return { success: true, message: "Payment already processed" };
        }

        // Update payment gateway data
        await Payment.findByIdAndUpdate(payment._id, {
            paymentGatewayData: ipnData
        });

        // Process the successful payment and generate invoice
        return await processSuccessfulPayment(ipnData.tran_id);
    }

    return { success: false, message: "Payment validation failed" };
};



export const PaymentService = {
    initPayment,
    successPayment,
    failPayment,
    cancelPayment,
    getInvoiceDownloadUrl,
    validateAndProcessPayment
};



















// /* eslint-disable no-console */
// /* eslint-disable @typescript-eslint/no-explicit-any */


// import { uploadBufferToCloudinary } from "../../config/cloudinary.config";
// import AppError from "../../errorHelpers/appError";
// import { generatePdf, IInvoiceData } from "../../utils/invoice";
// // import { sendEmail } from "../../utils/sendEmail";
// import { BOOKING_STATUS } from "../booking/booking.interface";
// import { Booking } from "../booking/booking.model";
// import { Guide } from "../guide/guide.model";
// import { ISSLCommerz } from "../sslCommerz/sslCommerz.interface";
// import { SSLService } from "../sslCommerz/sslCommerz.service";
// import { ITour } from "../tour/tour.interface";
// import { IUser } from "../user/user.interface";
// import { PAYMENT_STATUS } from "./payment.interface";
// import { Payment } from "./payment.model";
// import httpStatus from 'http-status-codes'



// const initPayment = async (bookingId: string) => {

//     const payment = await Payment.findOne({ booking: bookingId });

//     if (!payment) {
//         throw new AppError(httpStatus.NOT_FOUND, "Payment not found . You have not booked this tour")
//     }

//     const booking = await Booking.findById(payment.booking)

//     const userAddress = (booking?.user as any).address;
//     const userEmail = (booking?.user as any).email;
//     const userPhoneNumber = (booking?.user as any).phone;
//     const userName = (booking?.user as any).name

   


//     const sslPayload: ISSLCommerz = {
//         address: userAddress,
//         email: userEmail,
//         phone: userPhoneNumber,
//         name: userName,
//         amount: payment.totalAmount,
//         transactionId: payment.transactionId
//     }

    

//     const sslPayment = await SSLService.sslPaymentInit(sslPayload);

//     return {
//         paymentURL: sslPayment.GatewayPageURL
//     }
// };


// const successPayment = async (query: Record<string, string>) => {

    
//     const session = await Booking.startSession();
//     session.startTransaction();

//     try {
//         const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {

//             status: PAYMENT_STATUS.PAID,

//         }, { runValidators: true, session: session, new: true })

//         if (!updatedPayment) {
//             throw new AppError(401, "Payment not found")
//         }

//         // const updateBooking = await Booking
//         const updatedBooking = await Booking
//             .findByIdAndUpdate(
//                 updatedPayment?.booking,
//                 { status: BOOKING_STATUS.COMPLETE },
//                 { new: true, runValidators: true, session }
//             ).populate("tour", "title")
//             .populate("user", "name email")
//             .populate("guide");


//         if (!updatedBooking) {
//             throw new AppError(401, "Booking not found")
//         }


//         // GUIDE WALLET UPDATE 
//         if (updatedBooking.guide && updatedBooking.guideFee) {
//             await Guide.findOneAndUpdate(
//                 { user: updatedBooking.guide },         
//                 { $inc: { walletBalance: updatedBooking.guideFee } },
//                 { session }
//             );
//             console.log("Guide wallet updated +", updatedBooking.guideFee);
//         }

//         // console.log("Guide wallet updated +", updatedBooking.guideFee);


//         const invoiceData: IInvoiceData = {
//             bookingDate: updatedBooking.createdAt as Date,
//             guestCount: updatedBooking.guestCount,
//             totalAmount: updatedPayment.totalAmount,
//             tourTitle: (updatedBooking.tour as unknown as ITour).title,
//             transactionId: updatedPayment.transactionId,
//             userName: (updatedBooking.user as unknown as IUser).name
//         }

//         const pdfBuffer = await generatePdf(invoiceData)

//         const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice")

//         // console.log(cloudinaryResult);

//         if (!cloudinaryResult) {
//             throw new AppError(401, "Error uploading pdf")
//         }

//         await Payment.findByIdAndUpdate(updatedPayment._id, { invoiceUrl: cloudinaryResult.secure_url }, { runValidators: true, session })


//         // await sendEmail({
//         //     to: (updatedBooking.user as unknown as IUser).email,
//         //     subject: "Your Booking Invoice",
//         //     templateName: "invoice",
//         //     templateData: invoiceData,
//         //     attachments: [
//         //         {
//         //             filename: "invoice.pdf",
//         //             content: pdfBuffer,
//         //             contentType: "application/pdf"
//         //         }
//         //     ]
//         // })

//         await session.commitTransaction();      
//         session.endSession();

//         // return { success: true, message: "Payment Completed Successfully" };
//         return {
//             success: true,
//             message: "Payment Completed Successfully",
//             bookingId: updatedBooking._id.toString() 
//         };


//     } catch (error) {
//         await session.abortTransaction();     
//         session.endSession();
//         throw error;
//     }
// };




// const failPayment = async (query: Record<string, string>) => {
    

//     const session = await Booking.startSession();
//     session.startTransaction();

//     try {
//         const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {

//             status: PAYMENT_STATUS.FAILED,

//         }, { runValidators: true, session: session })

//         // const updateBooking = await Booking
//         await Booking
//             .findByIdAndUpdate(
//                 updatedPayment?.booking,
//                 { status: BOOKING_STATUS.FAILED },
//                 // { new: true, runValidators: true, session }
//                 { runValidators: true, session }
//             )

//         await session.commitTransaction();      
//         session.endSession();

//         return { success: false, message: "Payment failed" };

//     } catch (error) {
//         await session.abortTransaction();       
//         session.endSession();
//         throw error;
//     }
// };


// const cancelPayment = async (query: Record<string, string>) => {
   
//     const session = await Booking.startSession();
//     session.startTransaction();

//     try {
//         const updatedPayment = await Payment.findOneAndUpdate({ transactionId: query.transactionId }, {

//             status: PAYMENT_STATUS.CANCELLED,

//         }, { runValidators: true, session: session })

//         // const updateBooking = await Booking
//         await Booking
//             .findByIdAndUpdate(
//                 updatedPayment?.booking,
//                 { status: BOOKING_STATUS.CANCEL },
//                 { runValidators: true, session }
//             )

//         await session.commitTransaction();       
//         session.endSession();

//         return { success: false, message: "Payment cancelled" };

//     } catch (error) {
//         await session.abortTransaction();       
//         session.endSession();
//         throw error;
//     }
// };


// // const getInvoiceDownloadUrl = async (paymentId: string) => {
// //     const payment = await Payment.findById(paymentId)
// //         .select("invoiceUrl")

// //     if (!payment) {
// //         throw new AppError(401, "Payment not found")
// //     }

// //     if (!payment.invoiceUrl) {
// //         throw new AppError(401, "No invoice found")
// //     }

// //     return payment.invoiceUrl
// // };



// const getInvoiceDownloadUrl = async (paymentId: string) => {
//     const payment = await Payment.findById(paymentId).select("invoiceUrl");

//     if (!payment) {
//         throw new AppError(404, "Payment not found");
//     }

//     if (!payment.invoiceUrl) {
//         throw new AppError(404, "No invoice found");
//     }

//     return { invoiceUrl: payment.invoiceUrl };
// };



// export const PaymentService = {
//     initPayment,
//     successPayment,
//     failPayment,
//     cancelPayment,
//     getInvoiceDownloadUrl
// };