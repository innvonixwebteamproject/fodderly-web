import { useInfiniteQuery } from "@tanstack/react-query";
import { getPartners } from "../services";
import type { PartnerSortBy, PartnerSortOrder } from "../services/partner.api";

const PARTNERS_PAGE_LIMIT = 10;

export const usePartnersInfiniteQuery = (
  search?: string,
  status?: "active" | "inactive",
  districtId?: string,
  sortBy?: PartnerSortBy,
  sortOrder?: PartnerSortOrder,
) => {
  return useInfiniteQuery({
    queryKey: ["partners", "infinite", search, status, districtId, sortBy, sortOrder],
    queryFn: async ({ pageParam = 1 }) => {
      return getPartners(
        pageParam as number,
        PARTNERS_PAGE_LIMIT,
        search,
        status,
        districtId,
        sortBy,
        sortOrder,
      );
    },
    getNextPageParam: (lastPage) => {
      const { hasNextPage, page } = lastPage.meta;
      return hasNextPage ? page + 1 : undefined;
    },
    initialPageParam: 1,
    enabled: true,
  });
};
