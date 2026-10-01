export const propertyImageSrc = (url?: string | null) => {
    if (!url || /^https?:\/\/example\.com(?:\/|$)/i.test(url)) {
        return "/placeholder.jpg";
    }
    return url;
};

export const usablePropertyPhotos = (urls?: string[] | null) =>
    (urls ?? []).filter((url) => Boolean(url) && propertyImageSrc(url) === url);
