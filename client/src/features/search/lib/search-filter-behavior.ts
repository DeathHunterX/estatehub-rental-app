export const sliderRangeToFilter = (
    [start, end]: [number, number],
    minimum: number,
    maximum: number
): [number | null, number | null] => [
    start <= minimum ? null : start,
    end >= maximum ? null : end,
];

export const canLoadTenantProfile = (role: string | null | undefined) =>
    role?.toLowerCase() === "tenant";

export const updateFilterRange = (
    current: [number | null, number | null],
    index: 0 | 1,
    value: number | null
): [number | null, number | null] => {
    const next: [number | null, number | null] = [...current];
    next[index] = value;
    // Clear the opposite endpoint rather than silently moving the user's new selection.
    if (next[0] !== null && next[1] !== null && next[0] > next[1]) {
        next[index === 0 ? 1 : 0] = null;
    }
    return next;
};
