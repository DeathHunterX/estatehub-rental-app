import jwt, { JwtPayload } from "jsonwebtoken";

export const accessTokenExpiry = 1000 * 60 * 60 * 24 * 7; // 7 days
export const refreshTokenExpiry = 1000 * 60 * 60 * 24 * 30; // 30 days

export const generateAccessToken = (payload: JwtPayload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET!, {
        expiresIn: accessTokenExpiry,
    });
};

export const generateRefreshToken = (payload: JwtPayload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET!, {
        expiresIn: refreshTokenExpiry,
    });
};
