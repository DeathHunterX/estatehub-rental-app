import { v2 as cloudinary } from "cloudinary";
import { unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { BadRequestError } from "../errors/http-error";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (
    file: Express.Multer.File,
    folderPath: string
) => {
    if (file.size > 1024 * 1024 * 5) {
        throw new BadRequestError("Size too large");
    }

    if (file.mimetype !== "image/jpeg" && file.mimetype !== "image/png") {
        throw new BadRequestError("File format is incorrect");
    }

    const buffer = file.buffer;

    const tempPath = path.join(tmpdir(), file.originalname);
    await writeFile(tempPath, buffer);

    try {
        await writeFile(tempPath, buffer);

        const result = await cloudinary.uploader.upload(tempPath, {
            folder: folderPath,
        });

        return result.secure_url;
    } catch (error) {
        throw new BadRequestError("Failed to upload image");
    } finally {
        // Cleanup temporary file
        await unlink(tempPath).catch(() => {});
    }
};

export const deleteImage = async (imageUrl: string) => {
    const publicId = imageUrl.split("/").pop()?.split(".")[0];

    if (!publicId) {
        throw new BadRequestError("Invalid image URL");
    }

    try {
        await cloudinary.uploader.destroy(publicId).then((result) => {
            if (result.result !== "ok") {
                return false;
            }

            return true;
        });
    } catch (error) {
        return false;
    }
};
