import { api } from "@/lib/axios.interceptors";
import {
  IPartner,
  IPartnerDistrict,
  IPartnerState,
  PartnerSchemaType,
} from "../types";

export interface MasterMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PartnerApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IPartner[];
  meta: MasterMeta;
  timestamp: string;
}

export interface PartnerMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IPartner;
  timestamp: string;
}

export interface MasterDataResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T[];
  meta: MasterMeta;
  timestamp: string;
}

export type PartnerSortBy = "name" | "email" | "createdAt" | "status";
export type PartnerSortOrder = "ASC" | "DESC";

const MASTER_PAGE_LIMIT = 10;
const MAX_MASTER_AGGREGATION_PAGES = 100;

type RawPartner = Partial<IPartner> & {
  isActive?: boolean;
  forcePasswordChange?: boolean;
  districtIds?: string[];
  districts?: RawDistrict[];
  state?: RawState | null;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string | { value?: string } | null;
  mobileNumber?: string | { value?: string } | null;
  email?: string | { value?: string } | null;
  company?: {
    company_name?: string;
    company_type?: "pvt" | "llp" | "Pvt" | "LLP" | string;
    gst_number?: string;
    cin_number?: string;
    company_certificate?: string;
  } | null;
};

type TranslationMap = {
  en?: string;
  gu?: string;
  hi?: string;
  ml?: string;
  mr?: string;
  pa?: string;
  te?: string;
};

type RawState = Partial<IPartnerState> & {
  name?: LocalizedName;
  enName?: string;
  translations?: TranslationMap | null;
};

type RawDistrict = Partial<IPartnerDistrict> & {
  name?: LocalizedName;
  enName?: string;
  translations?: TranslationMap | null;
};

type LocalizedName =
  | string
  | {
      en?: string;
      value?: string;
    }
  | null
  | undefined;

type WrappedResponse<T> = {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: T | { data?: T; meta?: MasterMeta };
  meta?: MasterMeta;
  timestamp?: string;
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
    typeof value.value === "string"
  ) {
    return value.value;
  }

  return "";
};

const getEnglishName = (value: LocalizedName) => {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    if (typeof value.en === "string") {
      return value.en;
    }

    if (typeof value.value === "string") {
      return value.value;
    }
  }

  return "";
};

const getTranslatedEnglishName = (
  translations?: TranslationMap | null,
  fallback?: LocalizedName,
  enName?: string,
) => {
  if (enName?.trim()) {
    return enName.trim();
  }

  if (translations?.en) {
    return translations.en;
  }

  return getEnglishName(fallback);
};

const mapPartner = (partner: RawPartner): IPartner => {
  const districts = Array.isArray(partner.districts)
    ? partner.districts.map(mapDistrict)
    : [];

  const companyTypeRaw = (partner.company?.company_type || "").toString().trim().toLowerCase();
  const companyType: "pvt" | "llp" | undefined =
    companyTypeRaw === "llp" ? "llp" : companyTypeRaw === "pvt" ? "pvt" : undefined;

  return {
    id: partner.id || "",
    firstName: partner.firstName || "",
    lastName: partner.lastName || "",
    fullName:
      partner.fullName ||
      `${partner.firstName || ""} ${partner.lastName || ""}`.trim(),
    email: getPrimitiveString(partner.email),
    phone: getPrimitiveString(partner.phone) || getPrimitiveString(partner.mobileNumber),
    role: partner.role,
    isActive: Boolean(partner.isActive),
    forcePasswordChange: Boolean(partner.forcePasswordChange),
    districtIds: Array.isArray(partner.districtIds)
      ? partner.districtIds
      : districts.map((district) => district.id),
    districts,
    state: partner.state ? mapState(partner.state) : null,
    companyType,
    companyName: partner.company?.company_name || "",
    companyCertificate: partner.company?.company_certificate || "",
    gstNumber: partner.company?.gst_number || "",
    cinNumber: partner.company?.cin_number || "",
    createdAt: partner.createdAt,
    updatedAt: partner.updatedAt,
  };
};

const mapState = (state: RawState): IPartnerState => ({
  id: state.id || "",
  name: getTranslatedEnglishName(state.translations, state.name, state.enName),
  isActive: Boolean(state.isActive),
});

const mapDistrict = (district: RawDistrict): IPartnerDistrict => ({
  id: district.id || "",
  stateId: district.stateId || "",
  name: getTranslatedEnglishName(district.translations, district.name, district.enName),
  isActive: Boolean(district.isActive),
});

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
    return response.data.data as T;
  }

  return (response.data || {}) as T;
};

