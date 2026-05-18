import { api } from "@/lib/axios.interceptors";
import { ContactUsRequest } from "../types/contact.types";

/**
 * Public API Service
 *
 * Handles all public/unauthenticated API calls
 */
export const publicApi = {
  /**
   * Submit a contact us inquiry
   * @param payload - Contact details (name, email, phone, subject, message)
   * @returns Success message
   */
  submitContactInquiry: async (
    payload: ContactUsRequest,
  ): Promise<{ message: string }> => {
    const response = await api.post<{ message: string }>(
      "/mail/contact-us",
      payload,
    );
    return response.data;
  },
};
