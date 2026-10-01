import Link from "next/link";

export default function ForgotPasswordPage() {
    return (
        <div className="flex min-h-[calc(100vh-52px)] items-center justify-center bg-background px-6 py-16 text-foreground">
            <main className="w-full max-w-lg rounded-2xl border border-border bg-card p-8 text-card-foreground shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-widest text-secondary-500">
                    Account help
                </p>
                <h1 className="mt-3 text-3xl font-semibold">
                    Password reset is not available yet
                </h1>
                <p className="mt-4 leading-7 text-muted-foreground">
                    EstateHub cannot send password reset links in this version.
                    We are showing this notice so you do not wait for an email
                    that will not arrive.
                </p>
                <Link
                    href="/sign-in"
                    className="mt-7 inline-flex rounded-lg bg-secondary-500 px-5 py-3 font-medium text-primary-950 hover:bg-secondary-400"
                >
                    Back to sign in
                </Link>
            </main>
        </div>
    );
}
