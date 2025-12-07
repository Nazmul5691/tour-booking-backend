/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express";
import httpStatus from 'http-status-codes'
import { UserServices } from "./user.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { verifyToken } from "../../utils/jwt";
import { envVars } from "../../config/env";
import { JwtPayload } from "jsonwebtoken";




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


export const UserControllers = {
    createUser,
    createAdmin,
    getAllUsers,
    getMe,
    getSingleUser,
    updateUser
    
}