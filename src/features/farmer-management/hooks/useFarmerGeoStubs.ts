import { useQuery } from "@tanstack/react-query";
import { getFoddermenOptions, getAllTalukas, getAllVillages, getFarmers } from "../services";
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

/** Geographic filters for `/farmer` options (order list filters). */
export type FarmerOptionsFilters = {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
};

export function useFarmerOptionsQuery(
  filters?: FarmerOptionsFilters,
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
    queryKey: ["farmers-options", stateId ?? "", districtId ?? "", talukaId ?? "", villageId ?? ""],
    queryFn: () =>
      getFarmers(1, 100, undefined, {
        stateId,
        districtId,
        talukaId,
        villageId,
        status: "active",
      }),
    enabled,
  });

  return {
    data:
      query.data?.data.map((farmer) => ({
        value: farmer.id,
        label: farmer.mobile ? `${farmer.fullName} (${farmer.mobile})` : farmer.fullName,
      })) ?? [],
    isLoading: query.isLoading,
  };
}
