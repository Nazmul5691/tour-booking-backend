// src/app/modules/review/review.route.ts
import { Router } from "express";
import { ReviewController } from "./review.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { checkAuth } from "../../middlewares/checkAuth";
import { Role } from "../user/user.interface";
import { createGuideReviewValidation, createTourReviewValidation } from "./review.validation";

const router = Router();



router.post("/create-tour-review", checkAuth(...Object.values(Role)), validateRequest(createTourReviewValidation), ReviewController.createTourReview);

router.get("/tour-review", ReviewController.getTourReviews);

router.post("/create-guide-review", checkAuth(...Object.values(Role)), validateRequest(createGuideReviewValidation), ReviewController.createGuideReview);

router.get("/guide-review", ReviewController.getGuideReviews);

export const Reviews = router;
