"use client";
import { createSocket, getSocket } from "@/services/socket";
import { useGetAuthCurrentUserQuery } from "@/states/api";
import { useEffect } from "react";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: authUser } = useGetAuthCurrentUserQuery();

    useEffect(() => {
        // Initialize socket
        createSocket();
    }, []);

    useEffect(() => {
        const socket = getSocket();
        if (authUser?.user?.id && socket) {
            socket.emit("newUser", authUser.user.id);
        }
    }, [authUser]);

    return children;
};

export default SocketProvider;
