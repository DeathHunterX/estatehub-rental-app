import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { BadRequestError } from "../../errors/http-error";
import prisma from "../../lib/prisma";

const register = async (req: Request, res: Response) => {
    const { username, email, password, confirmPassword, role } = req.body;

    const existingUser = await prisma.user.findUnique({
        where: {
            email: email,
        },
    });

    if (existingUser) {
        throw new BadRequestError(
            "User already exists, Please login or use a different email"
        );
    }

    if (password !== confirmPassword) {
        throw new BadRequestError("Passwords do not match");
    }

    const hashedPassword = await bcryptjs.hash(password, 10);

    const newUser = await prisma.user.create({
        data: {
            name: username,
            email,
            role,
            createdAt: new Date(),
        },
    });

    if (newUser) {
        await prisma.account.create({
            data: {
                userId: newUser.id,
                provider: "Credentials",
                providerAccountId: email,
                passwordHash: hashedPassword,
                accessToken: null,
                refreshToken: null,
                accessTokenExpiresAt: null,
                refreshTokenExpiresAt: null,
            },
        });
    }

    if (role === "Tenant") {
        await prisma.tenant.create({
            data: {
                userId: newUser.id,
            },
        });
    } else if (role === "Manager") {
        await prisma.manager.create({
            data: {
                userId: newUser.id,
            },
        });
    } else {
        throw new BadRequestError("Invalid role");
    }

    return res.status(201).json({
        success: true,
        data: {
            message:
                "User registered successfully, Please login to access your account",
        },
    });
};

export default register;
