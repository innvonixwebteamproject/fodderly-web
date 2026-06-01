import { api } from "@/lib/axios.interceptors";
import type { FarmerFormSchemaType } from "../types/farmer.types";
import {
  FoddermanOptionRecord,
  IFarmer,
  TalukaRecord,
  VillageRecord,
} from "../types/farmer.types";

export interface MasterMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FarmerApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IFarmer[];
  meta: MasterMeta;
  timestamp: string;
}

export interface FarmerMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IFarmer;
  timestamp: string;
}

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: MasterMeta };
  meta?: MasterMeta;
  timestamp?: string;
};

type RawFarmer = {
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: unknown;
  languagePreference?: unknown;
  pincode?: unknown;
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: unknown;
  stateName?: string;
  districtName?: string;
  talukaName?: string;
  villageName?: unknown;
  foddermanId?: unknown;
  foddermanName?: unknown;
  foddermanPhone?: unknown;
  partnerId?: unknown;
  partnerName?: unknown;
  address?: unknown;
  isActive?: boolean;
  isDeleted?: boolean;
  isVerified?: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  state?: { id?: string; name?: string } | null;
  district?: { id?: string; name?: string } | null;
  taluka?: { id?: string; name?: string } | null;
  village?: { id?: string; name?: string } | null;
  fodderman?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    mobileNumber?: string;
  } | null;
  partner?: {
    id?: string;
    firstName?: string;
    lastName?: string;
    fullName?: string;
    name?: string;
  } | null;
};

const getFallbackMeta = (page: number, limit: number, total: number): MasterMeta => ({
  page,
  limit,
  total,
  totalPages: total > 0 ? Math.ceil(total / limit) : 0,
  hasNextPage: page * limit < total,
  hasPreviousPage: page > 1,
});

const getPrimitiveString = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

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

const mapRegistrationSource = (createdBy?: string): "SELF" | "ADMIN" => {
  const normalized = (createdBy || "").toLowerCase();
  if (normalized === "self") {
    return "SELF";
  }
  return "ADMIN";
};

export const mapFarmer = (raw: RawFarmer): IFarmer => {
  const firstName = raw.firstName || "";
  const lastName = raw.lastName || "";
  const fullName =
    raw.fullName?.trim() ||
    `${firstName} ${lastName}`.trim() ||
    getPrimitiveString(raw.phone);
  const mobile = getPrimitiveString(raw.phone);
  const villageId = getPrimitiveString(raw.villageId) || raw.village?.id || "";
  const pincode = getPrimitiveString(raw.pincode);
  const talukaId = raw.talukaId || "";
  const isActive = Boolean(raw.isActive);
  const partnerName =
    getPrimitiveString(raw.partnerName) ||
    raw.partner?.name ||
    raw.partner?.fullName ||
    `${raw.partner?.firstName || ""} ${raw.partner?.lastName || ""}`.trim() ||
    undefined;
  const foddermanName =
    getPrimitiveString(raw.foddermanName) ||
    raw.fodderman?.fullName ||
    `${raw.fodderman?.firstName || ""} ${raw.fodderman?.lastName || ""}`.trim() ||
    undefined;
  const languagePreference = (getPrimitiveString(raw.languagePreference) || "en") as
    | "en"
    | "hi"
    | "gu"
    | "mr"
    | "te"
    | "pa"
    | "ml";

  return {
    id: raw.id || "",
    firstName,
    lastName,
    fullName,
    mobile,
    phone: mobile,
    languagePreference,
    stateId: raw.stateId || raw.state?.id || "",
    districtId: raw.districtId || raw.district?.id || "",
    talukaId: talukaId || raw.taluka?.id || "",
    villageId,
    pincode,
    foddermanId: getPrimitiveString(raw.foddermanId) || raw.fodderman?.id || undefined,
    partnerId: getPrimitiveString(raw.partnerId) || raw.partner?.id || undefined,
    foddermanName,
    foddermanPhone: getPrimitiveString(raw.foddermanPhone) || raw.fodderman?.mobileNumber || undefined,
    partnerName,
    stateName: raw.stateName || raw.state?.name || "",
    districtName: raw.districtName || raw.district?.name || "",
    talukaName: raw.talukaName || raw.taluka?.name || "",
    villageName: getPrimitiveString(raw.villageName) || raw.village?.name || "",
    address: getPrimitiveString(raw.address) || undefined,
    isActive,
    status: isActive ? "ACTIVE" : "INACTIVE",
    registrationSource: mapRegistrationSource(raw.createdBy),
    createdAt: raw.createdAt || "",
    updatedAt: raw.updatedAt,
    isVerified: raw.isVerified,
    isDeleted: raw.isDeleted,
  };
};

