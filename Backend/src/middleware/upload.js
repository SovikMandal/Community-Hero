// Multer upload middleware. Uses in-memory storage so files can be streamed
// straight to Cloudinary (no local disk writes).
import multer from "multer";
import ApiError from "../utils/ApiError.js";

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB
const ALLOWED_MIME = /^(image\/(jpeg|png|jpg|webp|heic)|video\/(mp4|quicktime|webm))$/;

const storage = multer.memoryStorage();

function fileFilter(_req, file, cb) {
  if (ALLOWED_MIME.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(ApiError.badRequest(`Unsupported file type: ${file.mimetype}`));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

// Accept up to 5 images/videos under the "images" field.
export const uploadIssueMedia = upload.array("images", 5);

// Single profile photo under the "avatar" field.
export const uploadAvatarImage = upload.single("avatar");

// Audio upload for voice reporting (Feature 11).
export const uploadAudio = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
}).single("audio");
