import jwt, { JwtPayload } from "jsonwebtoken";

export const accessTokenExpirySeconds = 15 * 60;
export const refreshTokenExpirySeconds = 30 * 24 * 60 * 60;
export const refreshCookieMaxAgeMs = refreshTokenExpirySeconds * 1000;

export const generateAccessToken = (payload: JwtPayload) => {
    return jwt.sign(payload, process.env.JWT_ACCESS_TOKEN_SECRET!, {
        expiresIn: accessTokenExpirySeconds,
    });
};

export const generateRefreshToken = (payload: JwtPayload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_TOKEN_SECRET!, {
        expiresIn: refreshTokenExpirySeconds,
    });
};
