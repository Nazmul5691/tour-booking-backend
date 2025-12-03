/* eslint-disable @typescript-eslint/no-explicit-any */

import { Request, Response } from "express";
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



const getAllTourReviews = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    // Pass the query parameters to the service
    const result = await ReviewService.getAllTourReviews(query as Record<string, string>);

    // Handle the { data, meta } structure from QueryBuilder
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'All tour reviews retrieved successfully',
        data: result.data, 
        meta: result.meta,
    });
});




const getAllGuideReviews = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    // Pass the query parameters to the service
    const result = await ReviewService.getAllGuideReviews(query as Record<string, string>);

    // Handle the { data, meta } structure from QueryBuilder
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'All guide reviews retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});


export const ReviewController = {
    createTourReview,
    getAllTourReviews,
    createGuideReview,
    getAllGuideReviews,
};  