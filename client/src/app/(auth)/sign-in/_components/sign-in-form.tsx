"use client";

// UI Components
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
import { toast } from "react-hot-toast";

// Form validation and handling
import { SignInFormData, signInSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Navigation
import Link from "next/link";

// State management
import { useSignInMutation } from "@/states/api/auth-api.slice";
import { setCredentials } from "@/states/slices/auth.slice";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";

export function SignInForm() {
    const dispatch = useDispatch();
    const navigate = useRouter();
    const [signIn, { isLoading }] = useSignInMutation();

    const form = useForm<SignInFormData>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "phanthanhloi22112001@gmail.com",
            password: "Kingroyal!23",
        },
    });

    async function onSubmit(data: SignInFormData) {
        await signIn(data)
            .unwrap()
            .then((res) => {
                dispatch(setCredentials(res.data));
                toast.success(res.data.message);
                navigate.push("/");
            })
            .catch((error) => {
                if (error.status === "FETCH_ERROR") {
                    toast.error("Network error");
                } else {
                    toast.error(error.data.error.message);
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
                                    className="text-sm text-primary-500 hover:underline hover:text-primary-800"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <FormControl>
                                <Input
                                    placeholder="********"
                                    type="password"
                                    autoCapitalize="none"
                                    autoComplete="password"
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
                    className="hover:bg-primary-100/65 w-full"
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
