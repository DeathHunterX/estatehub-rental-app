import { api } from "@/lib/api/api";
import type { SessionUser } from "@/states/slices/auth.slice";

export const authApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        signIn: builder.mutation<
            {
                data: { accessToken: string; user: SessionUser; message: string };
                success: boolean;
            },
            { email: string; password: string }
        >({
            query: (body) => ({
                url: "/auth/login",
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body,
            }),
        }),
        signOut: builder.mutation<{ message: string }, void>({
            query: () => ({
                url: "/auth/logout",
                method: "POST",
                credentials: "include",
            }),
        }),
        signUp: builder.mutation<
            { data: { message: string }; success: boolean },
            {
                username: string;
                email: string;
                password: string;
                confirmPassword: string;
            }
        >({
            query: (body) => ({
                url: "/auth/register",
                method: "POST",
                body,
            }),
        }),
        refreshToken: builder.mutation<{ success: boolean; data: { accessToken: string; user: SessionUser } }, void>({
            query: () => ({
                url: "/auth/refresh-token",
                method: "POST",
                credentials: "include",
            }),
        }),
    }),
});

export const {
    useSignInMutation,
    useSignOutMutation,
    useSignUpMutation,
    useRefreshTokenMutation,
} = authApiSlice;
