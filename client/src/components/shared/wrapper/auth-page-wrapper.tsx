"use client";
// Libraries
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";

// State
import { RootState } from "@/states/store";
import { destinationAfterSignIn } from "@/features/auth/lib/session-navigation";

// Components
import SocialAuthForm from "../forms/social-auth-form";

interface AuthPageWrapperProps {
    title: string;
    description: string;
    formType: "SIGN_IN" | "SIGN_UP";
    formComponent: React.ReactNode;
}

const AuthPageWrapper = ({
    title,
    description,
    formType,
    formComponent,
}: AuthPageWrapperProps) => {
    const { accessToken, hydrated, userInfo } = useSelector(
        (state: RootState) => state.auth
    );

    const navigation = useRouter();
    const pathname = usePathname();

    const isAuthPage = /^\/(sign-in|sign-up)$/.test(pathname);

    useEffect(() => {
        if (hydrated && accessToken && isAuthPage) {
            navigation.replace(destinationAfterSignIn(userInfo?.role));
        }
    }, [accessToken, hydrated, isAuthPage, navigation, userInfo?.role]);

    if (!hydrated || (accessToken && isAuthPage)) {
        return (
            <div
                className="flex min-h-screen items-center justify-center bg-background px-6 text-center text-sm text-muted-foreground"
                role="status"
            >
                {hydrated
                    ? "Returning to EstateHub..."
                    : "Checking your session..."}
            </div>
        );
    }

    return (
        <div className="bg-background text-foreground grid min-h-screen lg:grid-cols-2">
            <div className="relative hidden min-h-screen flex-col p-8 lg:flex">
                <div className="absolute inset-0 z-10 bg-black/40" />
                <Image
                    src="/front-view-house.jpg"
                    alt="A house at dusk"
                    fill
                    priority
                    sizes="50vw"
                    className="object-cover"
                />
                <div className="relative z-20 flex items-center text-lg font-medium text-white">
                    EstateHub
                </div>
                <div className="relative z-20 mt-auto text-white">
                    <blockquote className="leading-normal text-balance">
                        &ldquo;Find your dream home with ease and convenience.
                        Our platform makes renting a property simple and
                        stress-free.&rdquo; - Sofia Davis
                    </blockquote>
                </div>
            </div>
            <div className="flex items-center justify-center px-6 py-12 sm:px-8 lg:p-8">
                <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center gap-6">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {description}
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {formComponent}
                        <div className="relative flex items-center justify-center">
                            <span className="absolute w-full border-t border-border" />
                            <span className="bg-background text-muted-foreground relative px-2 text-xs uppercase">
                                Or continue with
                            </span>
                        </div>
                        <SocialAuthForm />
                    </div>

                    <div className="flex flex-col gap-y-8">
                        <p className="text-muted-foreground px-8 text-center text-sm">
                            Our{" "}
                            <Link
                                href="/terms"
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Privacy Policy
                            </Link>{" "}
                            are available for review. Read our{" "}
                            <Link
                                href="/refund-cancellation"
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Refund & Cancellation Policy
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/cookies"
                                className="hover:text-foreground underline underline-offset-4"
                            >
                                Cookie Policy
                            </Link>{" "}
                            too.
                        </p>
                        {formType === "SIGN_IN" ? (
                            <p className="text-muted-foreground px-8 text-center text-sm">
                                Don&apos;t have an account?{" "}
                                <Link
                                    href="/sign-up"
                                    className="hover:text-primary underline underline-offset-4"
                                >
                                    Sign up
                                </Link>
                            </p>
                        ) : formType === "SIGN_UP" ? (
                            <p className="text-muted-foreground px-8 text-center text-sm">
                                Already have an account?{" "}
                                <Link
                                    href="/sign-in"
                                    className="hover:text-primary underline underline-offset-4"
                                >
                                    Sign in
                                </Link>
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPageWrapper;
