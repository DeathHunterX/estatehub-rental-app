import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    accessToken:
        typeof window !== "undefined"
            ? localStorage.getItem("accessToken") || null
            : null,
    userInfo:
        typeof window !== "undefined"
            ? JSON.parse(localStorage.getItem("userInfo") || "{}")
            : null,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setCredentials: (state, action) => {
            const { user, accessToken } = action.payload;

            state.userInfo = user;
            state.accessToken = accessToken;
            localStorage.setItem("userInfo", JSON.stringify(user));
            localStorage.setItem("accessToken", accessToken);
        },
        logout: (state) => {
            state.userInfo = {};
            state.accessToken = null;
            localStorage.removeItem("userInfo");
            localStorage.removeItem("accessToken");
        },
    },
});

export const { setCredentials, logout } = authSlice.actions;

export default authSlice.reducer;
