import cloudinary from "../config/cloudinary";
import AppError from "./AppError";

export type TCloudinaryUploadResult = {
  url: string;
  publicId: string;
};

type TResourceType = "image" | "video" | "raw" | "auto";

export const uploadBufferToCloudinary = (
  file: Express.Multer.File,
  folder: string,
  resourceType: TResourceType = "image"
): Promise<TCloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    if (!file?.buffer) {
      reject(new AppError(400, "No file buffer found — ensure multer memory storage is used"));
      return;
    }

    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          console.error("[Cloudinary Upload Error]", error);
          reject(new AppError(500, "Image upload failed"));
          return;
        }

        if (!result) {
          console.error("[Cloudinary Upload Error] No result returned");
          reject(new AppError(500, "Image upload failed"));
          return;
        }

        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );

    stream.end(file.buffer);
  });
};

export const destroyCloudinaryAsset = async (publicId: string): Promise<void> => {
  if (!publicId?.trim()) {
    console.warn("[Cloudinary Destroy] Skipped — empty publicId provided");
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result !== "ok" && result.result !== "not found") {
      console.warn(`[Cloudinary Destroy] Unexpected result for "${publicId}":`, result.result);
    }
  } catch (error) {
    console.error(`[Cloudinary Destroy Error] publicId: "${publicId}"`, error);
  }
};