export class RequestError extends Error {
    statusCode: number;
    errors?: Record<string, string[]>;

    constructor(
        statusCode: number,
        message: string,
        errors?: Record<string, string[]>
    ) {
        super(message);
        this.statusCode = statusCode;
        this.errors = errors;
        this.name = "RequestError";
    }
}

export class ValidationError extends RequestError {
    constructor(fieldErrors: Record<string, string[]>) {
        const message = ValidationError.formatFieldErrors(fieldErrors);
        super(400, message, fieldErrors);
        this.name = "ValidationError";
        this.errors = fieldErrors;
    }

    private static formatFieldErrors(fieldErrors: Record<string, string[]>) {
        const formattedMessages = Object.entries(fieldErrors).map(
            ([field, messages]) => {
                const fieldName =
                    field.charAt(0).toUpperCase() + field.slice(1);

                if (messages[0] === "Required") {
                    return `${fieldName} is required`;
                } else {
                    return messages.join(" and ");
                }
            }
        );

        return formattedMessages.join(", ");
    }
}

export class UnauthorizedError extends RequestError {
    constructor(message: string = "Unauthorized Error") {
        super(401, message);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends RequestError {
    constructor(message: string = "Forbidden Error") {
        super(403, message);
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends RequestError {
    constructor(message: string = "Not Found Error") {
        super(404, message);
        this.name = "NotFoundError";
    }
}

export class BadRequestError extends RequestError {
    constructor(message: string = "Bad Request Error") {
        super(400, message);
        this.name = "BadRequestError";
    }
}

export class ConflictError extends RequestError {
    constructor(message: string = "Conflict Error") {
        super(409, message);
        this.name = "ConflictError";
    }
}

export class InternalServerError extends RequestError {
    constructor(message: string = "Internal Server Error") {
        super(500, message);
        this.name = "InternalServerError";
    }
}
