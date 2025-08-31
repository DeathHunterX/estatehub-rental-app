import { Request, Response } from "express";

const logout = async (req: Request, res: Response) => {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
        return res.status(200).json({
            success: true,
            data: { message: "You are already logged out" },
        });
    }

    res.clearCookie("refreshToken", {
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    return res.status(200).json({
        success: true,
        data: { message: "Logged out successfully" },
    });
};

export default logout;
