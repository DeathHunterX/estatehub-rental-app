import type { AuthenticatedRequest } from "../types/global";
import { Response } from "express";
import prisma from "../lib/prisma";

export const listNotifications = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const userId = req.user!.id;
    const [data, unreadCount] = await Promise.all([
        prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 30,
        }),
        prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    return res.json({ success: true, data, unreadCount });
};

export const markNotificationRead = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const updated = await prisma.notification.updateMany({
        where: { id, userId: req.user!.id, readAt: null },
        data: { readAt: new Date() },
    });
    return res.json({ success: true, data: updated });
};

export const markAllNotificationsRead = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const updated = await prisma.notification.updateMany({
        where: { userId: req.user!.id, readAt: null },
        data: { readAt: new Date() },
    });
    return res.json({ success: true, data: updated });
};
