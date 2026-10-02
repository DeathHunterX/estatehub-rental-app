import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { BadRequestError } from "../../errors/http-error";
import prisma from "../../lib/prisma";

const register = async (req: Request, res: Response) => {
    const { username, email, password, confirmPassword, role } = req.body;

    if (role !== "Tenant" && role !== "Manager") {
        throw new BadRequestError("Invalid role");
    }

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

    await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
            data: {
                name: username,
                email,
                role,
                createdAt: new Date(),
            },
        });

        await tx.account.create({
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

        switch (role) {
            case "Tenant":
                await tx.tenant.create({
                    data: {
                        userId: newUser.id,
                    },
                });
                break;
            case "Manager":
                await tx.manager.create({
                    data: {
                        userId: newUser.id,
                    },
                });
                break;
        }
    });

    return res.status(201).json({
        success: true,
        data: {
            message:
                "User registered successfully, Please login to access your account",
        },
    });
};

export default register;
