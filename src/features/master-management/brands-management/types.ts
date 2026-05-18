export interface BrandItem {
  id: string;
  brand_name: string;
  logo_url?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

export interface BrandListResponse {
  success: boolean;
  data: BrandItem[];
  message?: string;
}
