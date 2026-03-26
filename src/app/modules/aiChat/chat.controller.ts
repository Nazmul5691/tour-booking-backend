/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { ChatServices } from "./chat.service";
import httpStatus from "http-status-codes";

const chat = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { messages } = req.body;

    const reply = await ChatServices.chatWithAI(messages);

    sendResponse(res, {
        success: true,
        statusCode: httpStatus.OK,
        message: "AI response retrieved successfully",
        data: { reply },
    });
});

export const ChatControllers = {
    chat,
};