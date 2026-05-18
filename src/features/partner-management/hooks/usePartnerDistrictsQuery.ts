import { useQuery } from "@tanstack/react-query";
import { getAllPartnerDistricts } from "../services";

export const usePartnerDistrictsQuery = (
  stateId?: string,
  enabled: boolean = true,
) => {
  return useQuery({
    queryKey: ["partner-districts", stateId],
    queryFn: () => getAllPartnerDistricts(stateId),
    enabled,
  });
};
