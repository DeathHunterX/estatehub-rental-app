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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "react-hot-toast";

// Form validation and handling
import { SignUpFormData, signUpSchema } from "@/lib/schemas/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// State management
import { useSignUpMutation } from "@/states/api/auth-api.slice";

export function SignUpForm() {
    const [signUp, { isLoading }] = useSignUpMutation();

    const form = useForm<SignUpFormData>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: "Tenant",
        },
    });

    async function onSubmit(data: SignUpFormData) {
        await signUp(data)
            .unwrap()
            .then((res) => {
                toast.success(res.data.message);
                form.reset();
            })
            .catch((error) => {
                if (error.status === "FETCH_ERROR") {
                    toast.error("Network error");
                } else {
                    toast.error(error.data.error.message);
                }
                throw error;
            });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="username"
                    key="username"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                            <FormLabel className="flex items-start">
                                Username
                            </FormLabel>
                            <FormControl>
                                <Input
                                    placeholder="john_doe"
                                    type="text"
                                    autoCapitalize="none"
                                    autoComplete="username"
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
                            <FormLabel className="flex items-start">
                                Password
                            </FormLabel>

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

                <FormField
                    control={form.control}
                    name="confirmPassword"
                    key="confirmPassword"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-col">
                            <FormLabel className="flex items-start">
                                Confirm Password
                            </FormLabel>

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

                <FormField
                    control={form.control}
                    name="role"
                    key="role"
                    render={({ field }) => (
                        <FormItem className="flex w-full flex-row gap-x-12">
                            <FormLabel>Role: </FormLabel>
                            <FormControl>
                                <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex flex-row gap-x-6"
                                >
                                    <FormItem className="flex items-center gap-3">
                                        <FormControl>
                                            <RadioGroupItem value="Tenant" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Tenant
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center gap-3">
                                        <FormControl>
                                            <RadioGroupItem value="Manager" />
                                        </FormControl>
                                        <FormLabel className="font-normal">
                                            Manager
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
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
                            Signing up...
                        </>
                    ) : (
                        "Sign up"
                    )}
                </Button>
            </form>
        </Form>
    );
}
