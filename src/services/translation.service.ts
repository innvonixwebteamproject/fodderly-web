import { ENV } from "@/config/env";
import axios, { AxiosError, type AxiosInstance } from "axios";

const BHASHINI_PROVIDER = "bhashini";
const TRANSLATION_TIMEOUT = 30000;

export type LanguageCode = "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";

const TRANSLATION_LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  hi: "Hindi",
  gu: "Gujarati",
  mr: "Marathi",
  te: "Telugu",
  pa: "Punjabi",
  ml: "Malayalam",
};

type TranslateTextParams = {
  text: string;
  sourceLanguage?: LanguageCode;
  targetLanguage: LanguageCode;
};

type NormalizedTranslateParams = Required<TranslateTextParams>;

type BhashiniTranslateRequest = {
  inputText: string;
  inputLanguage: string;
  outputLanguage: string;
};

const decodeHtmlEntities = (value: string) => {
  if (typeof document === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

const getBhashiniBaseUrl = () => ENV.TRANSLATION_API_BASE_URL.replace(/\/$/, "");

const getBhashiniTranslatePath = () => `/${ENV.TRANSLATION_API_VERSION}/translate`;

const bhashiniApi: AxiosInstance = axios.create({
  baseURL: getBhashiniBaseUrl(),
  timeout: TRANSLATION_TIMEOUT,
  headers: {
    Accept: "text/plain",
    "Content-Type": "application/json",
  },
});

bhashiniApi.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};
  config.headers.Accept = "text/plain";
  config.headers["Content-Type"] = "application/json";

  if (ENV.TRANSLATION_API_KEY) {
    config.headers["X-API-KEY"] = ENV.TRANSLATION_API_KEY;
  }

  return config;
});

const getTranslationProvider = () => ENV.TRANSLATION_PROVIDER.toLowerCase();

const buildBhashiniTranslatePayload = ({
  text,
  sourceLanguage = "en",
  targetLanguage,
}: NormalizedTranslateParams): BhashiniTranslateRequest => ({
  inputText: text,
  inputLanguage: TRANSLATION_LANGUAGE_NAMES[sourceLanguage],
  outputLanguage: TRANSLATION_LANGUAGE_NAMES[targetLanguage],
});

const parseBhashiniTranslateResponse = (responseText: string) => {
  const translatedText = String(responseText || "").trim();

  if (!translatedText) {
    throw new Error("Translation response was empty.");
  }

  return translatedText;
};

const translateWithBhashini = async (
  params: NormalizedTranslateParams,
): Promise<string> => {
  try {
    const response = await bhashiniApi.post<string>(
      getBhashiniTranslatePath(),
      buildBhashiniTranslatePayload(params),
      {
        responseType: "text",
      },
    );

    return parseBhashiniTranslateResponse(response.data);
  } catch (error) {
    if (error instanceof AxiosError && !error.response) {
      throw new Error(
        "Translation request failed. If this is a browser CORS error, route translation through the backend proxy.",
      );
    }

    throw new Error("Translation service is unavailable.");
  }
};

export const translateText = async ({
  text,
  sourceLanguage = "en",
  targetLanguage,
}: TranslateTextParams): Promise<string> => {
  const normalizedText = text.trim();

  if (!normalizedText || sourceLanguage === targetLanguage) {
    return normalizedText;
  }

  if (getTranslationProvider() !== BHASHINI_PROVIDER) {
    throw new Error("Only Bhashini translation provider is supported.");
  }

  const translationParams: NormalizedTranslateParams = {
    text: normalizedText,
    sourceLanguage,
    targetLanguage,
  };

  return translateWithBhashini(translationParams);
};

export const translateEnglishText = async (
  text: string,
  targetLanguage: LanguageCode,
): Promise<string> => {
  const translatedText = await translateText({
    text,
    sourceLanguage: "en",
    targetLanguage,
  });

  return decodeHtmlEntities(translatedText);
};
