import { Server } from "socket.io";
import config from "./config";
import { verifyAccessToken } from "./utils/auth";

if (!config.accessTokenSecret) {
    throw new Error("JWT_ACCESS_TOKEN_SECRET is required for the socket server");
}

const io = new Server({
    cors: {
        origin: config.clientUrl!,
    },
});

io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    const claims = verifyAccessToken(token, config.accessTokenSecret!);
    if (!claims) return next(new Error("Unauthorized"));
    socket.data.userId = claims.id;
    socket.data.accessToken = token;
    socket.data.expiresAt = claims.exp;
    next();
});

io.on("connection", (socket) => {
    socket.join(`user-${socket.data.userId}`);
    let expiryTimer: ReturnType<typeof setTimeout>;
    // Re-arm long timers because JavaScript timeouts cannot represent the full JWT lifetime.
    const scheduleExpiry = () => {
        const remaining = socket.data.expiresAt * 1000 - Date.now();
        if (remaining <= 0) return socket.disconnect(true);
        expiryTimer = setTimeout(scheduleExpiry, Math.min(remaining, 2_147_483_647));
    };
    scheduleExpiry();
    socket.on("disconnect", () => clearTimeout(expiryTimer));
    const authorizedChats = new Map<number, string>();
    const pendingChatChecks = new Map<number, Promise<string | null>>();
    // Check chat membership through the API before relaying events, then cache it per socket.
    const canNotify = async (chatId: number, receiverId: string) => {
        if (authorizedChats.get(chatId) === receiverId) return true;
        let pending = pendingChatChecks.get(chatId);
        if (!pending) {
            pending = (async () => {
                try {
                    const response = await fetch(`${config.apiBaseUrl}/chats/${chatId}/receiver`, {
                        headers: { Authorization: `Bearer ${socket.data.accessToken}` },
                        signal: AbortSignal.timeout(3000),
                    });
                    if (!response.ok) return null;
                    const body = await response.json() as { data?: { receiverId?: string } };
                    return body.data?.receiverId ?? null;
                } catch {
                    return null;
                }
            })().finally(() => pendingChatChecks.delete(chatId));
            pendingChatChecks.set(chatId, pending);
        }
        const authorizedReceiver = await pending;
        if (authorizedReceiver === receiverId) {
            authorizedChats.set(chatId, receiverId);
            return true;
        }
        return false;
    };

    socket.on(
        "sendMessage",
        async (payload: { receiverId: string; chatId: number } | null) => {
            if (!payload || typeof payload !== "object") return;
            const { receiverId, chatId } = payload;
            if (typeof receiverId !== "string" || !Number.isInteger(chatId) || chatId <= 0) return;
            if (!(await canNotify(chatId, receiverId))) return;
            // Only notify clients to refetch through the authorized HTTP API.
            io.to(`user-${receiverId}`).emit("getMessage", { chatId });
        }
    );

    socket.on("typing", async (payload: {
        receiverId: string;
        chatId: number;
        isTyping: boolean;
    } | null) => {
        if (!payload || typeof payload !== "object") return;
        const { receiverId, chatId, isTyping } = payload;
        if (typeof receiverId !== "string" || !Number.isInteger(chatId) || chatId <= 0 || typeof isTyping !== "boolean") return;
        if (!(await canNotify(chatId, receiverId))) return;
        io.to(`user-${receiverId}`).emit("typing", { chatId, isTyping });
    });
});

io.listen(config.socketPort!);
console.log("Socket server is running on port:", config.socketPort);
