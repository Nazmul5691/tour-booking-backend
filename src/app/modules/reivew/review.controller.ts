/* eslint-disable @typescript-eslint/no-explicit-any */

import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ReviewService } from "./review.service";
import { createGuideReviewValidation, createTourReviewValidation } from "./review.validation";

export const createTourReview = catchAsync(async (req: any, res) => {
    const validated = createTourReviewValidation.parse(req.body);
    const result = await ReviewService.createTourReview(req.user, validated);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Tour review submitted",
        data: result,
    });
});



export const createGuideReview = catchAsync(async (req: any, res) => {
    const validated = createGuideReviewValidation.parse(req.body);
    const result = await ReviewService.createGuideReview(req.user, validated);

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: "Guide review submitted",
        data: result,
    });
});



export const getTourReviews = catchAsync(async (req, res) => {
    const result = await ReviewService.getAllTourReviews(req.query);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Tour reviews retrieved",
        data: result,
    });
});




export const getGuideReviews = catchAsync(async (req, res) => {
    const result = await ReviewService.getAllGuideReviews(req.query);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Guide reviews retrieved",
        data: result,
    });
});


export const ReviewController = {
    createTourReview,
    getTourReviews,
    createGuideReview,
    getGuideReviews,
};  