import express from "express"
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBookingZodSchema, updateBookingStatusZodSchema } from "./booking.validation";
import { BookingController } from "./booking.controller";

const router = express.Router();



// api/v1/booking     -> create booking
router.post("/",
    checkAuth(...Object.values(Role)),
    validateRequest(createBookingZodSchema),
    BookingController.createBooking
)


// api/v1/booking       -> get all bookings
router.get("/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    BookingController.getAllBookings
)


//api/v1/booking/my-bookings    ->get my bookings
router.get("/my-bookings",
    checkAuth(...Object.values(Role)),
    BookingController.getMyBookings
)


// api/v1/booking/bookingId        ->get single bookings
router.get("/:bookingId",
    checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
    BookingController.getSingleBooking
)


//api/v1/booking/bookingId/status       ->update bookings
router.patch("/:bookingId/status",
    checkAuth(...Object.values(Role)),
    validateRequest(updateBookingStatusZodSchema),
    BookingController.updateBookingStatus
)


export const BookingRoutes = router;
