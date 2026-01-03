import express from "express"
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { validateRequest } from "../../middlewares/validateRequest";
import { createBookingZodSchema, updateBookingStatusZodSchema } from "./booking.validation";
import { BookingController } from "./booking.controller";

const router = express.Router();



router.post("/",
    checkAuth(...Object.values(Role)),
    validateRequest(createBookingZodSchema),
    BookingController.createBooking
)



router.get("/",
    checkAuth(Role.ADMIN, Role.SUPER_ADMIN),
    BookingController.getAllBookings
)


router.get("/my-bookings",
    checkAuth(...Object.values(Role)),
    BookingController.getMyBookings
)


router.get("/:bookingId",
    checkAuth(Role.USER, Role.ADMIN, Role.SUPER_ADMIN),
    BookingController.getSingleBooking
)


router.patch("/:bookingId/status",
    checkAuth(...Object.values(Role)),
    validateRequest(updateBookingStatusZodSchema),
    BookingController.updateBookingStatus
)


export const BookingRoutes = router;
