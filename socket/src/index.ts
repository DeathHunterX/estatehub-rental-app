import { Server } from "socket.io";
import config from "./config";

const io = new Server({
    cors: {
        origin: config.clientUrl!,
    },
});

interface User {
    userId: string;
    socketId: string;
}

let onlineUser: User[] = [];

const addUser = (userId: string, socketId: string) => {
    const userExits = onlineUser.find((user) => user.userId === userId);
    if (!userExits) {
        onlineUser.push({ userId, socketId });
    }
};

const removeUser = (socketId: string) => {
    onlineUser = onlineUser.filter((user) => user.socketId !== socketId);
};

const getUser = (userId: string) => {
    return onlineUser.find((user) => user.userId === userId) as User;
};

io.on("connection", (socket) => {
    socket.on("newUser", (userId: string) => {
        addUser(userId, socket.id);
    });

    socket.on("join-chat", (chatId: number) => {
        socket.join(`chat-${chatId}`);
    });

    socket.on(
        "sendMessage",
        ({ receiverId, data }: { receiverId: string; data: any }) => {
            // Send to specific user
            const receiver = getUser(receiverId);
            if (receiver) {
                io.to(receiver.socketId).emit("getMessage", data);
            }

            // Also broadcast to chat room
            if (data.chatId) {
                io.to(`chat-${data.chatId}`).emit("getMessage", data);
            }
        }
    );

    socket.on("disconnect", () => {
        removeUser(socket.id);
    });
});

io.listen(config.socketPort!);
console.log("Socket server is running on port:", config.socketPort);
