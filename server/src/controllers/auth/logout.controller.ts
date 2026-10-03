import { Request, Response } from "express";

const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    res.clearCookie("refreshToken", {
        path: "/api/auth/refresh-token",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });
    res.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(200).json({
        success: true,
        data: {
            message: refreshToken
                ? "Logged out successfully"
                : "You are already logged out",
        },
    });
};

export default logout;
