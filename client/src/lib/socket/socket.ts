import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
let socketToken: string | null = null;

export const createSocket = (accessToken: string): Socket => {
    if (socket && socketToken !== accessToken) disconnectSocket();
    if (!socket) {
        socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
            auth: { token: accessToken },
        });
        socketToken = accessToken;
    }
    return socket;
};

export const getSocket = (): Socket | null => {
    return socket;
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
    socketToken = null;
};
