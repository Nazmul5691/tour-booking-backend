
/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "../../errorHelpers/appError";
import httpStatus from "http-status-codes";
import { Guide, GuideApplication } from "./guide.model";
import { User } from "../user/user.model";
import { APPLICATION_STATUS, GUIDE_STATUS } from "./guide.interface";
import { Tour } from "../tour/tour.model";
import mongoose from "mongoose";
import { QueryBuilder } from "../../utils/queryBuilder";

const registerGuide = async (userId: string, payload: any) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found");
    }

    if (user.guideStatus === GUIDE_STATUS.APPROVED) {
        throw new AppError(httpStatus.BAD_REQUEST, "You are already a verified guide");
    }

    const isGuideExist = await Guide.findOne({ user: userId });
    if (isGuideExist) {
        throw new AppError(httpStatus.BAD_REQUEST, "Guide application already submitted");
    }

    const guide = await Guide.create({
        user: userId,
        ...payload,
        status: GUIDE_STATUS.PENDING,
    });

    // Update user status
    user.guideStatus = GUIDE_STATUS.PENDING;
    await user.save();

    return guide;
};

const getAllGuides = async (query: Record<string, string>, role: string) => {

    // 1. 🛑 Role-Based Access Validation
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to view all guides. Access is restricted to Admin and Super Admin roles."
        );
    }

    // 2. Setup the base query and QueryBuilder
    const baseQuery = Guide.find().populate({
        path: "user",
        select: "-password"
    });

    const queryBuilder = new QueryBuilder(baseQuery, query);

    // 3. Build the query pipeline
    const guidesData = await queryBuilder
        // Assuming guideSearchableFields exists (e.g., ['user.name', 'status'])
        // .search(guideSearchableFields) 
        .sort()
        .filter()
        .fields()
        .paginate();

    // 4. Execute the query and get metadata concurrently
    const [data, meta] = await Promise.all([
        guidesData.build(),
        queryBuilder.getMeta()
    ]);

    return {
        data,
        meta
    };
};

const getSingleGuide = async (id: string) => {
    const guide = await Guide.findById(id).populate({
        path: "user",
        select: "name email guideStatus"
    }).select("experienceYears languages perTourCharge")


    if (!guide) {
        throw new AppError(httpStatus.NOT_FOUND, "Guide not found");
    }

    return guide;
};

const updateGuideStatus = async (guideId: string, status: GUIDE_STATUS, role: string) => {

    // 1. 🛑 Role-Based Access Validation
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to update a guide's status. Access is restricted to Admin and Super Admin roles."
        );
    }

    // 2. Find and Validate Guide Existence
    const guide = await Guide.findById(guideId);

    if (!guide) {
        throw new AppError(httpStatus.NOT_FOUND, "Guide not found");
    }

    // 3. Update Guide Status
    guide.status = status;
    await guide.save();

    // 4. Also update linked User's guideStatus for synchronization
    const user = await User.findById(guide.user);
    if (user) {
        user.guideStatus = status;
        await user.save();
    }

    return guide;
};




const applyForTourAsGuide = async (userId: string, tourId: string, message?: string) => {

    // must be an approved guide record
    const guide = await Guide.findOne({ user: userId });
    if (!guide || guide.status !== "APPROVED") {
        throw new AppError(httpStatus.FORBIDDEN, "Only approved guides can apply for tours");
    }

    // make sure tour exists
    const tourExists = await Tour.exists({ _id: tourId });
    if (!tourExists) throw new AppError(httpStatus.NOT_FOUND, "Tour not found");

    // prevent duplicate application
    const existing = await GuideApplication.findOne({ user: userId, tour: tourId });
    if (existing) throw new AppError(httpStatus.BAD_REQUEST, "You have already applied for this tour");

    // prevent applying if already a guide for that tour
    const alreadyGuide = await Tour.exists({ _id: tourId, guides: userId });
    if (alreadyGuide) throw new AppError(httpStatus.BAD_REQUEST, "You are already a guide for this tour");

    const app = await GuideApplication.create({
        user: userId,
        tour: tourId,
        message,
        status: APPLICATION_STATUS.PENDING
    });

    return app;
};


// const getApplicationsForTourGuide = async (filter: Record<string, any> = {}, role: string) => {

