"use client";

import StoreProvider from "@/states/store";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";

const Providers = ({ children }: { children: React.ReactNode }) => {
    const [mounted, setMounted] = useState<boolean>(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <StoreProvider>
            <NuqsAdapter>
                {children}
                {mounted && <Toaster position="bottom-right" />}
            </NuqsAdapter>
        </StoreProvider>
    );
};

export default Providers;
