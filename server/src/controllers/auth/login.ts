import bcryptjs from "bcryptjs";
import { Request, Response } from "express";

import { BadRequestError, NotFoundError } from "../../errors/http-error";
import prisma from "../../lib/prisma";
import {
    generateAccessToken,
    generateRefreshToken,
    refreshTokenExpiry,
} from "../../utils/jwt";

const login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: {
            email,
        },
        include: {
            accounts: true,
        },
    });

    if (!existingUser) {
        throw new NotFoundError("User not found");
    }

    const account = existingUser.accounts[0];
    if (!account || !account.passwordHash) {
        throw new BadRequestError("Invalid credentials");
    }

    const isPasswordValid = await bcryptjs.compare(
        password,
        account.passwordHash
    );

    if (!isPasswordValid) {
        throw new BadRequestError("Password is incorrect");
    }

    // Generate tokens
    const accessToken = generateAccessToken({
        id: existingUser.id,
        role: existingUser.role,
    });

    const refreshToken = generateRefreshToken({
        id: existingUser.id,
        role: existingUser.role,
    });

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: refreshTokenExpiry,
    });

    const { accounts, ...user } = existingUser;

    return res.status(200).json({
        success: true,
        data: {
            message: "Login successful",
            accessToken,
            user,
        },
    });
};

export default login;
