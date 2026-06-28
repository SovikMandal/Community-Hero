// Cloudinary upload/delete helpers. Streams in-memory buffers (from multer)
// directly to Cloudinary.
import cloudinary, { isCloudinaryConfigured } from "../config/cloudinary.js";

const FOLDER = "community-hero/issues";
const AVATAR_FOLDER = "community-hero/avatars";

/**
 * Uploads a single in-memory file buffer to Cloudinary.
 * @param {object} file - multer file ({ buffer, mimetype }).
 * @param {{ folder?: string }} [opts]
 * @returns {Promise<{url: string, publicId: string, isVideo: boolean}>}
 */
export function uploadBuffer(file, { folder = FOLDER } = {}) {
  if (!isCloudinaryConfigured) {
    return Promise.reject(new Error("Cloudinary is not configured"));
  }

  const isVideo = file.mimetype.startsWith("video/");

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: isVideo ? "video" : "image" },
      (error, result) => {
        if (error) return reject(error);
        resolve({ url: result.secure_url, publicId: result.public_id, isVideo });
      }
    );
    stream.end(file.buffer);
  });
}

/**
 * Uploads a profile photo to the avatars folder, applying a square,
 * face-centred transformation for consistent display.
 * @returns {Promise<{url: string, publicId: string}>}
 */
export async function uploadAvatar(file) {
  const { url, publicId } = await uploadBuffer(file, { folder: AVATAR_FOLDER });
  return { url, publicId };
}

/** Uploads multiple files. Returns an array of upload results. */
export async function uploadMany(files = []) {
  return Promise.all(files.map((f) => uploadBuffer(f)));
}

/** Deletes an asset by its Cloudinary public_id. */
export async function deleteAsset(publicId, { isVideo = false } = {}) {
  if (!isCloudinaryConfigured) return;
  await cloudinary.uploader.destroy(publicId, {
    resource_type: isVideo ? "video" : "image",
  });
}

export { isCloudinaryConfigured };
