export const serializePropertyFields = (fields: Record<string, unknown>): FormData => {
    const payload = new FormData();
    for (const [key, value] of Object.entries(fields)) {
        if (key === "photoUrls") payload.append(key, JSON.stringify(value));
        else if (Array.isArray(value)) payload.append(key, value.join(","));
        else payload.append(key, String(value));
    }
    return payload;
};
