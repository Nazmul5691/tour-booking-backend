import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import AppError from "../errorHelpers/appError";
import { verifyToken } from "../utils/jwt";
import { envVars } from "../config/env";
import { User } from "../modules/user/user.model";
import { IsActive } from "../modules/user/user.interface";
import httpStatus from 'http-status-codes';



export const checkAuth = (...authRoles: string[]) => async (req: Request, res: Response, next: NextFunction) => {

    try {
        const accessToken = req.headers.authorization || req.cookies.accessToken;

        if (!accessToken) {
            throw new AppError(403, "No token received");
        }

        const verifiedToken = verifyToken(accessToken, envVars.JWT_ACCESS_SECRET) as JwtPayload


        // if((verifiedToken as JwtPayload).role !== Role.ADMIN || Role.SUPER_ADMIN){
        // if ((verifiedToken as JwtPayload).role !== Role.ADMIN) {

        // authRoles = ["ADMIN", "SUPER_ADMIN"].includes("ADMIN")

        const isUserExit = await User.findOne({ email: verifiedToken.email });

        if (!isUserExit) {
            throw new AppError(httpStatus.BAD_REQUEST, "User does not exist")
        }
        if (!isUserExit.isVerified) {
            throw new AppError(httpStatus.BAD_REQUEST, "User is not verified")
        }
        if (isUserExit.isActive === IsActive.BLOCKED || isUserExit.isActive === IsActive.INACTIVE) {
            throw new AppError(httpStatus.BAD_REQUEST, `User is ${isUserExit.isActive}`)
        }
        if (isUserExit.isDeleted) {
            throw new AppError(httpStatus.BAD_REQUEST, "User is deleted")
        }


        if (!authRoles.includes(verifiedToken.role)) {
            throw new AppError(403, "You are not permitted to view this route!!!");
        }

        // console.log('token', verifiedToken);
        req.user = verifiedToken;
        next()

    } catch (error) {
        next(error)
    }

}