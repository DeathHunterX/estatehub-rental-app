import type { Metadata } from "next";
import { Wrench } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
    title: "Scheduled maintenance | EstateHub",
    robots: { index: false, follow: false },
};

export default function MaintenancePage() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-background px-6 py-16 text-foreground">
            <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-8 text-card-foreground shadow-lg sm:p-12">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-secondary-500">
                    EstateHub
                </p>
                <div className="mt-7 flex size-14 items-center justify-center rounded-2xl bg-muted">
                    <Wrench className="size-7" aria-hidden="true" />
                </div>
                <h1 className="mt-6 text-3xl font-semibold tracking-tight">
                    We&apos;ll be back soon
                </h1>
                <p className="mt-4 leading-7 text-muted-foreground">
                    EstateHub is temporarily unavailable while we carry out
                    maintenance. Account, messaging and payment actions are
                    paused.
                </p>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    Please check back shortly. Thank you for your patience.
                </p>
                <Link
                    href="/"
                    prefetch={false}
                    className="mt-8 inline-flex rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                    Check again
                </Link>
            </div>
        </main>
    );
}
