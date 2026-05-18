import 'axios';

declare module 'axios' {
  // 👇 Extend AxiosRequestConfig for custom fields
  export interface AxiosRequestConfig {
    excludeCompanyId?: boolean;
  }
}
