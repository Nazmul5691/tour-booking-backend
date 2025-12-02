/* eslint-disable @typescript-eslint/no-explicit-any */
import { TGenericErrorResponse } from "../interfaces/error.types";

 export const handleDuplicateError = (error: any): TGenericErrorResponse => {
    const matchedArray = error.message.match(/"([^"]*)"/);

    return {
        statusCode: 400,
        message: `${matchedArray[1]} already exists`
    }
}