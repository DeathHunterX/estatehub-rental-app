import { NextFunction, Request, Response } from "express";
import config from "../config";
import { getErrorMessage } from "../utils/utils";
import { RequestError } from "./http-error";

const formatResponse = (
    statusCode: number,
    message: string,
    stack?: string
) => {
    const responseContent = {
        success: false,
        error: {
            message,
            stack,
        },
    };

    return { ...responseContent, statusCode };
};

const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("app debug: ", config.debug);
    if (error instanceof RequestError) {
        return res
            .status(error.statusCode)
            .json(
                formatResponse(
                    error.statusCode,
                    error.message,
                    config.debug && process.env.NODE_ENV !== "production"
                        ? error.stack
                        : undefined
                )
            );
    }

    // Non-RequestError (unexpected error)
    const err = error as Error;

    return res.status(500).json(
        formatResponse(
            500,
            getErrorMessage(error) ||
                "An unexpected error occurred. Please view logs for more details",

            config.debug && process.env.NODE_ENV !== "production"
                ? err.stack
                : undefined
        )
    );
};

export default errorHandler;
