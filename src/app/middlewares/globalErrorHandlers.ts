/* eslint-disable no-console */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { NextFunction, Request, Response } from "express"
import { envVars } from "../config/env"
import AppError from "../errorHelpers/appError";
import { handleDuplicateError } from "../helpers/handleDuplicateError";
import { handleCastError } from "../helpers/handleCastError";
import { handleZodError } from "../helpers/handleZodError";
import { handleValidationError } from "../helpers/handleValidationError";
import { TErrorSources } from "../interfaces/error.types";
import { deleteImageFromCLoudinary } from "../config/cloudinary.config";


/* eslint-disable @typescript-eslint/no-explicit-any */
export const globalErrorHandler =async (error: any, req: Request, res: Response, next: NextFunction) => {

    if(envVars.NODE_ENV === 'development'){
        console.log(error);
    }

    console.log({ file: req.files });
    if (req.file) {
        await deleteImageFromCLoudinary(req.file.path)
    }

    if (req.files && Array.isArray(req.files) && req.files.length) {
        const imageUrls = (req.files as Express.Multer.File[]).map(file => file.path)

        await Promise.all(imageUrls.map(url => deleteImageFromCLoudinary(url)))
    }

    let errorSources: TErrorSources[] = []

    let statusCode = 500;
    let message = 'Something Went Wrong!!'


    //duplicate error
    if (error.code === 11000) {
        const simplifiedError = handleDuplicateError(error);

        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
    }

    //cast error
    else if (error.name === "CastError") {
        const simplifiedError = handleCastError(error);

        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message
    }

    //zod error
    else if (error.name === "ZodError") {
        const simplifiedError = handleZodError(error);

        statusCode = simplifiedError.statusCode;
        message = simplifiedError.message;
        errorSources = simplifiedError.errorSources as TErrorSources[];
    }

    //mongoose validation error
    else if (error.name === "ValidationError") {
        const simplifiedError = handleValidationError(error);

        statusCode = simplifiedError.statusCode;
        errorSources = simplifiedError.errorSources as TErrorSources[];
        message = simplifiedError.message;

    }

    else if (error instanceof AppError) {
        statusCode = error.statusCode
        message = error.message
    }
    else if (error instanceof Error) {
        statusCode = 500
        message = error.message
    }

    res.status(statusCode).json({
        success: false,
        message,
        errorSources,
        error: envVars.NODE_ENV === 'development' ? error : null,
        stack: envVars.NODE_ENV === 'development' ? error.stack : null
    })
}