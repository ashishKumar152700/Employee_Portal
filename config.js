import Constants from "expo-constants";

const extra = Constants.expoConfig?.extra || Constants.manifest?.extra; // Ensure correct access

export const GOOGLE_API_KEY = extra?.googleApiKey;
export const GEOAPIFY_API_KEY = extra?.geoapifyApiKey;

console.log("✅ Google API Key:", GOOGLE_API_KEY);
console.log("✅ Geoapify API Key:", GEOAPIFY_API_KEY);

console.log("✅ Expo Config:", extra); // Debugging
