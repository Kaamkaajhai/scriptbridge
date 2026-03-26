import { v2 as cloudinary } from "cloudinary";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "..", "uploads");
const isServerlessRuntime = process.env.VERCEL === "1" || process.env.VERCEL === "true";

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const detectExtension = (buffer, resourceType) => {
  if (!buffer || buffer.length < 12) {
    return resourceType === "image" ? ".jpg" : ".bin";
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return ".jpg";
  }

  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return ".png";
  }

  if (
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return ".gif";
  }

  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return ".webp";
  }

  return resourceType === "image" ? ".jpg" : ".bin";
};

const detectExtensionFromMeta = (options = {}) => {
  const originalExtension = path.extname(options.originalFilename || "").toLowerCase();
  if (originalExtension) {
    return originalExtension;
  }

  if (options.mimeType === "application/pdf") return ".pdf";
  if (options.mimeType === "text/plain") return ".txt";
  if (options.mimeType === "text/csv") return ".csv";
  if (options.resource_type === "video") return ".mp4";

  return detectExtension(null, options.resource_type);
};

const uploadToCloudinaryRemote = async (buffer, options = {}) => {
  const uploadOptions = {
    folder: options.folder || "scriptbridge/misc",
    resource_type: options.resource_type || "auto",
  };

  if (options.public_id) {
    uploadOptions.public_id = options.public_id;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    });

    stream.end(buffer);
  });
};

const uploadToLocalFallback = async (buffer, options = {}) => {
  const folderName = options.folder?.split("/").filter(Boolean).at(-1) || "misc";
  const targetDir = path.join(uploadsRoot, folderName);
  const extension = detectExtensionFromMeta(options);
  const baseName = (options.public_id || `upload-${Date.now()}`)
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-");
  const fileName = `${baseName}${extension}`;
  const filePath = path.join(targetDir, fileName);

  await mkdir(targetDir, { recursive: true });
  await writeFile(filePath, buffer);

  return {
    secure_url: `/uploads/${folderName}/${fileName}`,
    public_id: `${folderName}/${baseName}`,
  };
};

export const uploadToCloudinary = async (buffer, options = {}) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("uploadToCloudinary expects a file buffer");
  }

  if (hasCloudinaryConfig) {
    return uploadToCloudinaryRemote(buffer, options);
  }

  if (isServerlessRuntime) {
    throw new Error("File storage is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  return uploadToLocalFallback(buffer, options);
};
