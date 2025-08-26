import { Request, Response } from "express";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import handleError from "../../lib/error-handler";
import { NotFoundError, UnauthorizedError } from "../../lib/http-error";
import prisma from "../../lib/prisma";
import { generateAccessToken } from "../../utils/jwt";

const getAccessToken = async (req: Request, res: Response) => {
    try {
        const rfToken = req.cookies.refreshToken;
        if (!rfToken) {
            return res.status(401).json({
                success: false,
                error: {
                    message: "Unauthorized",
                    details: "Please login to continue",
                },
            });
        }

        jwt.verify(
            rfToken,
            process.env.JWT_REFRESH_TOKEN_SECRET!,
            (
                err: VerifyErrors | null,
                decoded: string | JwtPayload | undefined
            ) => {
                handleVerify(err, decoded, res);
            }
        );
    } catch (error) {
        return handleError(error, res);
    }
};

async function handleVerify(
    err: VerifyErrors | null,
    decoded: string | JwtPayload | undefined,
    res: Response
) {
    if (err || !decoded || typeof decoded === "string") {
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

    res.json({
        success: true,
        data: {
            accessToken,
            user,
        },
    });
}

export default getAccessToken;
