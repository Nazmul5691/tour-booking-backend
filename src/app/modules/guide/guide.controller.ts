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

const getAllGuides = catchAsync(async (req: Request, res: Response) => {
    const result = await GuideService.getAllGuides();

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "All guides retrieved",
        data: result
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
    const guideId = req.params.id;
    const { status } = req.body;
    const result = await GuideService.updateGuideStatus(guideId, status);

    sendResponse(res, {
        success: true,
        statusCode: 200,
        message: "Guide status updated successfully",
        data: result
    });
});




//applications for tours as guide
const apply = catchAsync(async (req: Request, res: Response) => {
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

const list = catchAsync(async (req: Request, res: Response) => {
    // allow admin to filter by status/tour/user via query
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.tour) filter.tour = req.query.tour;
    if (req.query.user) filter.user = req.query.user;

    const result = await GuideService.getApplications(filter);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Applications retrieved",
        data: result
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

    const result = await GuideService.updateApplicationStatus(
        applicationId,
        status
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


    apply,
    list,
    updateApplicationStatus
};
