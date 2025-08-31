import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const createSocket = (): Socket => {
    if (!socket) {
        socket = io("http://localhost:4000", {
            // auth: {
            //     token: localStorage.getItem("accessToken"),
            // },
        });
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
};
