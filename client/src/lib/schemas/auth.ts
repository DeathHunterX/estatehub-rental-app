import * as z from "zod";

export const signInSchema = z.object({
    email: z.email("Invalid email address"),
    password: z
        .string()
        .min(6, { message: "Password must be at least 6 characters long. " })
        .max(100, { message: "Password cannot exceed 100 characters." }),
});

export const signUpSchema = z
    .object({
        username: z.string().min(3, "Username must be at least 3 characters"),
        email: z.email("Invalid email address"),
        password: z
            .string()
            .min(6, { message: "Password must be at least 6 characters long." })
            .max(100, { message: "Password cannot exceed 100 characters." })
            .regex(/[A-Z]/, {
                message: "Password must contain at least one uppercase letter.",
            })
            .regex(/[a-z]/, {
                message: "Password must contain at least one lowercase letter.",
            })
            .regex(/[0-9]/, {
                message: "Password must contain at least one number.",
            })
            .regex(/[^a-zA-Z0-9]/, {
                message:
                    "Password must contain at least one special character.",
            }),
        confirmPassword: z
            .string()
            .min(8, "Password must be at least 8 characters"),
        role: z.enum(["Tenant", "Manager"]),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
    });

export type SignInFormData = z.infer<typeof signInSchema>;
export type SignUpFormData = z.infer<typeof signUpSchema>;
