import type { UserIdentity, AuthenticatedRequest } from "../types/global";
import { UserRole } from "@prisma/client";
import { Response } from "express";
import { NotFoundError } from "../errors/http-error";
import prisma from "../lib/prisma";

export const addMessage = async (req: AuthenticatedRequest, res: Response) => {
    const { role, id } = req.user as UserIdentity;
    const { chatId } = req.params;
    const { content } = req.body;

    const result = await prisma.$transaction(async (tx) => {
        const chat = await tx.chat.findUnique({
            where: {
                id: Number(chatId),
                ...(role === UserRole.Tenant
                    ? { tenantUserId: id }
                    : { managerUserId: id }),
            },
        });

        if (!chat) {
            throw new NotFoundError("Chat not found");
        }

        const message = await tx.message.create({
            data: {
                chatId: Number(chatId),
                content: content,
                senderId: id,
            },
        });

        await tx.chat.update({
            where: {
                id: Number(chatId),
            },
            data: {
                ...(role === UserRole.Tenant
                    ? { tenantLastReadAt: new Date() }
                    : { managerLastReadAt: new Date() }),
                lastMessageId: message.id,
            },
        });

        return message;
    });

    return res.status(200).json({
        success: true,
        data: result,
    });
};
