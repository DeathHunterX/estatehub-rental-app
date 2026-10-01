"use client";

import OfflineNotice from "@/features/availability/components/offline-notice";
import { useRouter } from "next/navigation";

export default function OfflinePage() {
    const router = useRouter();
    return (
        <main className="flex min-h-screen items-center justify-center bg-background p-5 text-foreground dark:bg-[radial-gradient(circle_at_50%_0%,#23202b_0%,#10131d_38%,#090d16_78%)]">
            <OfflineNotice
                kind="unavailable"
                onRetry={() => router.push("/")}
            />
        </main>
    );
}
