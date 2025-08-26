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
    filters: FiltersState;
    isFiltersFullOpen: boolean;
    viewMode: "grid" | "list";
}

export const initialState: InitialStateTypes = {
    filters: {
        location: "Los Angeles",
        beds: "any",
        baths: "any",
        propertyType: "any",
        amenities: [],
        availableFrom: "any",
        priceRange: [null, null],
        squareFeet: [null, null],
        latitude: 34.05,
        longitude: -118.25,
    },
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
    },
});

export const { toggleFiltersFullOpen, setViewMode } = globalSlice.actions;

export default globalSlice.reducer;
