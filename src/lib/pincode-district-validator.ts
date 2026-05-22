const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// Commented out third-party API types
// type IndiaPostOffice = {
//   State?: string;
//   District?: string;
// };

// type IndiaPostResponse = {
//   Status?: string;
//   PostOffice?: IndiaPostOffice[] | null;
// };

export type PincodeDistrictValidationResult =
  | {
      isValid: true;
      matchedDistricts: string[];
      matchedStates: string[];
    }
  | {
      isValid: false;
      reason: "invalid_format" | "not_found" | "state_mismatch" | "district_mismatch" | "api_error";
      matchedDistricts: string[];
      matchedStates: string[];
    };

// Commented out - not used without API
// const normalizeString = (value: string) =>
//   value
//     .trim()
//     .toLowerCase()
//     .replace(/[^a-z0-9]/g, "");

export const validatePincodeAgainstDistrict = async (
  pincode: string,
  _stateName: string,
  _districtName: string,
): Promise<PincodeDistrictValidationResult> => {
  const normalizedPincode = pincode.trim();
  // const normalizedState = normalizeString(stateName);
  // const normalizedDistrict = normalizeString(districtName);

  if (!PINCODE_REGEX.test(normalizedPincode)) {
    return { isValid: false, reason: "invalid_format", matchedDistricts: [], matchedStates: [] };
  }

  // Commented out third-party API validation
  // try {
  //   const response = await fetch(`http://api.postalpincode.in/pincode/${normalizedPincode}`);

  //   if (!response.ok) {
  //     return { isValid: false, reason: "api_error", matchedDistricts: [], matchedStates: [] };
  //   }

  //   const payload = (await response.json()) as IndiaPostResponse[];
  //   const firstResult = payload?.[0];
  //   const postOffices = firstResult?.PostOffice || [];

  //   if (firstResult?.Status !== "Success" || postOffices.length === 0) {
  //     return { isValid: false, reason: "not_found", matchedDistricts: [], matchedStates: [] };
  //   }

  //   const states = Array.from(
  //     new Set(
  //       postOffices
  //         .map((entry) => (entry?.State || "").trim())
  //         .filter((state) => state.length > 0),
  //     ),
  //   );

  //   const districts = Array.from(
  //     new Set(
  //       postOffices
  //         .map((entry) => (entry?.District || "").trim())
  //         .filter((district) => district.length > 0),
  //     ),
  //   );

  //   const belongsToState = states.some(
  //     (state) => {
  //       const normalizedApiState = normalizeString(state);
  //       // Check if API state contains selected state OR selected state contains API state
  //       // This handles cases like "Ahmedabad" matching "Ahmedabad City"
  //       return normalizedApiState.includes(normalizedState) || normalizedState.includes(normalizedApiState);
  //     },
  //   );

  //   if (!belongsToState) {
  //     return { isValid: false, reason: "state_mismatch", matchedDistricts: districts, matchedStates: states };
  //   }

  //   const belongsToDistrict = districts.some(
  //     (district) => {
  //       const normalizedApiDistrict = normalizeString(district);
  //       // Check if API district contains selected district OR selected district contains API district
  //       // This handles cases like "Pune" matching "Pune City"
  //       return normalizedApiDistrict.includes(normalizedDistrict) || normalizedDistrict.includes(normalizedApiDistrict);
  //     },
  //   );

  //   if (!belongsToDistrict) {
  //     return { isValid: false, reason: "district_mismatch", matchedDistricts: districts, matchedStates: states };
  //   }

  //   return {
  //     isValid: true,
  //     matchedDistricts: districts,
  //     matchedStates: states,
  //   };
  // } catch (error) {
  //   console.error("Pincode validation error:", error);
  //   return { isValid: false, reason: "api_error", matchedDistricts: [], matchedStates: [] };
  // }

  // Return valid result without API validation
  return {
    isValid: true,
    matchedDistricts: [],
    matchedStates: [],
  };
};
