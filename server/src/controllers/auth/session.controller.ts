import type { AuthenticatedRequest } from "../../types/global";
import { Response } from "express";
import { NotFoundError } from "../../errors/http-error";
import prisma from "../../lib/prisma";

export const getAuthSession = async (res: Response) => {};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;

    switch (user.role) {
        case "Tenant": {
            const tenant = await prisma.tenant.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!tenant) throw new NotFoundError("Tenant not found!");

            return res.status(200).json({ success: true, data: { id: tenant.id, user } });
        }

        case "Manager": {
            const manager = await prisma.manager.findUnique({
                where: { userId: user.id },
                select: { id: true },
            });

            if (!manager) throw new NotFoundError("Manager not found!");

            return res.status(200).json({ success: true, data: { id: manager.id, user } });
        }

        default:
            throw new Error(`Unsupported user role: ${user.role}`);
    }
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.user!;

    const { name, email, phoneNumber } = req.body;

    const updatedUser = await prisma.user.update({
        where: { id },
        data: { name, email, phoneNumber },
    });

    return res.status(200).json({
        success: true,
        data: updatedUser,
    });
};
