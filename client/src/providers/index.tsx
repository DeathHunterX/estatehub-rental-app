"use client";

import StoreProvider from "@/states/store";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import SocketProvider from "./socket-provider";

const Providers = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <StoreProvider>
            <SocketProvider>
                <NuqsAdapter>
                    {children}
                    {mounted && <Toaster position="bottom-right" />}
                </NuqsAdapter>
            </SocketProvider>
        </StoreProvider>
    );
};

export default Providers;
