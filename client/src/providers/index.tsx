"use client";

// Libraries
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { useEffect, useSyncExternalStore } from "react";
import { Toaster } from "react-hot-toast";
import { useStore } from "react-redux";

// Components
import AvailabilityBoundary from "@/features/availability/components/availability-boundary";

// APIs
import { useRefreshTokenMutation } from "@/lib/api/auth-api.slice";

// State
import StoreProvider from "@/states/store";
import { restoreSession } from "@/states/slices/auth.slice";
import { useAppDispatch, type AppStore } from "@/states/store";

// Libs
import SocketProvider from "../lib/socket/socket-provider";
import { clearLegacyStorage } from "@/lib/legacy-storage-cleanup";

let legacyStorageCleaned = false;

const RestoreSession = () => {
    const dispatch = useAppDispatch();
    const store = useStore() as AppStore;
    const [refreshToken] = useRefreshTokenMutation();
    useEffect(() => {
        let active = true;
        // Clear storage from the old session model before restoring from the cookie.
        try {
            if (!legacyStorageCleaned) {
                clearLegacyStorage(localStorage, (value) => {
                    document.cookie = value;
                });
                legacyStorageCleaned = true;
            }
            document.documentElement.dataset.reduceMotion =
                localStorage.getItem("estatehub:reduce-motion") === "true"
                    ? "true"
                    : "false";
        } catch {
            document.documentElement.dataset.reduceMotion = "false";
        }
        void refreshToken()
            .unwrap()
            .then((response) => {
                if (active && !store.getState().auth.hydrated)
                    dispatch(
                        restoreSession({
                            accessToken: response.data.accessToken,
                            userInfo: response.data.user,
                        })
                    );
            })
            .catch(() => {
                if (active && !store.getState().auth.hydrated)
                    dispatch(
                        restoreSession({ accessToken: null, userInfo: null })
                    );
            });
        return () => {
            active = false;
        };
    }, [dispatch, refreshToken, store]);
    return null;
};

const Providers = ({ children }: { children: React.ReactNode }) => {
    const mounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    return (
        <StoreProvider>
            <RestoreSession />
            <ThemeProvider
                attribute="class"
                defaultTheme="dark"
                enableSystem
                disableTransitionOnChange
            >
                <AvailabilityBoundary>
                    <SocketProvider>
                        <NuqsAdapter>
                            {children}
                            {mounted && <Toaster position="bottom-right" />}
                        </NuqsAdapter>
                    </SocketProvider>
                </AvailabilityBoundary>
            </ThemeProvider>
        </StoreProvider>
    );
};

export default Providers;