const unwrapCollection = <T>(
  response: WrappedResponse<T[]>,
  page: number,
  limit: number,
): { items: T[]; meta: MasterMeta } => {
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
    return (response.data as { data: T }).data;
  }

  return (response.data || {}) as T;
};

export interface FarmerListFilters {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  foddermanId?: string;
  status?: "active" | "inactive";
  sortBy?: "fullName" | "mobile" | "createdAt";
  sortOrder?: "ASC" | "DESC";
}

type TranslationPayload = Partial<Record<"en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml", string>>;

type RawTaluka = {
  id?: string;
  districtId?: string;
  districtName?: string;
  stateId?: string;
  stateName?: string;
  name?: string;
  enName?: string;
  translations?: TranslationPayload;
  isActive?: boolean;
};

type RawVillage = {
  id?: string;
  talukaId?: string;
  talukaName?: string;
  districtId?: string;
  districtName?: string;
  stateId?: string;
  stateName?: string;
  name?: string;
  enName?: string;
  translations?: TranslationPayload;
  isActive?: boolean;
};

type RawFodderman = {
  id?: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  isActive?: boolean;
  districtId?: string;
  districtName?: string;
  talukaId?: string;
  talukaName?: string;
};

const getTranslatedName = (translations?: TranslationPayload): string => {
  if (!translations) return "";
  return (
    translations.en ||
    translations.hi ||
    translations.gu ||
    translations.mr ||
    translations.te ||
    translations.pa ||
    translations.ml ||
    ""
  );
};

const getEnglishGeoName = (item: { enName?: string; name?: string; translations?: TranslationPayload }): string =>
  item.enName?.trim() || getTranslatedName(item.translations) || item.name?.trim() || "";

export const getFarmers = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  filters?: FarmerListFilters,
): Promise<FarmerApiResponse> => {
  const response = await api.get<WrappedResponse<RawFarmer[]>>("/farmer", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(filters?.stateId?.trim() ? { stateId: filters.stateId.trim() } : {}),
      ...(filters?.districtId?.trim() ? { districtId: filters.districtId.trim() } : {}),
      ...(filters?.talukaId?.trim() ? { talukaId: filters.talukaId.trim() } : {}),
      ...(filters?.villageId?.trim() ? { villageId: filters.villageId.trim() } : {}),
      ...(filters?.foddermanId?.trim() ? { foddermanId: filters.foddermanId.trim() } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.sortBy ? { sortBy: filters.sortBy } : {}),
      ...(filters?.sortOrder ? { sortOrder: filters.sortOrder } : {}),
    },
  });

  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: items.map(mapFarmer),
    meta,
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const getTalukas = async (params: {
  page?: number;
  limit?: number;
  districtId?: string;
  stateId?: string;
  search?: string;
}): Promise<{ data: TalukaRecord[]; meta: MasterMeta; message: string }> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const response = await api.get<WrappedResponse<RawTaluka[]>>("/talukas", {
    params: {
      page,
      limit,
      sortBy: "name",
      sortOrder: "ASC",
      ...(params.districtId?.trim() ? { districtId: params.districtId.trim() } : {}),
      ...(params.stateId?.trim() ? { stateId: params.stateId.trim() } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });

  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);
  return {
    data: items.map((item) => ({
      id: item.id || "",
      districtId: item.districtId || "",
      districtName: item.districtName || "",
      stateId: item.stateId || "",
      stateName: item.stateName || "",
      name: getEnglishGeoName(item),
      isActive: Boolean(item.isActive),
    })),
    meta,
    message: responseData.message ?? "Success",
  };
};

