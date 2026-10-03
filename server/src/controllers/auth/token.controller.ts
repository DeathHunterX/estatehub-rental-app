import { Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
    ForbiddenError,
    NotFoundError,
    UnauthorizedError,
} from "../../errors/http-error";
import config from "../../config";
import prisma from "../../lib/prisma";
import { generateAccessToken } from "../../utils/jwt";

const isTrustedRefreshRequest = (req: Request): boolean => {
    let expectedOrigin: string;
    try {
        expectedOrigin = new URL(config.clientUrl).origin;
    } catch {
        return false;
    }

    const origin = req.get("origin");
    if (origin) return origin === expectedOrigin;

    const referer = req.get("referer");
    if (!referer) return false;
    try {
        return new URL(referer).origin === expectedOrigin;
    } catch {
        return false;
    }
};

const getAccessToken = async (req: Request, res: Response) => {
    if (!isTrustedRefreshRequest(req)) {
        throw new ForbiddenError("Refresh request origin is not allowed");
    }

    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
        throw new UnauthorizedError("Unauthorized! Please login to continue");
    }

    let decoded: string | JwtPayload;
    try {
        decoded = jwt.verify(
            refreshToken,
            process.env.JWT_REFRESH_TOKEN_SECRET!
        );
    } catch {
        throw new UnauthorizedError("Unauthorized! Please login to continue");
    }
    if (typeof decoded === "string" || typeof decoded.id !== "string") {
        throw new UnauthorizedError("Unauthorized! Please login to continue");
    }

    const user = await prisma.user.findUnique({
        where: {
            id: decoded.id,
        },
    });
    if (!user) {
        throw new NotFoundError("User not found!");
    }

    const accessToken = generateAccessToken({
        id: decoded.id,
        role: decoded.role,
    });

    return res.json({ success: true, data: { accessToken, user } });
};

export default getAccessToken;
