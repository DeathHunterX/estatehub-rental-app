import type { AuthenticatedRequest } from "../../types/global";
import { Response } from "express";
import { NotFoundError } from "../../errors/http-error";
import prisma from "../../lib/prisma";

export const getAuthSession = async (res: Response) => {};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.user!;
    const user = await prisma.user.findUnique({
        where: {
            id,
        },
    });

    if (!user) {
        throw new NotFoundError("Not found current user!");
    }

    switch (user.role) {
        case "Tenant": {
            const tenant = await prisma.tenant.findUnique({
                where: { userId: user.id },
                include: {
                    user: true,
                    properties: true,
                    favorites: true,
                    applications: true,
                    leases: true,
                },
            });

            if (!tenant) throw new NotFoundError("Tenant not found!");

            const { userId, ...tenantData } = tenant;
            return res.status(200).json({ success: true, data: tenantData });
        }

        case "Manager": {
            const manager = await prisma.manager.findUnique({
                where: { userId: user.id },
                include: {
                    user: true,
                    managedProperties: true,
                },
            });

            if (!manager) throw new NotFoundError("Manager not found!");

            const { userId, ...managerData } = manager;
            return res.status(200).json({ success: true, data: managerData });
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
