import { clsx, type ClassValue } from "clsx";
import { createParser } from "nuqs";
import { toast } from "react-hot-toast";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatEnumString(str: string) {
    return str.replace(/([A-Z])/g, " $1").trim();
}

export function formatPriceValue(value: number | null, isMin: boolean) {
    if (value === null || value === 0)
        return isMin ? "Any Min Price" : "Any Max Price";
    if (value >= 1000) {
        const kValue = value / 1000;
        return isMin ? `$${kValue}k+` : `<$${kValue}k`;
    }
    return isMin ? `$${value}+` : `<$${value}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanParams(params: Record<string, any>): Record<string, any> {
    return Object.fromEntries(
        Object.entries(params).filter(
            (
                [_, value] // eslint-disable-line @typescript-eslint/no-unused-vars
            ) =>
                value !== undefined &&
                value !== "any" &&
                value !== "" &&
                (Array.isArray(value)
                    ? value.some((v) => v !== null)
                    : value !== null)
        )
    );
}

export const parseStrictCoordinates = createParser<[number, number]>({
    parse: (value: string) => {
        try {
            const [lng, lat] = value.split("%2C").map(Number);
            if (isNaN(lng) || isNaN(lat)) return null;
            return [lng, lat];
        } catch {
            return null;
        }
    },
    serialize: (coords: [number, number]): string => coords.join("%2C"),
});

type MutationMessages = {
    success?: string;
    error?: string;
};

export const withToast = async <T>(
    mutationFn: Promise<T>,
    messages: Partial<MutationMessages>
) => {
    const { success, error } = messages;

    try {
        const result = await mutationFn;
        if (success) toast.success(success);
        return result;
    } catch (err) {
        if (error) {
            const errorObj = err as { data?: { error?: { message?: string } } };
            const errorMessage = errorObj.data?.error?.message || error;
            toast.error(errorMessage);
        }
        return;
    }
};
