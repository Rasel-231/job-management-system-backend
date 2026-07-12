import cloudinary from "../config/cloudinary";
import AppError from "./AppError";

export type TCloudinaryUploadResult = {
  url: string;
  publicId: string;
};

// Streams a Multer memory-buffer file straight to Cloudinary — no temp files
// written to disk, so this is safe on ephemeral/serverless filesystems.
export const uploadBufferToCloudinary = (
  file: Express.Multer.File,
  folder: string
): Promise<TCloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(new AppError(500, "Image upload failed"));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(file.buffer);
  });
};
