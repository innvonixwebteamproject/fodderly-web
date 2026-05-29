import { api } from "@/lib/axios.interceptors";
import {
  FoddermanSchemaType,
  IFodderman,
  IFoddermanFarmer,
  IFoddermanFilters,
  IFoddermanListMeta,
  IFoddermanListResponse,
  IFoddermanMutationPayload,
  IFoddermanMutationResponse,
} from "../types";

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: IFoddermanListMeta };
  meta?: IFoddermanListMeta;
  timestamp?: string;
};

const asWrappedResponse = <T>(response: WrappedResponse<T> | T): WrappedResponse<T> => {
  if (Array.isArray(response)) {
    return { data: response as T };
  }
  if (response && typeof response === "object" && "data" in (response as object)) {
    return response as WrappedResponse<T>;
  }
  return { data: response as T };
};

type TranslationMap = Partial<Record<"en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml", string>>;

const getPrimitiveString = (value: unknown) => {
  if (typeof value === "string") return value;
  if (
    value &&
    typeof value === "object" &&
    "value" in value &&
    typeof (value as { value?: string }).value === "string"
  ) {
    return (value as { value: string }).value;
  }
  return "";
};

type RawGeoName = {
  name?: string;
  enName?: string;
  translations?: TranslationMap | null;
};
type RawVillage = RawGeoName & { id?: string };
type RawPartner = {
  id?: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
};
type RawFarmer = {
  id?: string;
  name?: string;
  fullName?: string;
  mobile?: string;
  villageName?: string;
};
type RawFodderman = Partial<IFodderman> & {
  isActive?: boolean;
  status?: boolean;
  pincode?: string;
  total_allocated_villages?: number;
  allocated_villages?: string[];
  total_farmers?: number;
  partner?: RawPartner | null;
  farmers?: Array<RawFarmer | string>;
  state?: (RawGeoName & { id?: string }) | null;
  district?: (RawGeoName & { id?: string }) | null;
  taluka?: (RawGeoName & { id?: string }) | null;
  village?: RawVillage | null;
  villages?: Array<RawVillage | string>;
  villageAllocation?: string[];
  villageIds?: string[];
};

const getDisplayName = (item?: RawGeoName | null) =>
  item?.enName?.trim() ||
  item?.translations?.en?.trim() ||
  item?.name?.trim() ||
  "";

const getFallbackMeta = (page: number, limit: number, total: number): IFoddermanListMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const unwrapCollection = <T>(
  response: WrappedResponse<T[]>,
  page: number,
  limit: number,
): { items: T[]; meta: IFoddermanListMeta } => {
  if (Array.isArray(response.data)) {
    return {
      items: response.data,
      meta: response.meta || getFallbackMeta(page, limit, response.data.length),
    };
  }

  if (
    response.data &&
    typeof response.data === "object" &&
    "data" in response.data &&
    Array.isArray(response.data.data)
  ) {
    return {
      items: response.data.data,
      meta:
        response.data.meta ||
        response.meta ||
        getFallbackMeta(page, limit, response.data.data.length),
    };
  }

  return {
    items: [],
    meta: response.meta || getFallbackMeta(page, limit, 0),
  };
};

const unwrapItem = <T>(response: WrappedResponse<T>): T => {
  if (response.data && typeof response.data === "object" && "data" in response.data) {
    return response.data.data as T;
  }

  return (response.data || {}) as T;
};

const mapFodderman = (item: RawFodderman): IFodderman => {
  const villagesSource =
    item.villages && item.villages.length > 0 ? item.villages : (item.allocated_villages ?? []);
  const villages = villagesSource.map((village) =>
    typeof village === "string"
      ? { id: village, name: village }
      : { id: village.id || "", name: getDisplayName(village) },
  );
  const allocatedVillages = item.allocated_villages ?? villages.map((village) => village.name);
  const villageIdsFromObjects = villagesSource.flatMap((village) => {
    if (typeof village === "string" || !village.id) return [];
    return [village.id];
  });
  const villageIds =
    item.villageIds ||
    item.villageAllocation ||
    (item.village?.id ? [item.village.id] : undefined) ||
    villageIdsFromObjects;
  const firstName = item.firstName || "";
  const lastName = item.lastName || "";
  const isActive =
    typeof item.isActive === "boolean" ? item.isActive : Boolean(item.status);
  const totalAllocatedVillages =
    typeof item.total_allocated_villages === "number"
      ? item.total_allocated_villages
      : item.villageIds?.length || villages.length;

  const partnerName =
    item.partnerName ||
    item.partner?.name ||
    item.partner?.fullName ||
    `${item.partner?.firstName || ""} ${item.partner?.lastName || ""}`.trim() ||
    undefined;

  const farmersSource = item.farmers || [];
  const farmers: IFoddermanFarmer[] = farmersSource.map((farmer) =>
    typeof farmer === "string"
      ? { id: farmer, name: farmer }
      : {
          id: farmer.id || "",
          name: farmer.name || "",
          mobile: farmer.mobile,
          villageName: farmer.villageName,
        },
  );
  const totalAllocatedFarmers =
    typeof item.total_farmers === "number"
      ? item.total_farmers
      : farmers.length;

  return {
    id: item.id || "",
    firstName,
    lastName,
    fullName: item.fullName || `${firstName} ${lastName}`.trim(),
    email: getPrimitiveString(item.email),
    mobileNumber: getPrimitiveString(item.mobileNumber),
    languagePreference: item.languagePreference || "en",
    stateId: item.stateId || item.state?.id || "",
    stateName: getDisplayName(item.state) || item.stateName || "",
    districtId: item.districtId || item.district?.id || "",
    districtName: getDisplayName(item.district) || item.districtName || "",
    talukaId: item.talukaId || item.taluka?.id || "",
    talukaName: getDisplayName(item.taluka) || item.talukaName || "",
    pinCode: item.pinCode || item.pincode || "",
    partnerId: item.partnerId || item.partner?.id,
    partnerName,
    villageIds,
    villages,
    allocatedVillages,
    totalAllocatedVillages,
    farmers,
    totalAllocatedFarmers,
    isActive,
    status: isActive ? "ACTIVE" : "INACTIVE",
    createdAt: item.createdAt || "",
    updatedAt: item.updatedAt,
  };
};

