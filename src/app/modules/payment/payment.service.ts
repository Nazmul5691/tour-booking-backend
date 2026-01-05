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
    console.log("🔵 [INVOICE] Starting processSuccessfulPayment for:", transactionId);
    
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        // CRITICAL FIX: Check status BEFORE updating
        console.log("🔵 [INVOICE] Checking payment status BEFORE update...");
        const existingPayment = await Payment.findOne({ transactionId: transactionId }).session(session);

        if (!existingPayment) {
            console.log("❌ [INVOICE] Payment not found");
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
        }

        console.log("✅ [INVOICE] Current payment status:", existingPayment.status);
        console.log("✅ [INVOICE] Current invoiceUrl:", existingPayment.invoiceUrl || "NOT SET");

        // If already fully processed (PAID + has invoice), skip
        if (existingPayment.status === PAYMENT_STATUS.PAID && existingPayment.invoiceUrl) {
            console.log("⚠️ [INVOICE] Payment already fully processed with invoice. Skipping.");
            await session.commitTransaction();
            session.endSession();
            return {
                success: true,
                message: "Payment already processed",
                bookingId: existingPayment.booking.toString()
            };
        }

        // Now update payment to PAID
        console.log("🔵 [INVOICE] Updating payment status to PAID...");
        const updatedPayment = await Payment.findOneAndUpdate(
            { transactionId: transactionId },
            { status: PAYMENT_STATUS.PAID },
            { runValidators: true, session: session, new: true }
        );

        if (!updatedPayment) {
            console.log("❌ [INVOICE] Failed to update payment");
            throw new AppError(httpStatus.NOT_FOUND, "Failed to update payment");
        }

        console.log("✅ [INVOICE] Payment updated to PAID");

        console.log("🔵 [INVOICE] Finding and updating booking...");
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

        console.log("✅ [INVOICE] Booking updated to COMPLETE");

        // GUIDE WALLET UPDATE 
        if (updatedBooking.guide && updatedBooking.guideFee) {
            console.log("🔵 [INVOICE] Updating guide wallet +", updatedBooking.guideFee);
            await Guide.findOneAndUpdate(
                { user: updatedBooking.guide },
                { $inc: { walletBalance: updatedBooking.guideFee } },
                { session }
            );
            console.log("✅ [INVOICE] Guide wallet updated");
        }

        const invoiceData: IInvoiceData = {
            bookingDate: updatedBooking.createdAt as Date,
            guestCount: updatedBooking.guestCount,
            totalAmount: updatedPayment.totalAmount,
            tourTitle: (updatedBooking.tour as unknown as ITour).title,
            transactionId: updatedPayment.transactionId,
            userName: (updatedBooking.user as unknown as IUser).name
        };

        console.log("🔵 [INVOICE] Invoice data:", JSON.stringify(invoiceData));
        console.log("🔵 [INVOICE] Generating PDF...");
        
        const pdfBuffer = await generatePdf(invoiceData);
        console.log("✅ [INVOICE] PDF generated. Size:", pdfBuffer.length, "bytes");

        console.log("🔵 [INVOICE] Uploading to Cloudinary...");
        const cloudinaryResult = await uploadBufferToCloudinary(pdfBuffer, "invoice");

        if (!cloudinaryResult) {
            console.log("❌ [INVOICE] Cloudinary upload failed");
            throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading pdf to Cloudinary");
        }

        console.log("✅ [INVOICE] Uploaded to Cloudinary:", cloudinaryResult.secure_url);

        console.log("🔵 [INVOICE] Saving invoiceUrl to payment...");
        const finalPayment = await Payment.findByIdAndUpdate(
            updatedPayment._id,
            { invoiceUrl: cloudinaryResult.secure_url },
            { runValidators: true, session, new: true }
        );

        console.log("✅✅✅ [INVOICE] Invoice URL saved:", finalPayment?.invoiceUrl);

        await session.commitTransaction();
        session.endSession();

        console.log("✅✅✅ [INVOICE] TRANSACTION COMMITTED - Invoice generation complete!");

        return {
            success: true,
            message: "Payment Completed Successfully",
            bookingId: updatedBooking._id.toString()
        };

    } catch (error: any) {
        await session.abortTransaction();
        session.endSession();
        console.error("❌❌❌ [INVOICE] ERROR in processSuccessfulPayment:");
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
        throw error;
    }
};


const successPayment = async (query: Record<string, string>) => {
    console.log("🟢 [SUCCESS] Called with transaction:", query.transactionId);
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
    console.log("🟣 [IPN] ========================================");
    console.log("🟣 [IPN] NEW IPN RECEIVED");
    console.log("🟣 [IPN] Transaction:", ipnData.tran_id);
    console.log("🟣 [IPN] Status:", ipnData.status);
    console.log("🟣 [IPN] Amount:", ipnData.amount);
    console.log("🟣 [IPN] ========================================");

    try {
        // Validate the payment with SSLCommerz
        console.log("🟣 [IPN] Validating with SSLCommerz...");
        await SSLService.validatePayment(ipnData);
        console.log("✅ [IPN] Validation passed");

        // Check the payment status from IPN data
        if (ipnData.status !== 'VALID' && ipnData.status !== 'VALIDATED') {
            console.log("❌ [IPN] Invalid status:", ipnData.status);
            return { success: false, message: "Payment status is not VALID" };
        }

        console.log("✅ [IPN] Status is VALID");

        // Find payment
        console.log("🟣 [IPN] Finding payment in database...");
        const payment = await Payment.findOne({ transactionId: ipnData.tran_id });

        if (!payment) {
            console.log("❌ [IPN] Payment not found");
            throw new AppError(httpStatus.NOT_FOUND, "Payment not found for transaction: " + ipnData.tran_id);
        }

        console.log("✅ [IPN] Payment found");
        console.log("Current status:", payment.status);
        console.log("Current invoiceUrl:", payment.invoiceUrl || "NOT SET");

        // Update payment gateway data (always update this)
        console.log("🟣 [IPN] Updating paymentGatewayData...");
        await Payment.findByIdAndUpdate(payment._id, {
            paymentGatewayData: ipnData
        });
        console.log("✅ [IPN] Gateway data updated");

        // Check if already fully processed
        if (payment.status === PAYMENT_STATUS.PAID && payment.invoiceUrl) {
            console.log("⚠️ [IPN] Already processed with invoice. Skipping invoice generation.");
            return { success: true, message: "Payment already processed" };
        }

        // Process payment and generate invoice
        console.log("🟣 [IPN] Starting invoice generation...");
        const result = await processSuccessfulPayment(ipnData.tran_id);
        console.log("✅✅✅ [IPN] Invoice generation completed!");
        
        return result;

    } catch (error: any) {
        console.error("❌❌❌ [IPN] ERROR:");
        console.error("Message:", error.message);
        console.error("Stack:", error.stack);
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