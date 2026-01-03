
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
    
    
    const role = (req.user as JwtPayload).role;
    
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
    
    
    const userId = (req.user as JwtPayload).userId; 
    const query = req.query;

   
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
    
    
    const userId = (req.user as JwtPayload).userId; 

    
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