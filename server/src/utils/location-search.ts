import type { LocationAddress } from "../types/global";

export const locationSearchTerms = (value: string): string[] =>
    value
        .split(",")
        .map((part) =>
            part.normalize("NFC").replace(/[^\p{L}\p{M}\p{N}]/gu, "")
        )
        .filter(Boolean);

export const completeLocationAddress = (location: LocationAddress): string => {
    const parts = [
        location.address,
        location.subdistrict,
        location.district,
        location.city,
        location.state,
        location.country,
        location.postalCode,
    ]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part));
    return parts
        .filter(
            (part, index) =>
                index === 0 ||
                part.toLocaleLowerCase() !==
                    parts[index - 1].toLocaleLowerCase()
        )
        .join(", ");
};
