import { Request, Response } from "express";

const logout = async (req: Request, res: Response) => {
    try {
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
    } catch (error) {
        return res.status(500).json({
            success: false,
            error: {
                message: "Internal server error",
                details:
                    error instanceof Error ? error.message : "Unknown error",
            },
        });
    }
};

export default logout;
