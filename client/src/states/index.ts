import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { SearchViewMode } from "@/features/search/lib/search-view";
import { logout, restoreSession, setCredentials } from "./slices/auth.slice";

export interface FiltersState {
    location: string;
    beds: string;
    baths: string;
    propertyType: string;
    amenities: string[];
    availableFrom: string;
    priceRange: [number | null, number | null];
    squareFeet: [number | null, number | null];
    latitude: number | null;
    longitude: number | null;
}

interface InitialStateTypes {
    chatId: number | null;
    chatSessionVersion: number;
    isFiltersFullOpen: boolean;
    viewMode: SearchViewMode;
}

export const initialState: InitialStateTypes = {
    chatId: null,
    chatSessionVersion: 0,
    isFiltersFullOpen: false,
    viewMode: "grid",
};

export const globalSlice = createSlice({
    name: "global",
    initialState,
    reducers: {
        toggleFiltersFullOpen: (state) => {
            state.isFiltersFullOpen = !state.isFiltersFullOpen;
        },
        setFiltersFullOpen: (state, action: PayloadAction<boolean>) => {
            state.isFiltersFullOpen = action.payload;
        },
        setViewMode: (state, action: PayloadAction<SearchViewMode>) => {
            state.viewMode = action.payload;
        },
        setChatId: (state, action: PayloadAction<{ chatId: number; sessionVersion: number } | null>) => {
            if (action.payload === null) {
                state.chatId = null;
            } else if (action.payload.sessionVersion === state.chatSessionVersion) {
                state.chatId = action.payload.chatId;
            }
        },
    },
    extraReducers: (builder) => {
        builder.addCase(restoreSession, (state) => {
            state.chatId = null;
            state.chatSessionVersion += 1;
        });
        builder.addCase(logout, (state) => {
            state.chatId = null;
            state.chatSessionVersion += 1;
        });
        builder.addCase(setCredentials, (state) => {
            state.chatId = null;
            state.chatSessionVersion += 1;
        });
    },
});

export const { toggleFiltersFullOpen, setFiltersFullOpen, setViewMode, setChatId } =
    globalSlice.actions;

export default globalSlice.reducer;
