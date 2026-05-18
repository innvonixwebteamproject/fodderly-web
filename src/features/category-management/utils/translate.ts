import { ENV } from "@/config/env";
import type { CategoryLanguageCode } from "../types";

const GOOGLE_CLOUD_TRANSLATE_API =
  "https://translation.googleapis.com/language/translate/v2";

type GoogleTranslateResponse = {
  data?: {
    translations?: Array<{
      translatedText?: string;
    }>;
  };
};

const decodeHtmlEntities = (value: string) => {
  if (typeof document === "undefined") {
    return value;
  }

  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
};

export const translateEnglishText = async (
  text: string,
  targetLanguage: CategoryLanguageCode,
): Promise<string> => {
  const normalizedText = text.trim();
  if (!normalizedText || targetLanguage === "en") {
    return normalizedText;
  }

  const apiKey = ENV.GOOGLE_CLOUD_TRANSLATE_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Google Cloud Translation API key is missing. Set VITE_GOOGLE_CLOUD_TRANSLATE_API_KEY.",
    );
  }

  const url = new URL(GOOGLE_CLOUD_TRANSLATE_API);
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: normalizedText,
      source: "en",
      target: targetLanguage,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error("Translation service is unavailable.");
  }

  const payload = (await response.json()) as GoogleTranslateResponse;
  const translatedText = payload.data?.translations?.[0]?.translatedText?.trim();

  if (!translatedText) {
    throw new Error("Translation response was empty.");
  }

  return decodeHtmlEntities(translatedText);
};
