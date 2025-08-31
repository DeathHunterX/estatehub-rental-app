import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface FiltersState {
    location: string;
    beds: string;
    baths: string;
    propertyType: string;
    amenities: string[];
    availableFrom: string;
    priceRange: [number, number] | [null, null];
    squareFeet: [number, number] | [null, null];
    latitude: number;
    longitude: number;
}

interface InitialStateTypes {
    chatId: number | null;
    isFiltersFullOpen: boolean;
    viewMode: "grid" | "list";
}

export const initialState: InitialStateTypes = {
    chatId: null,
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
        setViewMode: (state, action: PayloadAction<"grid" | "list">) => {
            state.viewMode = action.payload;
        },
        setChatId: (state, action: PayloadAction<number | null>) => {
            state.chatId = action.payload;
        },
    },
});

export const { toggleFiltersFullOpen, setViewMode, setChatId } =
    globalSlice.actions;

export default globalSlice.reducer;