export const getVillages = async (params: {
  page?: number;
  limit?: number;
  talukaId?: string;
  districtId?: string;
  stateId?: string;
  search?: string;
}): Promise<{ data: VillageRecord[]; meta: MasterMeta; message: string }> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const response = await api.get<WrappedResponse<RawVillage[]>>("/villages", {
    params: {
      page,
      limit,
      sortBy: "name",
      sortOrder: "ASC",
      ...(params.talukaId?.trim() ? { talukaId: params.talukaId.trim() } : {}),
      ...(params.districtId?.trim() ? { districtId: params.districtId.trim() } : {}),
      ...(params.stateId?.trim() ? { stateId: params.stateId.trim() } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
    },
  });

  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);
  return {
    data: items.map((item) => ({
      id: item.id || "",
      talukaId: item.talukaId || "",
      talukaName: item.talukaName || "",
      districtId: item.districtId || "",
      districtName: item.districtName || "",
      stateId: item.stateId || "",
      stateName: item.stateName || "",
      name: getEnglishGeoName(item),
      isActive: Boolean(item.isActive),
    })),
    meta,
    message: responseData.message ?? "Success",
  };
};

const GEO_FORM_PAGE_SIZE = 10;
const GEO_AGG_MAX_PAGES = 100;

export const getAllTalukas = async (params: {
  districtId?: string;
  stateId?: string;
  search?: string;
}): Promise<{ data: TalukaRecord[]; meta: MasterMeta; message: string }> => {
  const limit = GEO_FORM_PAGE_SIZE;
  const first = await getTalukas({ ...params, page: 1, limit });
  const all = [...first.data];
  let meta = first.meta;
  let page = 1;
  let guard = 0;

  while (meta.hasNextPage && guard < GEO_AGG_MAX_PAGES) {
    guard += 1;
    page += 1;
    const next = await getTalukas({ ...params, page, limit });
    all.push(...next.data);
    meta = next.meta;
  }

  return {
    data: all,
    meta: {
      ...meta,
      page: 1,
      limit,
      total: all.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: first.message,
  };
};

export const getAllVillages = async (params: {
  talukaId?: string;
  districtId?: string;
  stateId?: string;
  search?: string;
}): Promise<{ data: VillageRecord[]; meta: MasterMeta; message: string }> => {
  const limit = GEO_FORM_PAGE_SIZE;
  const first = await getVillages({ ...params, page: 1, limit });
  const all = [...first.data];
  let meta = first.meta;
  let page = 1;
  let guard = 0;

  while (meta.hasNextPage && guard < GEO_AGG_MAX_PAGES) {
    guard += 1;
    page += 1;
    const next = await getVillages({ ...params, page, limit });
    all.push(...next.data);
    meta = next.meta;
  }

  return {
    data: all,
    meta: {
      ...meta,
      page: 1,
      limit,
      total: all.length,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
    message: first.message,
  };
};

export const getFoddermenOptions = async (params: {
  page?: number;
  limit?: number;
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  villageId?: string;
  search?: string;
  isActive?: boolean;
}): Promise<{ data: FoddermanOptionRecord[]; meta: MasterMeta; message: string }> => {
  const page = params.page ?? 1;
  const limit = params.limit ?? 10;
  const response = await api.get<WrappedResponse<RawFodderman[]>>("/fodderman", {
    params: {
      page,
      limit,
      ...(params.stateId?.trim() ? { stateId: params.stateId.trim() } : {}),
      ...(params.districtId?.trim() ? { districtId: params.districtId.trim() } : {}),
      ...(params.talukaId?.trim() ? { talukaId: params.talukaId.trim() } : {}),
      ...(params.villageId?.trim() ? { villageId: params.villageId.trim() } : {}),
      ...(params.search?.trim() ? { search: params.search.trim() } : {}),
      ...(typeof params.isActive === "boolean" ? { isActive: params.isActive } : {}),
      sortBy: "createdAt",
      sortOrder: "DESC",
    },
  });

  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);
  // Only include foddermen that are mapped to a district and taluka
  const filteredItems = items.filter(
    (item) => (item.districtId || "").trim() !== "" && (item.talukaId || "").trim() !== "",
  );
  return {
    data: filteredItems.map((item) => {
      const firstName = item.firstName || "";
      const lastName = item.lastName || "";
      return {
        id: item.id || "",
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim() || "-",
        mobileNumber: item.mobileNumber || "",
        isActive: Boolean(item.isActive),
        districtId: item.districtId || "",
        districtName: item.districtName || "",
        talukaId: item.talukaId || "",
        talukaName: item.talukaName || "",
      };
    }),
    meta,
    message: responseData.message ?? "Success",
  };
};

export const getFarmerById = async (id: string): Promise<FarmerMutationResponse> => {
  const response = await api.get<WrappedResponse<RawFarmer>>(`/farmer/${id}`);
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: mapFarmer(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export type FarmerPatchPayload = Partial<{
  firstName: string;
  lastName: string;
  phone: string;
  languagePreference: "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";
  pincode: string;
  villageId: string;
  foddermanId: string;
  address: string;
}>;

export const createFarmer = async (
  data: FarmerFormSchemaType,
): Promise<FarmerMutationResponse> => {
  const response = await api.post<WrappedResponse<RawFarmer>>("/farmer", {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    languagePreference: data.languagePreference,
    pincode: data.pincode,
    villageId: data.villageId,
    ...(data.address?.trim() ? { address: data.address.trim() } : {}),
    ...(data.foddermanId?.trim() ? { foddermanId: data.foddermanId.trim() } : {}),
  });

  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 201,
    message:
      responseData.message ?? "Farmer profile successfully created and mapped.",
    data: mapFarmer(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const updateFarmer = async (
  id: string,
  data: FarmerFormSchemaType,
): Promise<FarmerMutationResponse> => {
  const response = await api.patch<WrappedResponse<RawFarmer>>(`/farmer/${id}`, {
    firstName: data.firstName,
    lastName: data.lastName,
    phone: data.phone,
    languagePreference: data.languagePreference,
    pincode: data.pincode,
    villageId: data.villageId,
    ...(data.address?.trim() ? { address: data.address.trim() } : {}),
    ...(data.foddermanId?.trim() ? { foddermanId: data.foddermanId.trim() } : {}),
  });

  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Farmer profile updated successfully.",
    data: mapFarmer(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

/** Partial PATCH for assign fodderman modal etc. */
export const patchFarmer = async (
  id: string,
  payload: FarmerPatchPayload,
): Promise<FarmerMutationResponse> => {
  const response = await api.patch<WrappedResponse<RawFarmer>>(`/farmer/${id}`, payload);
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Farmer updated successfully.",
    data: mapFarmer(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const toggleFarmerStatus = async (id: string): Promise<FarmerMutationResponse> => {
  const response = await api.patch<WrappedResponse<RawFarmer>>(`/farmer/${id}/status`);
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Farmer status updated successfully.",
    data: mapFarmer(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const deleteFarmer = async (
  id: string,
): Promise<{ success: boolean; message: string }> => {
  const response = await api.delete<
    WrappedResponse<{ message?: string }> | { message?: string }
  >(`/farmer/${id}`);
  const responseData = response.data as WrappedResponse<{ message?: string }>;
  if (
    responseData &&
    typeof responseData === "object" &&
    "data" in responseData &&
    responseData.data &&
    typeof responseData.data === "object" &&
    "message" in responseData.data
  ) {
    return {
      success: responseData.success ?? true,
      message: String((responseData.data as { message: string }).message),
    };
  }
  return {
    success: responseData?.success ?? true,
    message: responseData?.message ?? "Deleted successfully",
  };
};
