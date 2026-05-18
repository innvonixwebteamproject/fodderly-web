import { useQuery } from "@tanstack/react-query";
import { getPartners } from "../services";
import type { PartnerSortBy, PartnerSortOrder } from "../services/partner.api";

export const usePartnersQuery = (
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: "active" | "inactive",
  districtId?: string,
  sortBy?: PartnerSortBy,
  sortOrder?: PartnerSortOrder,
  /** React Query options only — do not confuse with `sortOrder` (sort direction). */
  options?: { enabled?: boolean },
) => {
  return useQuery({
    queryKey: ["partners", page, limit, search, status, districtId, sortBy, sortOrder],
    queryFn: () => getPartners(page, limit, search, status, districtId, sortBy, sortOrder),
    enabled: options?.enabled !== false,
  });
};
