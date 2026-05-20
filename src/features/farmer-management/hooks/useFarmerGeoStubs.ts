import { useQuery } from "@tanstack/react-query";
import { getFoddermenOptions, getAllTalukas, getAllVillages } from "../services";
import type { FarmerSelectOption } from "../types/farmer.types";

/** Geographic filters for `/fodderman` options (farmer form, list filters, assign modal). */
export type FoddermanOptionsFilters = {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
};

export function useTalukaOptionsQuery(districtId: string | undefined): {
  data: FarmerSelectOption[];
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ["farmer-talukas", districtId ?? ""],
    queryFn: () => getAllTalukas({ districtId }),
    enabled: Boolean(districtId),
  });

  return {
    data:
      query.data?.data.map((taluka) => ({
        value: taluka.id,
        label: taluka.name || "-",
      })) ?? [],
    isLoading: query.isLoading,
  };
}

export function useVillageOptionsQuery(
  talukaId: string | undefined,
  districtId?: string,
  stateId?: string,
): {
  data: FarmerSelectOption[];
  isLoading: boolean;
} {
  const query = useQuery({
    queryKey: ["farmer-villages", talukaId ?? "", districtId ?? "", stateId ?? ""],
    queryFn: () => getAllVillages({ talukaId, districtId, stateId }),
    enabled: Boolean(talukaId),
  });

  return {
    data:
      query.data?.data.map((village) => ({
        value: village.id,
        label: village.name || "-",
      })) ?? [],
    isLoading: query.isLoading,
  };
}

export function useFoddermanOptionsQuery(
  filters?: FoddermanOptionsFilters,
  queryOptions?: { enabled?: boolean },
): {
  data: FarmerSelectOption[];
  isLoading: boolean;
} {
  const stateId = filters?.stateId?.trim();
  const districtId = filters?.districtId?.trim();
  const talukaId = filters?.talukaId?.trim();
  const villageId = filters?.villageId?.trim();
  const enabled = queryOptions?.enabled !== false;

  const query = useQuery({
    queryKey: ["farmer-foddermen", stateId ?? "", districtId ?? "", talukaId ?? "", villageId ?? ""],
    queryFn: () =>
      getFoddermenOptions({
        page: 1,
        limit: 100,
        stateId,
        districtId,
        talukaId,
        villageId,
        isActive: true,
      }),
    enabled,
  });

  return {
    data:
      query.data?.data.map((fodderman) => ({
        value: fodderman.id,
        label: fodderman.mobileNumber
          ? `${fodderman.fullName} (${fodderman.mobileNumber})`
          : fodderman.fullName,
      })) ?? [],
    isLoading: query.isLoading,
  };
}
