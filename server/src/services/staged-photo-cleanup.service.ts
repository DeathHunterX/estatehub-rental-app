import type { PropertyPhotoAsset } from "../types/global";
import { v2 as cloudinary } from "cloudinary";
import prisma from "../lib/prisma";
import { isStaleUnreferencedPhoto } from "../utils/property-photos";

export const cleanStagedPropertyPhotos = async () => {
    if (
        !process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET
    )
        return;
    const properties = await prisma.property.findMany({
        select: { photoUrls: true },
    });
    const referencedUrls = new Set(
        properties.flatMap((property) => property.photoUrls)
    );
    let cursor: string | undefined;
    do {
        const page = await cloudinary.api.resources({
            resource_type: "image",
            type: "upload",
            prefix: "estate-hub/properties/",
            max_results: 500,
            ...(cursor ? { next_cursor: cursor } : {}),
        });
        const candidates = (
            page.resources as Array<PropertyPhotoAsset>
        ).filter((asset) => isStaleUnreferencedPhoto(asset, referencedUrls));
        await Promise.allSettled(
            candidates.map((asset) =>
                cloudinary.uploader.destroy(asset.public_id)
            )
        );
        cursor = page.next_cursor;
    } while (cursor);
};
