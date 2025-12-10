/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";
import httpStatus from 'http-status-codes'
import { deleteAdminService, updateUserStatusService, UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../../errorHelpers/appError";




// const createUserFunction = async (req: Request, res: Response) =>{
//     const user = await UserServices.createUser(req.body);

//         res.status(httpStatus.CREATED).json({
//             message: 'User successfully created',
//             user
//         })
// }


// const createUser = async (req: Request, res: Response, next: NextFunction) =>{
//     try {
//         const user = await UserServices.createUser(req.body);

//         res.status(httpStatus.CREATED).json({
//             message: 'User successfully created',
//             user
//         })

//     } catch (error:any) {
//         console.log(error);
//         next(error)
//     }
// }



const createUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const user = await UserServices.createUser(req.body);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: 'User successfully created',
        data: user
    })
})


const createAdmin = catchAsync(async (req: Request, res: Response) => {

    const result = await UserServices.createAdmin(req.body);
    sendResponse(res, {
        statusCode: httpStatus.OK,
        success: true,
        message: "Admin Created successfully!",
        data: result
    })
});


const updateUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const userId = req.params.id;
    // const token = req.headers.authorization;
    // const verifiedToken = verifyToken(token as string, envVars.JWT_ACCESS_SECRET) as JwtPayload;
    const verifiedToken = req.user;

    const payload = req.body;

    const user = await UserServices.updateUser(userId, payload, verifiedToken as JwtPayload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: 'User updated successfully',
        data: user
    })
})



// const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

//     const result = await UserServices.getAllUsers();

//     sendResponse(res, {
//         success: true,
//         statusCode: httpStatus.CREATED,
//         message: 'All users retrieved successfully',
//         data: result.data,
//         meta: result.meta,
//     })
// })

const getAllUsers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const query = req.query
    const result = await UserServices.getAllUsers(query as Record<string, string>);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "All users retrieved",
        data: result.data,
        meta: result.meta,
    });
})


const getMe = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const decodedToken = req.user as JwtPayload

    const result = await UserServices.getMe(decodedToken.userId);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: "Your profile retrieved successfully",
        data: result.data,
    });
})


const getSingleUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.getSingleUser(id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Retrieved Successfully",
        data: result.data
    })
})


const deleteUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await UserServices.deleteUser(id);
    sendResponse(res, {
        success: true,
        statusCode: httpStatus.CREATED,
        message: "User Deleted Successfully",
        data: null
    })
})


export const deleteAdmin = catchAsync(async (req: Request, res: Response) => {
    const id = req.params.id;
    const decodedToken = req.user;

    if (!decodedToken) {
        throw new AppError(httpStatus.UNAUTHORIZED, "You are not authorized");
    }

    await deleteAdminService(id, decodedToken);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Admin deleted successfully",
        data: null,
    });
});


export const updateUserStatus = catchAsync(
    async (req: Request, res: Response) => {
        const userId = req.params.id;
        const { isActive } = req.body;

        const decodedToken = req.user; // set by checkAuth middleware

        if (!decodedToken) {
            return sendResponse(res, {
                success: false,
                statusCode: httpStatus.UNAUTHORIZED,
                message: "Unauthorized: token not found",
                data: undefined
            });
        }

        // Now TypeScript knows decodedToken exists
        const updatedUser = await updateUserStatusService(
            userId,
            isActive,
            decodedToken as JwtPayload
        );

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: `User status updated successfully`,
            data: updatedUser,
        });
    }
);


export const UserControllers = {
    createUser,
    createAdmin,
    getAllUsers,
    getMe,
    getSingleUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    deleteAdmin

}