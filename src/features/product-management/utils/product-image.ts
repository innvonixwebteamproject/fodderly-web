import type { ProductImage } from "../types";

export const PRODUCT_NO_IMAGE_PLACEHOLDER =
  "https://placehold.co/600x600/e2e8f0/94a3b8?text=No+Image";
const PRODUCT_IMAGE_S3_BASE_URL = "https://fodderly-web.s3.ap-south-1.amazonaws.com";

export const normalizeProductImageUrl = (imagePath?: string | null): string => {
  if (!imagePath) return "";
  const trimmedPath = imagePath.trim();
  if (!trimmedPath) return "";

  if (/^https?:\/\//i.test(trimmedPath)) return trimmedPath;

  const normalizedPath = trimmedPath.startsWith("/") ? trimmedPath.slice(1) : trimmedPath;
  if (
    normalizedPath.startsWith("fodderly_app_dev/") ||
    normalizedPath.startsWith("uploads/")
  ) {
    return `${PRODUCT_IMAGE_S3_BASE_URL}/${normalizedPath}`;
  }

  const uploadsIndex = trimmedPath.indexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return trimmedPath.slice(uploadsIndex);
  }

  return trimmedPath.startsWith("/") ? trimmedPath : `/${trimmedPath}`;
};

export const getPrimaryProductImageUrl = (images?: ProductImage[] | null): string => {
  const primaryPath = images?.find((image) => image?.image_path?.trim())?.image_path;
  return normalizeProductImageUrl(primaryPath);
};
