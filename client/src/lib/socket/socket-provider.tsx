"use client";
import { createSocket, disconnectSocket, getSocket } from "@/lib/socket/socket";
import { useGetAuthCurrentUserQuery } from "@/lib/api/api";
import { RootState, useAppDispatch, type AppStore } from "@/states/store";
import { api } from "@/lib/api/api";
import { useRefreshTokenMutation } from "@/lib/api/auth-api.slice";
import { logout, renewSession } from "@/states/slices/auth.slice";
import { useEffect } from "react";
import { useSelector, useStore } from "react-redux";

const SocketProvider = ({ children }: { children: React.ReactNode }) => {
    const dispatch = useAppDispatch();
    const store = useStore() as AppStore;
    const [refreshToken] = useRefreshTokenMutation();
    const accessToken = useSelector((state: RootState) => state.auth.accessToken);
    const { data: authUser } = useGetAuthCurrentUserQuery(undefined, {
        skip: !accessToken,
    });

    useEffect(() => {
        if (accessToken) {
            const socket = createSocket(accessToken);
            let active = true;
            let refreshing = false;
            const refreshSocketToken = () => {
                if (refreshing) return;
                refreshing = true;
                void refreshToken().unwrap().then((response) => {
                    if (active && store.getState().auth.accessToken === accessToken)
                        dispatch(renewSession({ accessToken: response.data.accessToken, userInfo: response.data.user }));
                }).catch(() => {
                    if (active && store.getState().auth.accessToken === accessToken) dispatch(logout());
                }).finally(() => { refreshing = false; });
            };
            const onDisconnect = (reason: string) => {
                if (reason === "io server disconnect") refreshSocketToken();
            };
            const onConnectError = (error: Error) => {
                if (error.message === "Unauthorized") refreshSocketToken();
            };
            socket.on("disconnect", onDisconnect);
            socket.on("connect_error", onConnectError);
            return () => {
                active = false;
                socket.off("disconnect", onDisconnect);
                socket.off("connect_error", onConnectError);
            };
        } else {
            disconnectSocket();
        }
    }, [accessToken, dispatch, refreshToken, store]);

    useEffect(() => {
        const socket = getSocket();
        if (!authUser?.user?.id || !socket) return;

        const refreshChats = (data: { chatId?: number }) => {
            if (!data?.chatId) return;
            dispatch(api.util.invalidateTags([
                { type: "Chats", id: "LIST" },
                { type: "Chats", id: data.chatId },
            ]));
        };

        socket.on("getMessage", refreshChats);

        return () => {
            socket.off("getMessage", refreshChats);
        };
    }, [accessToken, authUser?.user?.id, dispatch]);

    return children;
};

export default SocketProvider;
