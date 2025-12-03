
import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { JwtPayload } from "jsonwebtoken";
import { BookingService } from "./booking.service";
import { sendResponse } from "../../utils/sendResponse";


const createBooking = catchAsync(async (req: Request, res: Response) => {

    const decodedToken = req.user as JwtPayload;

    const booking = await BookingService.createBooking(req.body, decodedToken.userId)

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Booking Created Successfully",
        data: booking
    })
})


const getAllBookings = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;
    
    // Extract the authenticated user's role
    const role = (req.user as JwtPayload).role;

    // Pass the query parameters AND the user's role to the service
    const result = await BookingService.getAllBookings(query as Record<string, string>, role);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'All bookings retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});


const getSingleBooking = catchAsync(async (req: Request, res: Response) => {
    const bookingId = req.params.bookingId;
    
    // Extract authenticated user details
    const authUser = req.user as JwtPayload;
    const userId = authUser.userId; 
    const role = authUser.role;

    // Pass bookingId, userId, and role to the service for access validation
    const result = await BookingService.getBookingById(bookingId, userId, role);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Booking retrieved successfully",
        data: result.data
    });
});


const getMyBookings = catchAsync(async (req: Request, res: Response) => {
    
    // Get the authenticated user's ID from the JWT payload
    const userId = (req.user as JwtPayload).userId; 
    const query = req.query;

    // Pass the userId to the service, which enforces the ownership filter
    const result = await BookingService.getMyBookings(userId, query as Record<string, string>);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'User bookings retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});


const updateBookingStatus = catchAsync(async (req: Request, res: Response) => {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    // 1. Extract the ID of the authenticated user from the JWT payload
    const userId = (req.user as JwtPayload).userId; 

    // 2. Pass bookingId, new status, and userId to the service.
    // The service handles: finding the booking, checking ownership (userId), and validating the status change.
    const updatedBooking = await BookingService.updateBookingStatus(bookingId, status, userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Booking status updated successfully.",
        data: updatedBooking
    });
});



export const BookingController = {
    createBooking,
    getAllBookings,
    getMyBookings,
    getSingleBooking,
    updateBookingStatus
}