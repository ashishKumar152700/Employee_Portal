import * as SecureStore from "expo-secure-store";

const CREDENTIALS_KEY = "userCredentials";

interface UserCredentials {
  empCode: string;
  password: string;
}

/**
 * Save user credentials securely using Secure Store
 * Called after successful password login
 */
export const saveUserCredentials = async (
  empCode: string,
  password: string,
): Promise<void> => {
  try {
    const credentials: UserCredentials = {
      empCode,
      password,
    };
    await SecureStore.setItemAsync(
      CREDENTIALS_KEY,
      JSON.stringify(credentials),
    );
  } catch (error) {
    console.error("Failed to save user credentials:", error);
    throw error;
  }
};

/**
 * Retrieve stored user credentials
 * Called when using biometric login
 */
export const getUserCredentials = async (): Promise<UserCredentials | null> => {
  try {
    const credentialsJSON = await SecureStore.getItemAsync(CREDENTIALS_KEY);
    if (!credentialsJSON) {
      return null;
    }
    return JSON.parse(credentialsJSON) as UserCredentials;
  } catch (error) {
    console.error("Failed to retrieve user credentials:", error);
    return null;
  }
};

/**
 * Clear stored user credentials
 * Called on logout
 */
export const clearUserCredentials = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
  } catch (error) {
    console.error("Failed to clear user credentials:", error);
    throw error;
  }
};
