import { Response } from "express";
import { RequestError } from "./http-error";

const formatResponse = (
    statusCode: number,
    message: string,
    errors?: Record<string, string[]> | undefined
) => {
    const responseContent = {
        success: false,
        error: {
            message,
            details: errors,
        },
    };

    return { ...responseContent, statusCode };
};

const handleError = (error: unknown, res: Response) => {
    if (error instanceof RequestError) {
        return res
            .status(error.statusCode)
            .json(
                formatResponse(error.statusCode, error.message, error.errors)
            );
    }

    // TODO: Handle validation errors

    if (error instanceof Error) {
        return res.status(500).json(formatResponse(500, error.message));
    }

    return res
        .status(500)
        .json(formatResponse(500, "An unexpected error occurred"));
};

export default handleError;