//     // 1. 🛑 Role-Based Access Validation
//     if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
//         throw new AppError(
//             httpStatus.FORBIDDEN,
//             "You are not authorized to view all guide applications. Access is restricted to Admin and Super Admin roles."
//         );
//     }

//     // 2. Proceed with data retrieval
//     const q: any = { ...filter };

//     // Note: If you want to use QueryBuilder here for search/pagination, you should wrap this logic 
//     // in the QueryBuilder pattern, similar to how getAllGuides was implemented.

//     const apps = await GuideApplication.find(q)
//         .populate({ path: "user", select: "name email guideStatus" })
//         .populate({ path: "tour", select: "title slug" })
//         .sort({ createdAt: -1 });

//     return apps;
// };
const getApplicationsForTourGuide = async (query: Record<string, string>, role: string) => {

    // 1. 🛑 Role-Based Access Validation
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to view all guide applications. Access is restricted to Admin and Super Admin roles."
        );
    }

    // 2. Setup the base query and QueryBuilder
    const baseQuery = GuideApplication.find()
        .populate({ path: "user", select: "name email guideStatus" })
        .populate({ path: "tour", select: "title slug" });

    const queryBuilder = new QueryBuilder(baseQuery, query);

    // 3. Build the query pipeline
    const applicationsQuery = queryBuilder
        // Assuming guideApplicationSearchableFields exists for search functionality
        // .search(guideApplicationSearchableFields) 
        .filter() // <-- Handles filtering by any field in the query, including 'status'
        .sort()
        .fields()
        .paginate();

    // 4. Execute the query and get metadata concurrently
    const [data, meta] = await Promise.all([
        applicationsQuery.build(),
        queryBuilder.getMeta()
    ]);
    
    // The results will be automatically filtered if the user passes ?status=APPROVED in the query.

    return {
        data,
        meta
    };
};

const updateApplicationStatus = async (applicationId: string, status: "APPROVED" | "REJECTED", role: string) => {


    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
        throw new AppError(
            httpStatus.FORBIDDEN,
            "You are not authorized to update a guide application's status. Access is restricted to Admin and Super Admin roles."
        );
    }

    // If rejecting → no need for transaction
    if (status === "REJECTED") {
        const app = await GuideApplication.findById(applicationId);
        if (!app) throw new AppError(httpStatus.NOT_FOUND, "Application not found");

        if (app.status === APPLICATION_STATUS.APPROVED) {
            throw new AppError(httpStatus.BAD_REQUEST, "Cannot reject an approved application");
        }

        app.status = APPLICATION_STATUS.REJECTED;
        await app.save();

        return app;
    }

    // ============================
    //  If status === APPROVED
    // ============================

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const app = await GuideApplication.findById(applicationId).session(session);
        if (!app) throw new AppError(httpStatus.NOT_FOUND, "Application not found");

        if (app.status === APPLICATION_STATUS.APPROVED) {
            throw new AppError(httpStatus.BAD_REQUEST, "Already approved");
        }

        // Ensure guide exists & approved
        const guide = await Guide.findOne({ user: app.user }).session(session);
        if (!guide || guide.status !== "APPROVED") {
            throw new AppError(httpStatus.BAD_REQUEST, "User is not an approved guide");
        }

        // Add guide to tour.guides
        await Tour.findByIdAndUpdate(
            app.tour,
            { $addToSet: { guides: app.user } },
            { session }
        );

        // Add availableTours to user
        await User.findByIdAndUpdate(
            app.user,
            {
                $addToSet: { "guideInfo.availableTours": app.tour },
                $set: { guideStatus: "APPROVED" }
            },
            { session }
        );

        // Update application status
        app.status = APPLICATION_STATUS.APPROVED;
        await app.save({ session });

        await session.commitTransaction();
        session.endSession();

        // Return populated response
        return await GuideApplication.findById(applicationId)
            .populate({ path: "user", select: "name email" })
            .populate({ path: "tour", select: "title" });

    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
};




export const GuideService = {
    registerGuide,
    getAllGuides,
    getSingleGuide,
    updateGuideStatus,

    applyForTourAsGuide,
    getApplicationsForTourGuide,
    updateApplicationStatus
};
