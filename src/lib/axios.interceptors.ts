import { API_VERSION, BASE_URL, STORAGE_KEYS, SUBFIX } from "@/config/constant";
import { ApiError } from "@/lib/api-error";
import axios, { AxiosInstance, InternalAxiosRequestConfig } from "axios";

const API_TIME_OUT = 60000;
// Main axios instance
export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL + SUBFIX + API_VERSION,
  timeout: API_TIME_OUT,
});

// Refresh axios instance
const refreshApi: AxiosInstance = axios.create({
  baseURL: BASE_URL + SUBFIX + API_VERSION,
  timeout: API_TIME_OUT,
  headers: {
    "Content-Type": "application/json",
    "X-Requested-With": "XMLHttpRequest",
  },
});

// Refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const isPublicAuthUrl = (url?: string) =>
  url?.includes("/auth/login") ||
  url?.includes("/auth/refresh") ||
  url?.includes("/auth/forgot-password") ||
  url?.includes("/auth/reset-password") ||
  url?.includes("/auth/check-reset-link");

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const handleGlobalLogout = () => {
  // Clear all auth-related storage
  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("auth.expiresIn");
  localStorage.removeItem("auth.tokenType");
  localStorage.removeItem("auth.role");
  localStorage.removeItem("auth.forcePasswordChange");
  localStorage.removeItem("auth.isActive");
  localStorage.removeItem("auth.isAuthenticated");
  localStorage.removeItem("auth.userEmail");
  localStorage.removeItem("auth.userName");
  localStorage.removeItem("auth.userId");

  window.location.href = "/login";
};

const requestNewAccessToken = async (): Promise<{
  accessToken: string;
  refreshToken: string;
}> => {
  const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

  if (!refreshToken) {
    throw new Error("Refresh token missing");
  }

  const res = await refreshApi.post(
    "/auth/refresh",
    { refreshToken },
    {
      headers: {
        Authorization: `Bearer ${refreshToken}`,
      },
    },
  );

  const responseData = res.data?.data || res.data || {};
  const accessToken = responseData.accessToken;
  const nextRefreshToken = responseData.refreshToken || refreshToken;

  if (!accessToken) {
    throw new Error("Access token missing in refresh response");
  }

  const { updateTokens } = (
    await import("../features/auth/store/auth.store")
  ).useAuthStore.getState();
  updateTokens(accessToken, nextRefreshToken);

  return {
    accessToken,
    refreshToken: nextRefreshToken,
  };
};

// --- REQUEST INTERCEPTOR ---
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    config.headers = config.headers ?? {};
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else if (!accessToken && refreshToken && !isPublicAuthUrl(config.url)) {
      // Try refreshing before protected requests when access token is absent.
      if (isRefreshing) {
        const token = await new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        isRefreshing = true;
        try {
          const { accessToken: refreshedAccessToken } = await requestNewAccessToken();
          processQueue(null, refreshedAccessToken);
          config.headers.Authorization = `Bearer ${refreshedAccessToken}`;
        } catch (error) {
          processQueue(error, null);
          handleGlobalLogout();
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      }
    }

    if (!config.headers["Content-Type"] && !(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }
    config.headers["X-Requested-With"] = "XMLHttpRequest";

    return config;
  },
  (error) => Promise.reject(error),
);

// --- RESPONSE INTERCEPTOR ---
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (originalRequest) {
      originalRequest.headers = originalRequest.headers ?? {};
    }

    if (error.code === "ERR_CANCELED") {
      return Promise.reject(error);
    }

    if (error.response) {
      const { status, data } = error.response;

      // Handle 401 Unauthorized for most requests (EXCEPT login and refresh itself)
      if (status === 401 && !originalRequest._retry) {
        const isPublicAuthRequest = isPublicAuthUrl(originalRequest.url);

        if (isPublicAuthRequest) {
          return Promise.reject(
            new ApiError(data?.message || `Auth Error ${status}`, status, data),
          );
        }

        // If a refresh is already in progress, queue this request
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { accessToken } = await requestNewAccessToken();

          processQueue(null, accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        } catch (refreshError: unknown) {
          processQueue(refreshError, null);
          handleGlobalLogout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      // Convert standard HTTP error to ApiError
      const customError = new ApiError(
        data?.message || `HTTP Error ${status}`,
        status,
        data,
        false,
      );
      return Promise.reject(customError);
    } else if (error.request) {
      return Promise.reject(
        new ApiError(
          error?.message ?? "Network error - check your connection",
          0,
          undefined,
          true,
        ),
      );
    }

    return Promise.reject(error);
  },
);