const buildMutationPayload = (
  data: FoddermanSchemaType | Partial<FoddermanSchemaType>,
): Partial<IFoddermanMutationPayload> => {
  const payload: Partial<IFoddermanMutationPayload> = {};
  if (typeof data.firstName === "string") payload.firstName = data.firstName.trim();
  if (typeof data.lastName === "string") payload.lastName = data.lastName.trim();
  if (typeof data.email === "string" && data.email.trim()) payload.email = data.email.trim();
  if (typeof data.mobileNumber === "string") payload.mobileNumber = data.mobileNumber.trim();
  if (typeof data.languagePreference === "string")
    payload.languagePreference = data.languagePreference;
  if (typeof data.stateId === "string") payload.stateId = data.stateId;
  if (typeof data.districtId === "string") payload.districtId = data.districtId;
  if (typeof data.talukaId === "string") payload.talukaId = data.talukaId;
  if (typeof data.pinCode === "string") payload.pinCode = data.pinCode.trim();
  if (typeof data.partnerId === "string" && data.partnerId.trim()) payload.partnerId = data.partnerId;
  if (Array.isArray(data.villageIds)) payload.villageAllocation = data.villageIds;
  return payload;
};

export const foddermanApi = {
  getFoddermen: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    filters?: IFoddermanFilters;
  }): Promise<IFoddermanListResponse> => {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;
    const response = await api.get<WrappedResponse<RawFodderman[]>>("/fodderman", {
      params: {
        page,
        limit,
        ...(params?.search?.trim() ? { search: params.search.trim() } : {}),
        ...(params?.filters?.stateId?.trim()
          ? { stateId: params.filters.stateId.trim() }
          : {}),
        ...(params?.filters?.districtId?.trim()
          ? { districtId: params.filters.districtId.trim() }
          : {}),
        ...(params?.filters?.talukaId?.trim()
          ? { talukaId: params.filters.talukaId.trim() }
          : {}),
        ...(params?.filters?.partnerId?.trim()
          ? { partnerId: params.filters.partnerId.trim() }
          : {}),
        ...(params?.filters?.status
          ? { isActive: params.filters.status === "active" }
          : {}),
        ...(params?.filters?.sortBy ? { sortBy: params.filters.sortBy } : {}),
        ...(params?.filters?.sortOrder ? { sortOrder: params.filters.sortOrder } : {}),
      },
    });
    const responseData = asWrappedResponse<RawFodderman[]>(response.data as WrappedResponse<RawFodderman[]> | RawFodderman[]);
    const { items, meta } = unwrapCollection(responseData, page, limit);
    return {
      success: responseData.success ?? true,
      statusCode: responseData.statusCode ?? 200,
      message: responseData.message ?? "Success",
      data: items.map(mapFodderman),
      meta,
      timestamp: responseData.timestamp ?? new Date().toISOString(),
    };
  },

  getFoddermanById: async (id: string): Promise<IFoddermanMutationResponse> => {
    const response = await api.get<WrappedResponse<RawFodderman>>(`/fodderman/${id}`);
    const responseData = asWrappedResponse<RawFodderman>(response.data as WrappedResponse<RawFodderman> | RawFodderman);
    return {
      success: responseData.success ?? true,
      statusCode: responseData.statusCode ?? 200,
      message: responseData.message ?? "Success",
      data: mapFodderman(unwrapItem(responseData)),
      timestamp: responseData.timestamp ?? new Date().toISOString(),
    };
  },

  createFodderman: async (data: FoddermanSchemaType): Promise<IFoddermanMutationResponse> => {
    const response = await api.post<WrappedResponse<RawFodderman>>(
      "/fodderman",
      buildMutationPayload(data),
    );
    const responseData = asWrappedResponse<RawFodderman>(response.data as WrappedResponse<RawFodderman> | RawFodderman);
    return {
      success: responseData.success ?? true,
      statusCode: responseData.statusCode ?? 201,
      message: responseData.message ?? "Fodderman created successfully",
      data: mapFodderman(unwrapItem(responseData)),
      timestamp: responseData.timestamp ?? new Date().toISOString(),
    };
  },

  updateFodderman: async (
    id: string,
    data: Partial<FoddermanSchemaType>,
  ): Promise<IFoddermanMutationResponse> => {
    const response = await api.put<WrappedResponse<RawFodderman>>(
      `/fodderman/${id}`,
      buildMutationPayload(data),
    );
    const responseData = asWrappedResponse<RawFodderman>(response.data as WrappedResponse<RawFodderman> | RawFodderman);
    return {
      success: responseData.success ?? true,
      statusCode: responseData.statusCode ?? 200,
      message: responseData.message ?? "Fodderman updated successfully",
      data: mapFodderman(unwrapItem(responseData)),
      timestamp: responseData.timestamp ?? new Date().toISOString(),
    };
  },

  deleteFodderman: async (id: string) => {
    const response = await api.delete(`/fodderman/${id}`);
    return response.data;
  },

  toggleStatus: async (id: string, status: boolean) => {
    const response = await api.patch(`/fodderman/${id}/status`, {
      isActive: status,
    });
    return response.data;
  },
};
