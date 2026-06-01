import { api } from "@/lib/axios.interceptors";

const TRANSLATION_ENDPOINT = "/auth/translate";

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

type TranslateRequest = {
  inputText: string;
  inputLanguage: string;
  outputLanguage: string;
};

type TranslateResponse = {
  success: boolean;
  statusCode: number;
  message: string;
  data?: {
    translatedText?: string;
  };
  timestamp?: string;
};

const decodeHtmlEntities = (value: string) => {
  if (typeof document === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};


const buildTranslatePayload = ({
  text,
  sourceLanguage = "en",
  targetLanguage,
}: NormalizedTranslateParams): TranslateRequest => ({
  inputText: text,
  inputLanguage: TRANSLATION_LANGUAGE_NAMES[sourceLanguage],
  outputLanguage: TRANSLATION_LANGUAGE_NAMES[targetLanguage],
});

const parseTranslateResponse = (payload: TranslateResponse) => {
  const translatedText = String(payload.data?.translatedText || "").trim();

  if (!translatedText) {
    throw new Error("Translation response was empty.");
  }

  return translatedText;
};

const performTranslation = async (
  params: NormalizedTranslateParams,
): Promise<string> => {
  const response = await api.post<TranslateResponse>(
    TRANSLATION_ENDPOINT,
    buildTranslatePayload(params),
  );

  return parseTranslateResponse(response.data);
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

  const translationParams: NormalizedTranslateParams = {
    text: normalizedText,
    sourceLanguage,
    targetLanguage,
  };

  return performTranslation(translationParams);
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
