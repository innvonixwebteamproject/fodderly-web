import { useInfiniteQuery } from "@tanstack/react-query";
import { getPartners } from "@/features/partner-management/services/partner.api";

export const usePartnersInfiniteQuery = (search?: string,limit: number = 10) => {
  return useInfiniteQuery({
    queryKey: ["partners-infinite", search],
    queryFn: ({ pageParam = 1 }) => getPartners(pageParam, limit, search),
    getNextPageParam: (lastPage, allPages) => {
      const hasMore = lastPage.meta.page < lastPage.meta.totalPages;
      return hasMore ? allPages.length + 1 : undefined;
    },
    initialPageParam: 1,
  });
};
