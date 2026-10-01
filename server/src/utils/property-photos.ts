import type { PropertyPhotoAsset } from "../types/global";
import { BadRequestError } from "../errors/http-error";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";

const photoOwnerSignature = (managerUserId: string, id: string, secret: string): string =>
    createHmac("sha256", secret).update(`${managerUserId}:${id}`).digest("hex").slice(0, 32);

export const newStagedPhotoFolder = (managerUserId: string, secret: string): string => {
    if (!secret) throw new Error("Cloudinary secret is required for staged photo ownership");
    const id = randomUUID();
    return `estate-hub/properties/staged/${id}-${photoOwnerSignature(managerUserId, id, secret)}`;
};

const ownsOpaqueStagedPhoto = (path: string, managerUserId: string, secret: string): boolean => {
    const match = /^estate-hub\/properties\/staged\/([0-9a-f-]{36})-([0-9a-f]{32})\/[^/]+$/i.exec(path);
    if (!match || !secret) return false;
    const expected = Buffer.from(photoOwnerSignature(managerUserId, match[1].toLowerCase(), secret), "hex");
    const actual = Buffer.from(match[2], "hex");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
};

export const assertPropertyPhotoCount = (urls: string[]): string[] => {
    if (urls.length > 20)
        throw new BadRequestError("Add up to 20 property photos");
    return urls;
};

export const parsePropertyPhotoUrls = (
    value: unknown,
    managerUserId: string,
    existingUrls: string[] = [],
    ownershipSecret = process.env.CLOUDINARY_API_SECRET ?? ""
): string[] => {
    let urls: unknown;
    try {
        urls = typeof value === "string" ? JSON.parse(value) : value;
    } catch {
        throw new BadRequestError("Invalid property photos");
    }
    if (!Array.isArray(urls) || urls.length > 20) {
        throw new BadRequestError("Add up to 20 property photos");
    }
    for (const url of urls) {
        if (typeof url !== "string")
            throw new BadRequestError("Invalid property photo");
        if (existingUrls.includes(url)) continue;
        let parsed: URL;
        try {
            parsed = new URL(url);
        } catch {
            throw new BadRequestError("Invalid property photo URL");
        }
        const configuredCloud = process.env.CLOUDINARY_CLOUD_NAME;
        const imagePath = parsed.pathname.split("/image/upload/")[1]?.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "") ?? "";
        const legacyOwnerPath = `estate-hub/properties/${managerUserId}/`;
        if (
            parsed.protocol !== "https:" ||
            parsed.hostname !== "res.cloudinary.com" ||
            (configuredCloud &&
                parsed.pathname.split("/")[1] !== configuredCloud) ||
            !parsed.pathname.includes("/image/upload/") ||
            !(imagePath.startsWith(legacyOwnerPath) || ownsOpaqueStagedPhoto(imagePath, managerUserId, ownershipSecret))
        ) {
            throw new BadRequestError(
                "Property photo must be uploaded by this account"
            );
        }
    }
    return urls as string[];
};

export const cloudinaryPublicId = (url: string): string => {
    const path = new URL(url).pathname.split("/image/upload/")[1];
    const publicId = path?.replace(/^v\d+\//, "").replace(/\.[^/.]+$/, "");
    if (!publicId || publicId.includes(".."))
        throw new BadRequestError("Invalid image URL");
    return publicId;
};

export const isStaleUnreferencedPhoto = (
    asset: PropertyPhotoAsset,
    referencedUrls: Set<string>,
    now = Date.now()
): boolean =>
    asset.public_id.includes("/staged/") &&
    !referencedUrls.has(asset.secure_url) &&
    Date.parse(asset.created_at) < now - 7 * 24 * 60 * 60 * 1000;
