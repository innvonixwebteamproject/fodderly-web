import { api } from "@/lib/axios.interceptors";
import { DashboardApiResponse } from "../types";

export const getDashboardData = async (): Promise<DashboardApiResponse> => {
  try {
    const response = await api.get<DashboardApiResponse>("/dashboard");
    return response.data;
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};
