import { BadRequestError } from "../errors/http-error";

export function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message;

    if (error && typeof error === "object" && "message" in error) {
        return String(error.message);
    }

    if (typeof error === "string") return error;

    return "An error occurred";
}
export function csvCell(value: unknown): string {
    const raw = value == null ? "" : String(value);
    const safe = /^[\s]*[=+\-@]/u.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
}

export function parseIntegerId(value: unknown, errorMessage: string, requirePositive = false): number {
    const id = Number(value);
    if (!Number.isInteger(id) || (requirePositive && id <= 0)) {
        throw new BadRequestError(errorMessage);
    }
    return id;
}
