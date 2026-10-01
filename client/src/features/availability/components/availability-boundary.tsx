"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import OfflineNotice from "./offline-notice";

function subscribe(onChange: () => void) {
    window.addEventListener("online", onChange);
    window.addEventListener("offline", onChange);
    window.addEventListener("estatehub:check-connection", onChange);
    return () => {
        window.removeEventListener("online", onChange);
        window.removeEventListener("offline", onChange);
        window.removeEventListener("estatehub:check-connection", onChange);
    };
}

export default function AvailabilityBoundary({ children }: { children: React.ReactNode }) {
    const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);
    const overlay = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
        // Registration failure must never prevent normal application use.
        void navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {});
    }, []);

    useEffect(() => {
        if (online) return;
        const previousFocus = document.activeElement;
        overlay.current?.focus();
        // Dialogs and dropdowns may render through portals outside the inert wrapper.
        const blockInteraction = (event: Event) => {
            if (event.target instanceof Node && overlay.current?.contains(event.target)) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            overlay.current?.focus();
        };
        const events = ["click", "pointerdown", "keydown", "submit", "focusin"];
        events.forEach((event) => document.addEventListener(event, blockInteraction, true));
        return () => {
            events.forEach((event) => document.removeEventListener(event, blockInteraction, true));
            if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
        };
    }, [online]);

    return <>
        <div inert={!online} aria-hidden={!online ? true : undefined}>{children}</div>
        {!online && createPortal(
            <div ref={overlay} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Internet connection lost" className="fixed inset-0 z-[2147483647] flex items-center justify-center overflow-y-auto bg-background/65 p-6 backdrop-blur-sm outline-none">
                <OfflineNotice onRetry={() => window.dispatchEvent(new Event("estatehub:check-connection"))} />
            </div>, document.body,
        )}
    </>;
}
