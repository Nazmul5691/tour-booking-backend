/* eslint-disable @typescript-eslint/no-explicit-any */

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
import { QueryBuilder } from "../../utils/queryBuilder";



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


const getAllBookings = async (query: Record<string, string>, role: string) => {

    // 1. 🛑 Role-Based Access Validation
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to view all bookings."
        );
    }

    // 2. Proceed with Query Building and Data Retrieval
    const queryBuilder = new QueryBuilder(
        Booking.find().populate('user', 'name email').populate('tour', 'title slug location'),
        query
    );

    const bookingsData = await queryBuilder
        // .search(bookingSearchableFields) // Keeping commented as in original code
        .sort()
        .filter()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        bookingsData.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};


const getBookingById = async (bookingId: string, userId: string, role: string) => {

    // 1. Retrieve the booking (including referenced IDs for comparison)
    const booking = await Booking.findById(bookingId)
        .populate('user', 'name email')
        .populate('tour', 'title slug location')
        .populate('guide', 'name email');

    if (!booking) {
        throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    // Convert ObjectIds to strings for accurate comparison
    const bookingOwnerId = booking.user._id.toString();


    // 2. 🛑 Access Control Validation

    // Check 1: ADMIN/SUPER_ADMIN can view ANY booking
    const isAdminOrSuperAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

    // Check 2: The user is the booking owner
    const isOwner = bookingOwnerId === userId;



    // Grant access if ANY of the checks are true
    if (isAdminOrSuperAdmin || isOwner) {
        // Access granted!
    }
    // Otherwise, access is forbidden
    else {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to view this booking. Access is restricted to the booking owner, the assigned guide, or administrative staff."
        );
    }

    // 3. Return the data
    return {
        data: booking
    };
};


// const getMyBookings = async (userId: string, query: Record<string, string>) => {

//     // Force filter by the authenticated user's ID
//     const filterQuery = {
//         ...query,
//         user: userId, // <-- Enforces ownership: only data belonging to this userId is fetched
//     };

//     const queryBuilder = new QueryBuilder(
//         Booking.find().populate('user', 'name email').populate('tour', 'title slug location'),
//         filterQuery
//     );

//     const searchableFields = ['tour.title', 'tour.location'];

//     const bookingsData = await queryBuilder
//         .search(searchableFields)  
//         .sort()
//         .filter()
//         .fields()
//         .paginate();

//     const [data, meta] = await Promise.all([
//         bookingsData.build(),
//         queryBuilder.getMeta()
//     ]);


//     return {
//         data,
//         meta
//     };
// };
// const getMyBookings = async (userId: string, query: Record<string, string>) => {
//     const filterQuery = {
//         ...query,
//         user: userId,
//     };

//     // If there's a searchTerm, we need to find matching tours first
//     let tourIds: any[] = [];
//     if (query.searchTerm) {
//         const tours = await Tour.find({
//             $or: [
//                 { title: { $regex: query.searchTerm, $options: 'i' } },
//                 { location: { $regex: query.searchTerm, $options: 'i' } }
//             ]
//         }).select('_id');

//         tourIds = tours.map(t => t._id);

//         // Add tour filter to the query
//         if (tourIds.length > 0) {
//             filterQuery.tour = { $in: tourIds };
//         } else {
//             // No matching tours, return empty result
//             return {
//                 data: [],
//                 meta: {
//                     page: 1,
//                     limit: 10,
//                     total: 0,
//                     totalPage: 0
//                 }
//             };
//         }
//     }

//     const queryBuilder = new QueryBuilder(
//         Booking.find().populate('user', 'name email').populate('tour', 'title slug location'),
//         filterQuery
//     );

//     const bookingsData = await queryBuilder
//         .filter()
//         .sort()
//         .fields()
//         .paginate();

//     const [data, meta] = await Promise.all([
//         bookingsData.build(),
//         queryBuilder.getMeta()
//     ]);

//     return {
//         data,
//         meta
//     };
// };

const getMyBookings = async (userId: string, query: Record<string, string>) => {
    // ✅ FIX: Explicitly type filterQuery to allow dynamic properties
    const filterQuery: Record<string, any> = {
        ...query,
        user: userId,
    };

    // If there's a searchTerm, we need to find matching tours first
    let tourIds: any[] = [];
    if (query.searchTerm) {
        const tours = await Tour.find({
            $or: [
                { title: { $regex: query.searchTerm, $options: 'i' } },
                { location: { $regex: query.searchTerm, $options: 'i' } }
            ]
        }).select('_id');

        tourIds = tours.map(t => t._id);

        // Add tour filter to the query
        if (tourIds.length > 0) {
            filterQuery.tour = { $in: tourIds }; // ✅ Now this works
        } else {
            // No matching tours, return empty result
            return {
                data: [],
                meta: {
                    page: 1,
                    limit: 10,
                    total: 0,
                    totalPage: 0
                }
            };
        }
    }

    const queryBuilder = new QueryBuilder(
        Booking.find().populate('user', 'name email').populate('tour', 'title slug location'),
        filterQuery
    );

    const bookingsData = await queryBuilder
        .filter()
        .sort()
        .fields()
        .paginate();

    const [data, meta] = await Promise.all([
        bookingsData.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const updateBookingStatus = async (bookingId: string, status: string, userId: string) => {

    // 1. Find the existing booking
    const existingBooking = await Booking.findById(bookingId);

    if (!existingBooking) {
        throw new AppError(httpStatus.NOT_FOUND, "Booking not found");
    }

    const bookingOwnerId = existingBooking.user.toString();

    // 2. STRICT Ownership Check
    // Check if the authenticated user (userId) is the one who created the booking (bookingOwnerId)
    if (bookingOwnerId !== userId) {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not permitted to update this booking. Only the original booking owner can make changes."
        );
    }

    // 3. Status Validation (Assuming the owner can only CANCEL their booking)
    // If the owner can change the status, it is usually only to CANCELLED.
    if (status !== "CANCEL") {
        throw new AppError(
            httpStatus.BAD_REQUEST,
            "As the owner, you can only change the booking status to CANCELLED."
        );
    }

    // 4. Perform the update
    const updatedBooking = await Booking.findByIdAndUpdate(
        bookingId,
        { status },
        { new: true, runValidators: true }
    )
        .populate('user', 'name email')
        .populate('tour', 'title slug location')
        .populate('guide', 'name email');

    if (!updatedBooking) {
        throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, "Failed to retrieve the updated booking.");
    }

    return updatedBooking;
};




export const BookingService = {
    createBooking,
    getAllBookings,
    getMyBookings,
    getBookingById,
    updateBookingStatus,
}


