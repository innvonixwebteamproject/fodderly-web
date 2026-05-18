import { api } from "@/lib/axios.interceptors";
import { ClientSchemaType, IClient } from "../types";

export interface MasterMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface ClientApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IClient[];
  meta: MasterMeta;
  timestamp: string;
}

export interface ClientMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IClient;
  timestamp: string;
}

/**
 * Fetch clients with pagination support
 */
export const getClients = async (
  page: number = 1,
  limit: number = 10,
  search?: string,
  id?: string,
): Promise<ClientApiResponse> => {
  try {
    const config: { params: Record<string, string | number> } = {
      params: { page, limit },
    };

    if (search && search.trim()) {
      config.params.search = search;
    }

    if (id) {
      config.params.client_id = id;
    }

    const response = await api.get<ClientApiResponse>("/clients", config);
    const responseData = response.data;

    let clients: IClient[] = [];
    let meta: MasterMeta;

    // Structure 1: Nested { data: { data: [], meta: {} } }
    if (
      responseData.data &&
      !Array.isArray(responseData.data) &&
      "data" in responseData.data
    ) {
      clients = responseData.data || [];
      meta = responseData.meta || {
        page,
        limit,
        total: clients.length,
        totalPages: Math.ceil(clients.length / limit),
        hasNextPage: false,
        hasPreviousPage: page > 1,
      };
    }
    // Structure 2: Flat { data: [], meta: {} }
    else if (Array.isArray(responseData.data)) {
      clients = responseData.data;
      meta = responseData.meta || {
        page,
        limit,
        total: clients.length,
        totalPages: Math.ceil(clients.length / limit),
        hasNextPage: false,
        hasPreviousPage: page > 1,
      };
    }
    // Fallback
    else {
      clients = [];
      meta = {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: page > 1,
      };
    }

    return {
      success: responseData.success ?? true,
      statusCode: responseData.statusCode ?? 200,
      message: responseData.message ?? "Success",
      data: clients,
      meta: meta,
      timestamp: responseData.timestamp ?? new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching clients:", error);
    return {
      success: false,
      statusCode: 500,
      message: "Error fetching clients",
      data: [],
      meta: {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false,
      },
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Create a new client
 * @param data Client data from form
 * @returns Promise with created client
 * @throws Error if API call fails
 */
export const createClient = async (
  data: ClientSchemaType,
): Promise<ClientMutationResponse> => {
  try {
    const response = await api.post<ClientMutationResponse>("/clients", data);
    return response.data;
  } catch (error) {
    console.error("Error creating client:", error);
    throw error;
  }
};

/**
 * Update an existing client
 * @param id Client ID
 * @param data Updated client data
 * @returns Promise with updated client
 * @throws Error if API call fails
 */
export const updateClient = async (
  id: string,
  data: ClientSchemaType,
): Promise<ClientMutationResponse> => {
  try {
    const response = await api.patch<ClientMutationResponse>(
      `/clients/${id}`,
      data,
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating client ${id}:`, error);
    throw error;
  }
};

/**
 * Update client status (active/inactive)
 * @param id Client ID
 * @param isActive New status
 * @returns Promise with updated client
 * @throws Error if API call fails
 */
export const updateClientStatus = async (
  id: string,
  is_active: boolean,
): Promise<ClientMutationResponse> => {
  try {
    const response = await api.patch<ClientMutationResponse>(
      `/clients/${id}/status`,
      { is_active },
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating client status ${id}:`, error);
    throw error;
  }
};

export interface IPlant {
  id: string;
  plant_name: string;
  city: string;
  plant_location?: string | null;
}

export interface PlantsApiResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IPlant[];
  timestamp: string;
}

/**
 * GET /clients/:clientId/plants
 * Fetch plants for a client (used in report filters, etc.).
 * Returns empty array on error or when client not found.
 */
export const getPlantsByClientId = async (
  clientId: string,
): Promise<IPlant[]> => {
  try {
    const response = await api.get<IPlant[] | PlantsApiResponse>(`/clients/${clientId}/plants`);
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && "data" in data && Array.isArray((data as PlantsApiResponse).data)) {
      return (data as PlantsApiResponse).data;
    }
    return [];
  } catch (error) {
    console.error(`Error fetching plants for client ${clientId}:`, error);
    return [];
  }
};
