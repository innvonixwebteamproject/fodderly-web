const hindiLetterMap: Record<string, string> = {
  A: "ए",
  B: "बी",
  C: "सी",
  D: "डी",
  E: "ई",
  F: "एफ",
  G: "जी",
  H: "एच",
  I: "आई",
  J: "जे",
  K: "के",
  L: "एल",
  M: "एम",
  N: "एन",
  O: "ओ",
  P: "पी",
  Q: "क्यू",
  R: "आर",
  S: "एस",
  T: "टी",
  U: "यू",
  V: "वी",
  W: "डब्ल्यू",
  X: "एक्स",
  Y: "वाई",
  Z: "जेड"
};

/**
 * Transliterates individual letters of a word using Hindi letter mapping
 * @param word - The word to transliterate (e.g., "MH")
 * @returns Transliterated string with spaces between letters (e.g., "एम एच")
 */
function transliterateLetters(word: string): string {
  return word
    .split("")
    .map(char => hindiLetterMap[char] || char)
    .join(" ");
}

/**
 * Preprocesses text to prevent Google Translate from semantically expanding
 * short uppercase abbreviations (1-3 characters) into full words.
 * 
 * Detects abbreviations using regex /^[A-Z]{1,3}$/ and replaces them with
 * character-by-character transliteration. All other words remain unchanged.
 * 
 * @param text - The text to preprocess
 * @returns Preprocessed text with abbreviations transliterated
 * 
 * @example
 * preprocessText("MH 18 bottle") // "एम एच 18 बोतल"
 * preprocessText("MP fertilizer") // "एम पी उर्वरक"
 * preprocessText("TN rice bag") // "टी एन चावल बैग"
 * preprocessText("water") // "water" (unchanged)
 */
export function preprocessText(text: string): string {
  return text
    .split(" ")
    .map(word => {
      // Detect short uppercase abbreviations (1-3 characters)
      if (/^[A-Z]{1,3}$/.test(word)) {
        return transliterateLetters(word);
      }
      return word;
    })
    .join(" ");
}
