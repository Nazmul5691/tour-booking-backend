/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/no-unused-vars */
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

})


const getUserBookings = catchAsync(async (req: Request, res: Response) =>{

})


const getSingleBooking = catchAsync(async (req: Request, res: Response) =>{

})


const updateBookingStatus = catchAsync(async(req: Request, res: Response) =>{

})



export const BookingController = {
    createBooking,
    getAllBookings,
    getUserBookings,
    getSingleBooking,
    updateBookingStatus
}