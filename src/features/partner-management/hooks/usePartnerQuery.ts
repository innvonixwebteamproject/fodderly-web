import { useQuery } from "@tanstack/react-query";
import { getPartnerById } from "../services";

export const usePartnerQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ["partners", id],
    queryFn: () => (id ? getPartnerById(id) : null),
    enabled: !!id,
  });
};
