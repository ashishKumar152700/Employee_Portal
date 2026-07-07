import { useState, useEffect, useCallback } from "react";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRIC_ENABLED_KEY = "isBiometricEnabled";

interface UseBiometricAuthReturn {
  isSupported: boolean;
  isEnrolled: boolean;
  isAuthenticating: boolean;
  error: string | null;
  authenticate: () => Promise<boolean>;
  enableBiometricLogin: () => Promise<void>;
  disableBiometricLogin: () => Promise<void>;
  isBiometricLoginEnabled: () => Promise<boolean>;
  isBiometricAvailableAndEnabled: () => Promise<boolean>;
}

export const useBiometricAuth = (): UseBiometricAuthReturn => {
  const [isSupported, setIsSupported] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check hardware and enrollment on mount
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        // Check if biometric hardware is supported
        const compatible = await LocalAuthentication.hasHardwareAsync();
        setIsSupported(compatible);

        if (compatible) {
          // Check if biometric is enrolled
          const enrolled = await LocalAuthentication.isEnrolledAsync();
          setIsEnrolled(enrolled);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to check biometric availability";
        setError(errorMessage);
        setIsSupported(false);
        setIsEnrolled(false);
      }
    };

    checkBiometricAvailability();
  }, []);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !isEnrolled) {
      setError("Biometric authentication is not available");
      return false;
    }

    setIsAuthenticating(true);
    setError(null);

    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        reason: "Authenticate to access your account",
      });

      if (result.success) {
        setIsAuthenticating(false);
        return true;
      } else {
        setError("Biometric authentication failed");
        setIsAuthenticating(false);
        return false;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Biometric authentication error";
      setError(errorMessage);
      setIsAuthenticating(false);
      return false;
    }
  }, [isSupported, isEnrolled]);

  const enableBiometricLogin = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      // First authenticate to confirm identity
      const authenticated = await authenticate();

      if (authenticated) {
        // Store the preference in SecureStore
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      } else {
        throw new Error("Authentication failed. Biometric login not enabled.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to enable biometric login";
      setError(errorMessage);
      throw err;
    }
  }, [authenticate]);

  const disableBiometricLogin = useCallback(async (): Promise<void> => {
    try {
      setError(null);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to disable biometric login";
      setError(errorMessage);
      throw err;
    }
  }, []);

  const isBiometricLoginEnabled = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === "true";
    } catch (err) {
      // If there's an error reading, assume not enabled
      return false;
    }
  }, []);

  const isBiometricAvailableAndEnabled =
    useCallback(async (): Promise<boolean> => {
      try {
        // Check if hardware is supported AND enrolled AND user has enabled it
        if (!isSupported || !isEnrolled) {
          return false;
        }
        const enabled = await isBiometricLoginEnabled();
        return enabled;
      } catch (err) {
        return false;
      }
    }, [isSupported, isEnrolled, isBiometricLoginEnabled]);

  return {
    isSupported,
    isEnrolled,
    isAuthenticating,
    error,
    authenticate,
    enableBiometricLogin,
    disableBiometricLogin,
    isBiometricLoginEnabled,
    isBiometricAvailableAndEnabled,
  };
};
