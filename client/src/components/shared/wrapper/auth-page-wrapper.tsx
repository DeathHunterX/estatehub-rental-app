"use client";
// React and Next.js core imports
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

// Component imports
import SocialAuthForm from "../forms/social-auth-form";

// Redux and state management imports
import { RootState } from "@/states/store";
import { useSelector } from "react-redux";

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
    const { userInfo } = useSelector((state: RootState) => state.auth);

    const navigation = useRouter();
    const pathname = usePathname();

    const isAuthPage = pathname.match(/^\/(sign-in|sign-up)$/);

    useEffect(() => {
        if (userInfo.accessToken && isAuthPage) {
            navigation.push("/");
        }
    }, [isAuthPage, navigation, userInfo]);

    return (
        <div className="relative flex size-full flex-1 shrink-0 items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="text-primary relative hidden h-full flex-col p-8 lg:flex dark:border-r">
                <div className="bg-black opacity-40 absolute inset-0 z-10" />
                <Image
                    src="/front-view-house.jpg"
                    alt="front-view-house"
                    fill
                    className="absolute object-cover"
                />
                <div className="relative z-20 flex items-center text-lg text-white font-medium">
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
            <div className="flex items-center justify-center m-6 sm:m-0 lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center gap-6 sm:w-[400px]">
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

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white text-muted-foreground px-2">
                                    Or continue with
                                </span>
                            </div>
                        </div>
                        <SocialAuthForm />
                    </div>

                    <div className="flex flex-col gap-y-8">
                        <p className="text-muted-foreground px-8 text-center text-sm">
                            By clicking continue, you agree to our{" "}
                            <Link
                                href="/terms"
                                className="hover:text-primary underline underline-offset-4"
                            >
                                Terms of Service
                            </Link>{" "}
                            and{" "}
                            <Link
                                href="/privacy"
                                className="hover:text-primary underline underline-offset-4"
                            >
                                Privacy Policy
                            </Link>
                            .
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
