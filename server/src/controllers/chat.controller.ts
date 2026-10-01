import type { UserIdentity, AuthenticatedRequest } from "../types/global";
import { UserRole } from "@prisma/client";
import { Response } from "express";
import { BadRequestError, NotFoundError } from "../errors/http-error";
import prisma from "../lib/prisma";

export const getChats = async (req: AuthenticatedRequest, res: Response) => {
    const tokenUserId = req.user?.id as string;

    const chats = await prisma.chat.findMany({
        where: {
            OR: [{ tenantUserId: tokenUserId }, { managerUserId: tokenUserId }],
        },
        include: {
            lastMessage: true,
            tenant: {
                include: {
                    user: true,
                },
            },
            manager: {
                include: {
                    user: true,
                },
            },
        },
        orderBy: { lastMessageId: "desc" },
    });

    for (const chat of chats) {
        const receiverId =
            chat.tenantUserId === tokenUserId
                ? chat.managerUserId
                : chat.tenantUserId;

        const receiver = await prisma.user.findUnique({
            where: {
                id: receiverId,
            },
            select: {
                id: true,
                name: true,
            },
        });

        // Need to use type assertion since receiver is not part of Chat type
        (chat as any).receiver = receiver;
    }

    return res.status(200).json({
        success: true,
        data: chats,
    });
};

export const getChat = async (req: AuthenticatedRequest, res: Response) => {
    const { role, id } = req.user as UserIdentity;
    const { chatId } = req.params;

    // Scope the lookup to the caller's role and ID before loading message history.
    const chat = await prisma.chat.findUnique({
        where: {
            id: Number(chatId),
            ...(role === UserRole.Tenant
                ? { tenantUserId: id }
                : { managerUserId: id }),
        },
        include: {
            tenant: {
                include: {
                    user: true,
                },
            },
            manager: {
                include: {
                    user: true,
                },
            },
            messages: {
                orderBy: {
                    createdAt: "asc",
                },
            },
        },
    });

    if (!chat) {
        throw new NotFoundError("Chat not found");
    }

    // Add receiverId to the chat object
    const receiverId =
        chat.tenantUserId === id ? chat.managerUserId : chat.tenantUserId;

    const receiver = await prisma.user.findUnique({
        where: {
            id: receiverId,
        },
        select: {
            id: true,
            name: true,
        },
    });

    // Add receiver information to chat object
    (chat as any).receiverId = receiverId;
    (chat as any).receiver = receiver;

    return res.status(200).json({
        success: true,
        data: chat,
    });
};

export const addChat = async (req: AuthenticatedRequest, res: Response) => {
    const { role, id } = req.user as UserIdentity;
    const { receiverId } = req.body;

    const receiver = await prisma.user.findUnique({
        where: {
            id: receiverId,
        },
    });

    if (!receiver) {
        throw new NotFoundError("Receiver not found");
    }

    if (receiver.id === id) {
        throw new BadRequestError("You cannot chat with yourself");
    }

    if (receiver.role === role) {
        throw new BadRequestError("You cannot chat with person of same role");
    }

    const existingChat = await prisma.chat.findFirst({
        where: {
            OR: [
                { tenantUserId: id, managerUserId: receiverId },
                { tenantUserId: receiverId, managerUserId: id },
            ],
        },
    });

    if (existingChat) {
        return res.status(200).json({ success: true, data: existingChat });
    }

    let newChat;

    if (role === UserRole.Tenant) {
        newChat = await prisma.chat.create({
            data: {
                tenantUserId: id,
                managerUserId: receiverId,
            },
        });
    } else {
        newChat = await prisma.chat.create({
            data: {
                tenantUserId: receiverId,
                managerUserId: id,
            },
        });
    }

    return res.status(200).json({
        success: true,
        data: newChat,
    });
};

export const readChat = async (req: AuthenticatedRequest, res: Response) => {
    const { role, id } = req.user as UserIdentity;
    const { chatId } = req.params;

    const chat = await prisma.chat.update({
        where: {
            id: Number(chatId),
            ...(role === UserRole.Tenant
                ? { tenantUserId: id }
                : { managerUserId: id }),
        },
        data: {
            ...(role === UserRole.Tenant
                ? { tenantLastReadAt: new Date() }
                : { managerLastReadAt: new Date() }),
        },
    });

    return res.status(200).json({
        success: true,
        data: chat,
    });
};
