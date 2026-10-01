"use client";

import { CircleAlert, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function OfflineNotice({ onRetry, kind = "offline" }: { onRetry: () => void; kind?: "offline" | "unavailable" }) {
    return (
        <div className="w-full max-w-[38rem] rounded-[1.75rem] border border-border bg-gradient-to-br from-card via-card to-secondary/10 p-7 text-card-foreground shadow-2xl sm:p-12">
            <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <span className="whitespace-nowrap text-lg font-extrabold tracking-[-0.04em]">ESTATE<span className="font-medium text-secondary-500">HUB</span></span>
                <span className="text-right text-[10px] font-bold uppercase tracking-[0.14em] text-secondary-500 sm:text-xs">Connection update</span>
            </header>
            <div className="mt-9 flex size-12 items-center justify-center rounded-2xl border border-secondary-500/30 bg-secondary-500/15 text-secondary-500">{kind === "offline" ? <WifiOff className="size-6" aria-hidden="true" /> : <CircleAlert className="size-6" aria-hidden="true" />}</div>
            <h1 className="mt-6 max-w-lg text-[clamp(1.9rem,5vw,2.7rem)] leading-[1.12] font-semibold tracking-[-0.045em]">{kind === "offline" ? "Your browser is offline" : "EstateHub is temporarily unavailable"}</h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-muted-foreground">{kind === "offline" ? "Your browser reports that it has no network connection. Your current page and entered information are still here." : "We couldn't reach EstateHub. The website may be temporarily unavailable."}</p>
            <div className="mt-9 flex flex-col gap-4 border-t border-border pt-7 sm:flex-row sm:items-center sm:gap-5">
                <Button className="h-12 w-full rounded-full bg-secondary-500 px-7 font-semibold text-primary-950 hover:bg-secondary-400 hover:text-primary-950 sm:w-auto" onClick={onRetry}>{kind === "offline" ? "Check connection" : "Try again"}</Button>
                <p className="text-xs leading-5 text-muted-foreground">{kind === "offline" ? "We'll unlock this page when your browser reconnects." : "Your connection may still be working. Please check back shortly."}</p>
            </div>
        </div>
    );
}
