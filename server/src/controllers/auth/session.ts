import { Response } from "express";
import handleError from "../../lib/error-handler";
import { NotFoundError } from "../../lib/http-error";
import prisma from "../../lib/prisma";
import { AuthenticatedRequest } from "../../middleware/auth";

export const getAuthSession = async (res: Response) => {};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { id } = req.user!;
        const user = await prisma.user.findUnique({
            where: {
                id,
            },
        });

        if (!user) {
            throw new NotFoundError("Not found current user!");
        }

        if (user.role === "Tenant") {
            const tenant = await prisma.tenant.findUnique({
                where: {
                    userId: user.id,
                },
                include: {
                    user: true,
                    properties: true,
                    favorites: true,
                    applications: true,
                    leases: true,
                },
            });

            if (!tenant) {
                throw new NotFoundError("Tenant not found!");
            }

            const { userId, ...tenantData } = tenant;

            return res.status(200).json({
                success: true,
                data: tenantData,
            });
        } else if (user.role === "Manager") {
            const manager = await prisma.manager.findUnique({
                where: {
                    userId: user.id,
                },
                include: {
                    user: true,
                    managedProperties: true,
                },
            });

            if (!manager) {
                throw new NotFoundError("Manager not found!");
            }

            const { userId, ...managerData } = manager;

            return res.status(200).json({
                success: true,
                data: managerData,
            });
        }
    } catch (error) {
        return handleError(error, res);
    }
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
    try {
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
    } catch (error) {
        return handleError(error, res);
    }
};
