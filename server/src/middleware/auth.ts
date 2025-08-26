import { User } from "@prisma/client";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import handleError from "../lib/error-handler";
import { UnauthorizedError } from "../lib/http-error";
import prisma from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
    user?: User;
}

const authMiddleware = (allowedRoles: string[]) => {
    return async (
        req: AuthenticatedRequest,
        res: Response,
        next: NextFunction
    ) => {
        try {
            let token = req.headers.authorization;

            if (token && token.startsWith("Bearer ")) {
                token = token.split(" ")[1];
                if (!token) {
                    throw new UnauthorizedError("Unauthorized");
                }

                const decoded = jwt.verify(
                    token,
                    process.env.JWT_ACCESS_TOKEN_SECRET!
                ) as { id: string };

                if (!decoded) {
                    throw new UnauthorizedError("Unauthorized");
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
                throw new UnauthorizedError("Unauthorized!");
            }
        } catch (error) {
            return handleError(error, res);
        }

        next();
    };
};

export default authMiddleware;
