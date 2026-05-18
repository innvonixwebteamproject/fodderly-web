/**
 * Extract storage path from file path
 * @param filePath - Full file path (e.g., "/home/.../uploads/user-profile/filename.png")
 * @returns Storage path segment (e.g., "/user-profile")
 */
export const getStoragePath = (filePath: string): string => {
  const parts = filePath.split("/uploads/");
  if (parts.length > 1) {
    const afterUploads = parts[1];
    const pathSegments = afterUploads.split("/");
    return `/${pathSegments[0]}`;
  }
  return "";
};

/**
 * Build complete storage URL for user attachments
 * @param filePath - File path from attachment
 * @param fileName - File name from attachment
 * @param storagePath - Base storage path from config
 * @returns Complete URL for the file
 */
export const buildStorageUrl = (
  filePath: string,
  fileName: string,
  storagePath: string
): string => {
  const path = getStoragePath(filePath);
  return `${storagePath}${path}/${fileName}`;
};
