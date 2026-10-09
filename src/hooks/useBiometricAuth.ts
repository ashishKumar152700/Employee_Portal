import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import {
  BiometricBinding,
  clearBiometricBinding,
  getBiometricBinding,
  purgeLegacyBiometricData,
  saveBiometricBinding,
} from "../utils/secureStorage";

interface UseBiometricAuthReturn {
  isSupported: boolean;
  isEnrolled: boolean;
  isAuthenticating: boolean;
  error: string | null;
  /** The account fingerprint login is bound to on this device (if any). */
  binding: BiometricBinding | null;
  /** True once hardware/enrollment/binding have been checked. */
  ready: boolean;
  authenticate: (promptMessage?: string) => Promise<boolean>;
  enableBiometricLogin: (empCode: string, password: string, name: string) => Promise<void>;
  disableBiometricLogin: () => Promise<void>;
  isBiometricLoginEnabled: () => Promise<boolean>;
  isBiometricAvailableAndEnabled: () => Promise<boolean>;
  refreshBinding: () => Promise<BiometricBinding | null>;
}

// The old implementation stored credentials that could belong to whoever
// logged in last; purge them once per app launch before anything reads them.
let legacyPurged: Promise<void> | null = null;
const ensureLegacyPurged = () => {
  if (!legacyPurged) legacyPurged = purgeLegacyBiometricData();
  return legacyPurged;
};

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [binding, setBinding] = useState<BiometricBinding | null>(null);
  const [ready, setReady] = useState(false);

  const refreshBinding = useCallback(async () => {
    const current = await getBiometricBinding();
    setBinding(current);
    return current;
  }, []);

  // Check hardware, enrollment and the stored binding on mount
  useEffect(() => {
    const check = async () => {
      try {
        await ensureLegacyPurged();
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsSupported(compatible);
        if (compatible) {
          setIsEnrolled(await LocalAuthentication.isEnrolledAsync());
        }
        await refreshBinding();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to check biometric availability");
        setIsSupported(false);
        setIsEnrolled(false);
      } finally {
        setReady(true);
      }
    };
    check();
  }, [refreshBinding]);

  const authenticate = useCallback(
    async (promptMessage = "Log in to RKT ESS"): Promise<boolean> => {
      if (!isSupported || !isEnrolled) {
        setError("Biometric authentication is not available on this device");
        return false;
      }

      setIsAuthenticating(true);
      setError(null);

      try {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage,
          cancelLabel: "Use password",
          disableDeviceFallback: false,
        });

        if (result.success) return true;

        // Cancelling isn't an error worth showing.
        const reason = (result as { error?: string }).error;
        if (reason !== "user_cancel" && reason !== "system_cancel" && reason !== "app_cancel") {
          setError("Biometric authentication failed");
        }
        return false;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Biometric authentication error");
        return false;
      } finally {
        setIsAuthenticating(false);
      }
    },
    [isSupported, isEnrolled],
  );

  /**
   * Bind fingerprint login to this account. Requires a fresh biometric check
   * so only the person holding the phone can turn it on.
   */
  const enableBiometricLogin = useCallback(
    async (empCode: string, password: string, name: string): Promise<void> => {
      setError(null);
      const authenticated = await authenticate("Confirm to enable fingerprint login");
      if (!authenticated) {
        throw new Error("Authentication failed. Biometric login not enabled.");
      }
      await saveBiometricBinding(empCode, password, name);
      await refreshBinding();
    },
    [authenticate, refreshBinding],
  );

  const disableBiometricLogin = useCallback(async (): Promise<void> => {
    setError(null);
    await clearBiometricBinding();
    setBinding(null);
  }, []);

  const isBiometricLoginEnabled = useCallback(async (): Promise<boolean> => {
    return (await getBiometricBinding()) !== null;
  }, []);

  const isBiometricAvailableAndEnabled = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isEnrolled) return false;
    return isBiometricLoginEnabled();
  }, [isSupported, isEnrolled, isBiometricLoginEnabled]);

  return {
    isSupported,
    isEnrolled,
    isAuthenticating,
    error,
    binding,
    ready,
    authenticate,
    enableBiometricLogin,
    disableBiometricLogin,
    isBiometricLoginEnabled,
    isBiometricAvailableAndEnabled,
    refreshBinding,
  };
};
