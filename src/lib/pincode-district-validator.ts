const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

type IndiaPostOffice = {
  District?: string;
};

type IndiaPostResponse = {
  Status?: string;
  PostOffice?: IndiaPostOffice[] | null;
};

export type PincodeDistrictValidationResult =
  | {
      isValid: true;
      matchedDistricts: string[];
    }
  | {
      isValid: false;
      reason: "invalid_format" | "not_found" | "mismatch" | "api_error";
      matchedDistricts: string[];
    };

const normalizeDistrictName = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

export const validatePincodeAgainstDistrict = async (
  pincode: string,
  districtName: string,
): Promise<PincodeDistrictValidationResult> => {
  const normalizedPincode = pincode.trim();
  const normalizedDistrict = normalizeDistrictName(districtName);

  if (!PINCODE_REGEX.test(normalizedPincode)) {
    return { isValid: false, reason: "invalid_format", matchedDistricts: [] };
  }

  try {
    const response = await fetch(`https://api.postalpincode.in/pincode/${normalizedPincode}`);

    if (!response.ok) {
      return { isValid: false, reason: "api_error", matchedDistricts: [] };
    }

    const payload = (await response.json()) as IndiaPostResponse[];
    const firstResult = payload?.[0];
    const postOffices = firstResult?.PostOffice || [];

    if (firstResult?.Status !== "Success" || postOffices.length === 0) {
      return { isValid: false, reason: "not_found", matchedDistricts: [] };
    }

    const districts = Array.from(
      new Set(
        postOffices
          .map((entry) => (entry?.District || "").trim())
          .filter((district) => district.length > 0),
      ),
    );

    const belongsToDistrict = districts.some(
      (district) => normalizeDistrictName(district) === normalizedDistrict,
    );

    if (!belongsToDistrict) {
      return { isValid: false, reason: "mismatch", matchedDistricts: districts };
    }

    return {
      isValid: true,
      matchedDistricts: districts,
    };
  } catch {
    return { isValid: false, reason: "api_error", matchedDistricts: [] };
  }
};
