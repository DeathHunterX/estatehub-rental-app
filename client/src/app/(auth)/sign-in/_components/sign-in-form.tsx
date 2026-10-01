"use client";

// Libraries
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

// Components
import { Icons } from "@/components/shared/icons";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

// Validation
import { SignInFormData, signInSchema } from "@/lib/schemas/auth";

// APIs
import { useSignInMutation } from "@/lib/api/auth-api.slice";

// State
import { setCredentials } from "@/states/slices/auth.slice";

// Libs
import { destinationAfterSignIn } from "@/features/auth/lib/session-navigation";

export function SignInForm() {
    const dispatch = useDispatch();
    const navigate = useRouter();
    const [signIn, { isLoading }] = useSignInMutation();

    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(data: SignInFormData) {
        await signIn(data)
            .unwrap()
            .then((res) => {
                dispatch(setCredentials(res.data));
                toast.success(res.data.message);
                navigate.replace(destinationAfterSignIn(res.data.user.role));
            })
            .catch((error) => {
                if (error.status === "FETCH_ERROR") {
                    toast.error("Network error");
                } else {
                    toast.error(error.data?.error?.message || "Sign in failed");
                }
            });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="email"
                    key="email"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                            <FormLabel className="flex items-start">
                                Email
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="name@example.com"
                                    type="email"
                                    autoCapitalize="none"
                                    autoComplete="email"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="password"
                    key="password"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                            <div className="flex items-center justify-between">
                                <FormLabel className="flex items-start">
                                    Password
                                </FormLabel>
                                <Link
                                    href="/forgot-password"
                                    className="text-muted-foreground hover:text-foreground text-sm hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <FormControl>
                                <Input
                                    placeholder="********"
                                    type="password"
                                    autoCapitalize="none"
                                    autoComplete="current-password"
                                    autoCorrect="off"
                                    disabled={isLoading}
                                    {...field}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <Button
                    disabled={isLoading}
                    className="w-full"
                    variant="default"
                >
                    {isLoading ? (
                        <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Signing in...
                        </>
                    ) : (
                        "Sign in"
                    )}
                </Button>
            </form>
        </Form>
    );
}
