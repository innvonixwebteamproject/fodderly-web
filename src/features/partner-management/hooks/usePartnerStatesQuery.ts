import { useQuery } from "@tanstack/react-query";
import { getAllPartnerStates } from "../services";

export const usePartnerStatesQuery = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ["partner-states"],
    queryFn: () => getAllPartnerStates(),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
};
