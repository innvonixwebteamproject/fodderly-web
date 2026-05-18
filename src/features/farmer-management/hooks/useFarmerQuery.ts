import { useQuery } from "@tanstack/react-query";
import { getFarmerById } from "../services";

export const useFarmerQuery = (id: string | undefined) => {
  return useQuery({
    queryKey: ["farmers", id],
    queryFn: () => getFarmerById(id!),
    enabled: Boolean(id),
  });
};