export const getPartners = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: "active" | "inactive",
  districtId?: string,
  sortBy?: PartnerSortBy,
  sortOrder?: PartnerSortOrder,
): Promise<PartnerApiResponse> => {
  const safeSortOrder: PartnerSortOrder | undefined =
    sortOrder === "ASC" || sortOrder === "DESC" ? sortOrder : undefined;

  const response = await api.get<WrappedResponse<RawPartner[]>>("/partners", {
    params: {
      page,
      limit,
      ...(search?.trim() ? { search: search.trim() } : {}),
      ...(districtId?.trim() ? { districtId } : {}),
      ...(status ? { status } : {}),
      ...(sortBy ? { sortBy } : {}),
      ...(safeSortOrder ? { sortOrder: safeSortOrder } : {}),
    },
  });

  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: items.map(mapPartner),
    meta,
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const getPartnerById = async (
  id: string,
): Promise<PartnerMutationResponse> => {
  const response = await api.get<WrappedResponse<RawPartner>>(`/partners/${id}`);
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: mapPartner(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const createPartner = async (
  data: PartnerSchemaType,
): Promise<PartnerMutationResponse> => {
  const formData = new FormData();
  formData.append("firstName", data.firstName);
  formData.append("lastName", data.lastName);
  formData.append("email", data.email);
  formData.append("phone", data.phone);
  formData.append("company_name", data.companyName);
  formData.append("company_type", data.companyType);
  formData.append("gst_number", data.gstNumber);
  formData.append("cin_number", data.cinNumber);
  data.districtIds.forEach((districtId) => formData.append("districtIds[]", districtId));
  if (data.companyCertificate instanceof File) {
    formData.append("company_certificate", data.companyCertificate);
  }

  const response = await api.post<WrappedResponse<RawPartner>>("/partners", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 201,
    message: responseData.message ?? "Partner created successfully and email sent.",
    data: mapPartner(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const updatePartner = async (
  id: string,
  data: PartnerSchemaType,
): Promise<PartnerMutationResponse> => {
  const formData = new FormData();
  formData.append("firstName", data.firstName);
  formData.append("lastName", data.lastName);
  formData.append("email", data.email);
  formData.append("phone", data.phone);
  formData.append("company_name", data.companyName);
  formData.append("company_type", data.companyType);
  formData.append("gst_number", data.gstNumber);
  formData.append("cin_number", data.cinNumber);
  data.districtIds.forEach((districtId) => formData.append("districtIds[]", districtId));
  if (data.companyCertificate instanceof File) {
    formData.append("company_certificate", data.companyCertificate);
  }

  const response = await api.patch<WrappedResponse<RawPartner>>(`/partners/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Partner profile updated successfully.",
    data: mapPartner(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const updatePartnerStatus = async (
  id: string,
): Promise<PartnerMutationResponse> => {
  const response = await api.patch<WrappedResponse<RawPartner>>(
    `/partners/${id}/status`,
  );
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Partner status updated successfully.",
    data: mapPartner(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const deletePartner = async (
  id: string,
): Promise<PartnerMutationResponse> => {
  const response = await api.delete<WrappedResponse<RawPartner>>(`/partners/${id}`);
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Partner deleted successfully.",
    data: mapPartner(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const resendPartnerEmail = async (
  id: string,
): Promise<PartnerMutationResponse> => {
  const response = await api.get<WrappedResponse<RawPartner>>(`/partners/${id}/send-creds`);
  const responseData = response.data;

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Credentials sent successfully.",
    data: mapPartner(unwrapItem(responseData)),
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const getPartnerStates = async (
  page: number = 1,
  limit: number = MASTER_PAGE_LIMIT,
): Promise<MasterDataResponse<IPartnerState>> => {
  const response = await api.get<WrappedResponse<RawState[]>>("/states", {
    params: {
      page,
      limit,
      sortBy: "name",
      sortOrder: "ASC",
    },
  });
  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: items.map(mapState),
    meta,
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const getAllPartnerStates = async (): Promise<MasterDataResponse<IPartnerState>> => {
  const pageSize = MASTER_PAGE_LIMIT;
  const firstPage = await getPartnerStates(1, pageSize);
  const allStates = [...firstPage.data];
  let meta = firstPage.meta;
  let page = 1;
  let guard = 0;

  while (meta.hasNextPage && guard < MAX_MASTER_AGGREGATION_PAGES) {
    guard += 1;
    page += 1;
    const response = await getPartnerStates(page, pageSize);
    allStates.push(...response.data);
    meta = response.meta;
  }

  return {
    ...firstPage,
    data: allStates,
    meta: {
      ...meta,
      page: 1,
      limit: pageSize,
      total: allStates.length,
      totalPages: Math.ceil(allStates.length / pageSize) || 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};

export const getPartnerDistricts = async (
  page: number = 1,
  limit: number = MASTER_PAGE_LIMIT,
  stateId?: string,
): Promise<MasterDataResponse<IPartnerDistrict>> => {
  const response = await api.get<WrappedResponse<RawDistrict[]>>("/districts", {
    params: {
      page,
      limit,
      sortBy: "name",
      sortOrder: "ASC",
      ...(stateId?.trim() ? { stateId } : {}),
    },
  });
  const responseData = response.data;
  const { items, meta } = unwrapCollection(responseData, page, limit);

  return {
    success: responseData.success ?? true,
    statusCode: responseData.statusCode ?? 200,
    message: responseData.message ?? "Success",
    data: items.map(mapDistrict),
    meta,
    timestamp: responseData.timestamp ?? new Date().toISOString(),
  };
};

export const getAllPartnerDistricts = async (
  stateId?: string,
): Promise<MasterDataResponse<IPartnerDistrict>> => {
  const pageSize = MASTER_PAGE_LIMIT;
  const firstPage = await getPartnerDistricts(1, pageSize, stateId);
  const allDistricts = [...firstPage.data];
  let meta = firstPage.meta;
  let page = 1;
  let guard = 0;

  while (meta.hasNextPage && guard < MAX_MASTER_AGGREGATION_PAGES) {
    guard += 1;
    page += 1;
    const response = await getPartnerDistricts(page, pageSize, stateId);
    allDistricts.push(...response.data);
    meta = response.meta;
  }

  return {
    ...firstPage,
    data: allDistricts,
    meta: {
      ...meta,
      page: 1,
      limit: pageSize,
      total: allDistricts.length,
      totalPages: Math.ceil(allDistricts.length / pageSize) || 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
};
