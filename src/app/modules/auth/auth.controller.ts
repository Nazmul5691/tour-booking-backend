/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextFunction, Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import httpStatus from 'http-status-codes';
import { sendResponse } from "../../utils/sendResponse";
import { AuthServices } from "./auth.service";
import AppError from "../../errorHelpers/appError";
import { setAuthCookie } from "../../utils/setCookie";
import { JwtPayload } from "jsonwebtoken";
import { createUserTokens } from "../../utils/userTokens";
import { envVars } from "../../config/env";
import passport from "passport";


const credentialsLogin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    // const loginInfo = await AuthServices.credentialsLogin(req.body);

    passport.authenticate("local", async (err: any, user: any, info: any) => {

        if (err) {

            //  don't use those
            /**
             * throw new AppError(401, "some error")
               next(err)
               return new AppError(401, err)
               return next(err)
             */


            //    use those
            //    return next(err)
            // return next(new AppError(401, err))
            return next(new AppError(err.statusCode || 401, err))
            // return next(new AppError(401, err.message))
        }

        if (!user) {
            return next(new AppError(401, info.message))
        }

        const userTokens = await createUserTokens(user);

        delete user.toObject().password;

        const { password: pass, ...rest } = user.toObject();

        setAuthCookie(res, userTokens);

        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: 'User logged in successfully',
            data: {
                accessToken: userTokens.accessToken,
                refreshToken: userTokens.refreshToken,
                user: rest
            }
        })

    })(req, res, next)

    // res.cookie("accessToken", loginInfo.accessToken, {
    //     httpOnly: true,
    //     secure: false
    // })

    // res.cookie("refreshToken", loginInfo.refreshToken, {
    //     httpOnly: true,
    //     secure: false
    // });

    // setAuthCookie(res, loginInfo);

    // sendResponse(res, {
    //     success: true,
    //     statusCode: httpStatus.OK,
    //     message: 'User logged in successfully',
    //     data: loginInfo
    // })
})


const getNewAccessToken = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
        throw new AppError(httpStatus.BAD_REQUEST, "No refresh token received frm cookies")
    }

    const tokenInfo = await AuthServices.getNewAccessToken(refreshToken as string)

    // res.cookie("accessToken", tokenInfo.accessToken, {
    //     httpOnly: true,
    //     secure: false
    // })

    setAuthCookie(res, tokenInfo);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'New access token retrieved successfully',
        data: tokenInfo
    })
})


const logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    res.clearCookie("accessToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    })

    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: false,
        sameSite: "lax"
    })

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'User logged out successfully',
        data: null
    })
})



const changePassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const newPassword = req.body.newPassword;
    const oldPassword = req.body.oldPassword;
    const decodedToken = req.user

    await AuthServices.changePassword(oldPassword, newPassword, decodedToken as JwtPayload);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "Password Changed Successfully",
        data: null,
    })
})


const setPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {


    const decodedToken = req.user as JwtPayload;
    const { password } = req.body;

    await AuthServices.setPassword(decodedToken.userId, password)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Password changed successfully',
        data: null
    })
})


const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    const { email } = req.body;

    await AuthServices.forgotPassword(email)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Email sent successfully',
        data: null
    })
})


const forgotPasswordReset = catchAsync(
    async (req: Request, res: Response, next: NextFunction) => {
        // ✅ Parse body properly (for Next.js/Edge runtime or Express)
        const body = req.body as any; // If Express with JSON parser, this is fine
        const { id, token, newPassword, confirmPassword } = body;

        // 1️⃣ Basic validation
        if (!id || !token || !newPassword || !confirmPassword) {
            throw new AppError(httpStatus.BAD_REQUEST, "All fields are required");
        }

        if (newPassword !== confirmPassword) {
            throw new AppError(httpStatus.BAD_REQUEST, "Passwords do not match");
        }

        // 2️⃣ Call AuthService to reset password
        await AuthServices.forgotPasswordReset({ id, token, newPassword });

        // 3️⃣ Send success response
        sendResponse(res, {
            success: true,
            statusCode: httpStatus.OK,
            message: "Password reset successfully",
            data: null,
        });
    }
);



const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    // const { newPassword, id } = req.body
    const decodedToken = req.user

    await AuthServices.resetPassword(req.body, decodedToken as JwtPayload)

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: 'Password changed successfully',
        data: null
    })
})



const googleCallbackController = catchAsync(async (req: Request, res: Response, next: NextFunction) => {

    let redirectTo = req.query.state ? req.query.state as string : ""

    if (redirectTo.startsWith("/")) {
        redirectTo = redirectTo.slice(1)            //      /booking => booking , "/" => ""
    }

    const user = req.user;

    console.log("user", user);

    if (!user) {
        throw new AppError(httpStatus.NOT_FOUND, "User not found")
    }

    const tokenInfo = createUserTokens(user);

    setAuthCookie(res, tokenInfo);

    res.redirect(`${envVars.FRONTEND_URL}/${redirectTo}`)
})






export const AuthControllers = {
    credentialsLogin,
    getNewAccessToken,
    logout,
    changePassword,
    resetPassword,
    setPassword,
    forgotPassword,
    googleCallbackController,
    forgotPasswordReset
}