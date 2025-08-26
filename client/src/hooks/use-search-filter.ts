import {
    createParser,
    parseAsFloat,
    parseAsString,
    useQueryStates,
} from "nuqs";

export const useSearchFilter = () => {
    return useQueryStates(
        {
            location: parseAsString,
            beds: parseAsString.withDefault("any"),
            baths: parseAsString.withDefault("any"),
            propertyType: parseAsString.withDefault("any"),
            amenities: createParser<string[] | null>({
                parse: (value: string) => {
                    return value.split(",") || null;
                },
                serialize: (value: string[] | null): string => {
                    if (Array.isArray(value) && value.length > 0) {
                        return value.join(",");
                    } else {
                        return null as unknown as string;
                    }
                },
            }),
            availableFrom: parseAsString.withDefault("any"),
            priceRange: createParser<[number | null, number | null]>({
                parse: (value: string) => {
                    const parts = value.split(",");
                    const nums = parts.map((v) => {
                        const n = parseInt(v);
                        return isNaN(n) || n === 0 ? null : n;
                    });
                    return nums.length === 2 ? [nums[0], nums[1]] : null;
                },
                serialize: (value: [number | null, number | null]): string => {
                    if (value[0] === null && value[1] === null) {
                        return null as unknown as string; // remove param
                    }
                    if (value[1] === null && value[0] !== null) {
                        return value[0]?.toString() || "0";
                    }
                    return value.map((v) => v?.toString() || "0").join(",");
                },
            }).withDefault([null, null] as [number | null, number | null]),
            squareFeet: createParser<[number | null, number | null]>({
                parse: (value: string) => {
                    const parts = value.split(",");
                    const nums = parts.map((v) => {
                        const n = parseInt(v);
                        return isNaN(n) || n === 0 ? null : n;
                    });
                    return nums.length === 2 ? [nums[0], nums[1]] : null;
                },
                serialize: (value: [number | null, number | null]): string => {
                    if (value[0] === null && value[1] === null) {
                        return null as unknown as string; // remove param
                    }
                    if (value[1] === null && value[0] !== null) {
                        return value[0]?.toString() || "0";
                    }
                    return value.map((v) => v?.toString() || "0").join(",");
                },
            }).withDefault([null, null] as [number | null, number | null]),
            latitude: parseAsFloat,
            longitude: parseAsFloat,
        },
        {
            urlKeys: {
                latitude: "lat",
                longitude: "lng",
            },
        }
    );
};
