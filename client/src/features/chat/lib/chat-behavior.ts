type ChatParticipant = { user: { id: string; name: string } };
type ChatDetails = {
    tenantUserId: string;
    managerUserId: string;
    tenant: ChatParticipant;
    manager: ChatParticipant;
    createdAt: string | Date;
    lastMessage?: { createdAt: string | Date } | null;
};

export const chatPartner = (chat: ChatDetails, currentUserId: string) => {
    const user = chat.tenantUserId === currentUserId
        ? chat.manager.user
        : chat.tenant.user;
    return { id: user.id, name: user.name };
};

export const chatActivityTime = (chat: ChatDetails) =>
    chat.lastMessage?.createdAt ?? chat.createdAt;
