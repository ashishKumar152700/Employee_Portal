import * as SecureStore from "expo-secure-store";

// ─── Biometric binding ──────────────────────────────────────────────────────
// Fingerprint / Face ID login works by unlocking credentials saved on this
// device. The device biometric check only proves "a finger enrolled on this
// phone" — it does not identify which employee it belongs to. So the stored
// credentials ARE the identity, and they must only ever belong to the person
// who explicitly turned biometric login on.
//
// One binding per device:
//   - written only when a user opts in to biometric login,
//   - refreshed (new password) only when that same user signs in again,
//   - never overwritten by someone else's password login,
//   - kept across logout (that's what makes "log in with my finger" work),
//   - removed when the owner turns it off or it stops working.

const BINDING_KEY = "biometricBinding";

// Keys from the previous implementation. The old code overwrote the saved
// credentials on every password login, so whatever they contain may belong
// to whoever logged in last — they are discarded, never trusted.
const LEGACY_CREDENTIALS_KEY = "userCredentials";
const LEGACY_ENABLED_KEY = "isBiometricEnabled";

export interface BiometricBinding {
  empCode: string;
  password: string;
  name: string;
  enabledAt: string;
}

export const getBiometricBinding = async (): Promise<BiometricBinding | null> => {
  try {
    const raw = await SecureStore.getItemAsync(BINDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BiometricBinding;
    return parsed?.empCode && parsed?.password ? parsed : null;
  } catch (error) {
    console.error("Failed to read biometric binding:", error);
    return null;
  }
};

export const saveBiometricBinding = async (
  empCode: string,
  password: string,
  name: string,
): Promise<void> => {
  const binding: BiometricBinding = {
    empCode: String(empCode),
    password,
    name: name || "",
    enabledAt: new Date().toISOString(),
  };
  await SecureStore.setItemAsync(BINDING_KEY, JSON.stringify(binding));
};

/** Keep biometric login working after the bound user changes their password. */
export const refreshBindingPassword = async (
  empCode: string,
  password: string,
): Promise<void> => {
  const binding = await getBiometricBinding();
  if (!binding || binding.empCode !== String(empCode)) return; // not the owner — never touch it
  if (binding.password === password) return;
  await SecureStore.setItemAsync(BINDING_KEY, JSON.stringify({ ...binding, password }));
};

export const clearBiometricBinding = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(BINDING_KEY);
  } catch (error) {
    console.error("Failed to clear biometric binding:", error);
  }
};

/** Remove credentials left by the old implementation (run once at startup). */
export const purgeLegacyBiometricData = async (): Promise<void> => {
  try {
    await SecureStore.deleteItemAsync(LEGACY_CREDENTIALS_KEY);
    await SecureStore.deleteItemAsync(LEGACY_ENABLED_KEY);
  } catch {
    // Nothing stored — fine.
  }
};
