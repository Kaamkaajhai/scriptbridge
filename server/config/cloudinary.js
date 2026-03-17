import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "..", "uploads");

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

export const uploadToCloudinary = async (buffer, options = {}) => {
  if (!Buffer.isBuffer(buffer)) {
    throw new Error("uploadToCloudinary expects a file buffer");
  }

  const folderName = options.folder?.split("/").filter(Boolean).at(-1) || "misc";
  const targetDir = path.join(uploadsRoot, folderName);
  const extension = detectExtension(buffer, options.resource_type);
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
