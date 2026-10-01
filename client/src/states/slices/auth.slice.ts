import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

export type SessionUser = {
    id?: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    image?: string | null;
};

const initialState = {
    accessToken: null as string | null,
    userInfo: null as SessionUser | null,
    hydrated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        restoreSession: (state, action: PayloadAction<{ accessToken: string | null; userInfo: SessionUser | null }>) => {
            state.accessToken = action.payload.accessToken;
            state.userInfo = action.payload.userInfo;
            state.hydrated = true;
        },
        setCredentials: (state, action: PayloadAction<{ user: SessionUser; accessToken: string }>) => {
            const { user, accessToken } = action.payload;

            state.userInfo = user;
            state.accessToken = accessToken;
            state.hydrated = true;
        },
        renewSession: (state, action: PayloadAction<{ userInfo: SessionUser; accessToken: string }>) => {
            state.userInfo = action.payload.userInfo;
            state.accessToken = action.payload.accessToken;
            state.hydrated = true;
        },
        logout: (state) => {
            state.userInfo = null;
            state.accessToken = null;
            state.hydrated = true;
        },
    },
});

export const { restoreSession, setCredentials, renewSession, logout } = authSlice.actions;

export default authSlice.reducer;
