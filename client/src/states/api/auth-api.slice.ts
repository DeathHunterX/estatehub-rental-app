import { api } from "@/states/api";

export const authApiSlice = api.injectEndpoints({
    endpoints: (builder) => ({
        signIn: builder.mutation<
            {
                data: { accessToken: string; user: User; message: string };
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
            }),
        }),
        signUp: builder.mutation<
            {
                data: { accessToken: string; user: User; message: string };
                success: boolean;
            },
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
        refreshToken: builder.mutation<{ accessToken: string }, void>({
            query: () => ({
                url: "/auth/refresh-token",
                method: "POST",
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
