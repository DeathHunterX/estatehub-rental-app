import type { AuthenticatedRequest, AccessTokenPayload } from "../types/global";

import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UnauthorizedError } from "../errors/http-error";
import prisma from "../lib/prisma";

const authMiddleware = (allowedRoles: string[]) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        let token = req.headers.authorization;

        if (token && token.startsWith("Bearer ")) {
            token = token.split(" ")[1];
            if (!token) {
                throw new UnauthorizedError(
                    "Unauthorized! Please login to continue"
                );
            }

            const decoded = jwt.verify(
                token,
                process.env.JWT_ACCESS_TOKEN_SECRET!
            ) as AccessTokenPayload;

            if (!decoded) {
                throw new UnauthorizedError(
                    "Unauthorized! Please login to continue"
                );
            }

            const hasExpired = decoded.exp && decoded.exp < Date.now() / 1000;
            if (hasExpired) {
                throw new UnauthorizedError("Unauthorized! Token expired");
            }

            const user = await prisma.user.findUnique({
                where: {
                    id: decoded.id,
                },
            });

            req.user = user ?? undefined;

            const hasAccess = allowedRoles.includes(
                user?.role.toLowerCase() ?? ""
            );

            if (!hasAccess) {
                throw new UnauthorizedError(
                    "Unauthorized! You don't have access to this resource"
                );
            }
        } else {
            throw new UnauthorizedError(
                "Unauthorized! Please login to continue"
            );
        }

        next();
    };
};

export default authMiddleware;
