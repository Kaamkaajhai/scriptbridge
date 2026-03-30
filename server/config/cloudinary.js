import { v2 as cloudinary } from "cloudinary";

let isCloudinaryConfigured = false;

const ensureCloudinaryConfigured = () => {
  if (isCloudinaryConfigured) return true;

  const hasCloudinaryConfig = Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );

  if (!hasCloudinaryConfig) {
    return false;
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isCloudinaryConfigured = true;
  return true;
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

export const uploadToCloudinary = async (buffer, options = {}) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("uploadToCloudinary expects a file buffer");
  }

  if (!ensureCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.");
  }

  return uploadToCloudinaryRemote(buffer, options);
};
