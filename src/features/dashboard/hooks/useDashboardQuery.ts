import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "../services/dashboard.api";

export const useDashboardQuery = () => {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
  });
};
