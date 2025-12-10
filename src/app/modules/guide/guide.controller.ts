/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { GuideService } from "./guide.service";
import { JwtPayload } from "jsonwebtoken";

const registerGuide = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as JwtPayload;
    const payload = req.body;

    const result = await GuideService.registerGuide(user.userId, payload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Guide application submitted successfully",
        data: result
    });
});


// const getAllGuides = catchAsync(async (req: Request, res: Response) => {
//     const query = req.query;

//     // Extract the authenticated user's role
//     const role = (req.user as JwtPayload).role;

//     // Pass query parameters AND the user's role to the service for validation
//     const result = await GuideService.getAllGuides(query as Record<string, string>, role);

//     sendResponse(res, {
//         statusCode: 200,
//         success: true,
//         message: 'All guides retrieved successfully',
//         data: result.data,
//         meta: result.meta,
//     });
// });

export const getAllGuides = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    // Extract the authenticated user's role
    const role = (req.user as JwtPayload).role;

    // Pass query parameters AND the user's role to the service
    const result = await GuideService.getAllGuides(query as Record<string, string>, role);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Approved guides retrieved successfully',
        data: result.data,
        meta: result.meta,
    });
});


const getSingleGuide = catchAsync(async (req: Request, res: Response) => {
    const guideId = req.params.id;
    const result = await GuideService.getSingleGuide(guideId);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Guide details retrieved",
        data: result
    });
});


const updateGuideStatus = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body; // Assuming the new status is in the request body

    // Extract the authenticated user's role
    const role = (req.user as JwtPayload).role;

    // Pass guideId, new status, AND the user's role to the service for validation
    const result = await GuideService.updateGuideStatus(id, status, role);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Guide status updated successfully',
        data: result,
    });
});




//applications for tours as guide
const applyForTourAsGuide = catchAsync(async (req: Request, res: Response) => {
    const user = req.user as any; // from checkAuth middleware
    const tourId = req.params.tourId;
    const message = req.body.message;

    const result = await GuideService.applyForTourAsGuide(user.userId, tourId, message);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "Application submitted",
        data: result
    });
});

const getApplicationsForTourGuide = catchAsync(async (req: Request, res: Response) => {
    const query = req.query;

    // Extract the authenticated user's role
    const role = (req.user as JwtPayload).role;

    // Pass the query parameters AND the user's role to the service for validation
    // The service now returns { data, meta }
    const result = await GuideService.getApplicationsForTourGuide(query as Record<string, string>, role);

    // 🛑 Updated to handle { data, meta } from the service result
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'All guide applications retrieved successfully',
        data: result.data, // Pass the fetched array of applications
        meta: result.meta, // Pass the pagination metadata
    });
});

// const approve = catchAsync(async (req: Request, res: Response) => {
//     const applicationId = req.params.applicationId;
//     const result = await GuideService.approveApplication(applicationId);

//     sendResponse(res, {
//         success: true,
//         statusCode: httpStatus.OK,
//         message: "Application approved",
//         data: result
//     });
// });

// const reject = catchAsync(async (req: Request, res: Response) => {
//     const applicationId = req.params.applicationId;
//     const result = await GuideService.rejectApplication(applicationId);

//     sendResponse(res, {
//         success: true,
//         statusCode: httpStatus.OK,
//         message: "Application rejected",
//         data: result
//     });
// });



const updateApplicationStatus = catchAsync(async (req, res) => {
    const applicationId = req.params.id;
    const { status } = req.body;
    const role = (req.user as JwtPayload).role;

    const result = await GuideService.updateApplicationStatus(
        applicationId,
        status,
        role
    );

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Application status updated to Approved",
        data: result
    });
});



export const GuideController = {
    registerGuide,
    getAllGuides,
    getSingleGuide,
    updateGuideStatus,


    applyForTourAsGuide,
    getApplicationsForTourGuide,
    updateApplicationStatus
};
