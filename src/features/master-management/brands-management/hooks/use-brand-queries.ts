import { useQuery } from "@tanstack/react-query";
import { getBrands } from "../services/brand.api";

export const useBrandsQuery = () =>
  useQuery({
    queryKey: ["brands"],
    queryFn: () => getBrands(),
    staleTime: 30_000,
  });
