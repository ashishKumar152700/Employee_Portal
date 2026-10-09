import React, { forwardRef, useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
  Animated,
  Easing,
  TextInput,
  TextInputProps,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../Global/Types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { loginservice } from "../../Services/Login/Login.service";
import { useDispatch } from "react-redux";
import { useBiometricAuth } from "../../src/hooks/useBiometricAuth";
import { saveUserCredentials, getUserCredentials } from "../../src/utils/secureStorage";
import { themedStyles, C } from "../../Global/ThemeContext";
import { AppDialog, DIALOG_LOTTIE, dialog } from "../../Component/Feedback/AppDialog";

const LOGO = require("../../assets/logo-mark.png");
const APP_VERSION = Constants.expoConfig?.version ?? "";

// ─── Input field (module level so typing never remounts the input) ────────
type LoginFieldProps = TextInputProps & {
  icon: any;
  label: string;
  error?: string;
  trailing?: React.ReactNode;
};

const LoginField = forwardRef<TextInput, LoginFieldProps>(
  ({ icon, label, error, trailing, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View
          style={[
            styles.fieldBox,
            focused && styles.fieldBoxFocused,
            !!error && styles.fieldBoxError,
          ]}
        >
          <MaterialCommunityIcons
            name={icon}
            size={20}
            color={error ? C.dangerText : focused ? C.accent : C.primaryMuted}
          />
          <TextInput
            ref={ref}
            {...rest}
            placeholderTextColor={C.placeholder}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={styles.fieldInput}
          />
          {trailing}
        </View>
        {!!error && (
          <View style={styles.fieldErrorRow}>
            <MaterialCommunityIcons name="alert-circle" size={13} color={C.dangerText} />
            <Text style={styles.fieldErrorText}>{error}</Text>
          </View>
        )}
      </View>
    );
  }
);

const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const [employeecode, setEmployeecode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  const [biometricLoginError, setBiometricLoginError] = useState<string | null>(
    null,
  );
  const [fieldErrors, setFieldErrors] = useState<{ code?: string; password?: string }>({});
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();
  const passwordRef = useRef<TextInput>(null);

  // Biometric hook
  const {
    isSupported,
    isEnrolled,
    isAuthenticating,
    error: biometricError,
    authenticate,
    enableBiometricLogin,
    isBiometricAvailableAndEnabled,
  } = useBiometricAuth();

  // Animations
  const entrance = useRef(new Animated.Value(0)).current;
  const logoFloat = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const shake = useRef(new Animated.Value(0)).current;
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    Animated.timing(entrance, {
      toValue: 1,
      duration: 650,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(logoFloat, {
          toValue: 1,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoFloat, {
          toValue: 0,
          duration: 2600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    float.start();
    return () => float.stop();
  }, []);

  // Check if biometric login is available and enabled for displaying the button
  useEffect(() => {
    const checkBiometricAvailability = async () => {
      try {
        const available = await isBiometricAvailableAndEnabled();
        setShowBiometricButton(available);
      } catch (err) {
        console.error("Failed to check biometric availability:", err);
        setShowBiometricButton(false);
      }
    };

    checkBiometricAvailability();
  }, [isBiometricAvailableAndEnabled]);

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.96,
        duration: 90,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 110,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const shakeForm = () => {
    shake.setValue(0);
    Animated.sequence(
      [10, -10, 7, -7, 3, 0].map((toValue) =>
        Animated.timing(shake, { toValue, duration: 55, useNativeDriver: true }),
      ),
    ).start();
  };

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleBiometricLogin = async () => {
    setBiometricLoginError(null);
    setLoading(true);

    try {
      // Step 1: Authenticate with biometric
      const authenticated = await authenticate();

      if (!authenticated) {
        setLoading(false);
        setBiometricLoginError(
          "Biometric authentication failed. Please try again or use password login.",
        );
        return;
      }

      // Step 2: Retrieve stored credentials
      const credentials = await getUserCredentials();
      if (!credentials || !credentials.empCode || !credentials.password) {
        setLoading(false);
        setBiometricLoginError(
          "No saved credentials found. Please login with password first.",
        );
        return;
      }

      // Step 3: Call backend API with retrieved credentials
      const response = await loginservice.LoginApi(
        { employeecode: +credentials.empCode, password: credentials.password },
        dispatch,
      );

      if (response.status === 200) {
        // Step 4: Save session token
        await AsyncStorage.setItem("token", response.data.accessToken);
        const userData = await AsyncStorage.getItem("user");

        if (!userData) {
          throw new Error("User data not found after login");
        }

        setLoginSuccess(true);
        setLoading(false);
        onLoginSuccess();
      } else {
        setLoading(false);
        setBiometricLoginError("Login failed. Please try again.");
      }
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Biometric login error - please try password login";
      setBiometricLoginError(errorMessage);
      console.error("Biometric login error:", err);
    }
  };

  const handleLogin = async () => {
    if (!employeecode || !password) {
      setFieldErrors({
        code: employeecode ? undefined : "Employee code is required",
        password: password ? undefined : "Password is required",
      });
      shakeForm();
      return;
    }
    setFieldErrors({});

    animateButtonPress();
    setLoading(true);
    setLoginError(""); // reset previous errors

    const startTime = Date.now();
    const minLoadingTime = 2000; // set to 2 seconds, not 20s

    try {
      const response = await loginservice.LoginApi(
        { employeecode: +employeecode, password },
        dispatch,
      );

      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minLoadingTime - elapsed),
        );
      }

      if (response.status === 200) {
        await AsyncStorage.setItem("token", response.data.accessToken);
        const userData = await AsyncStorage.getItem("user");

        if (!userData) throw new Error("User data not found after login");

        // Save credentials securely for biometric login
        try {
          await saveUserCredentials(employeecode, password);
        } catch (err) {
          console.warn("Failed to save credentials for biometric login:", err);
          // Don't fail the entire login flow if credential saving fails
        }

        setLoading(false);
        setLoginSuccess(true);

        // Show biometric setup prompt if biometric is supported and not yet enabled
        if (isSupported && isEnrolled) {
          const enable = await dialog.confirm({
            title: "Enable biometric login?",
            message:
              "Would you like to enable biometric (fingerprint/Face ID) login for faster access in the future?",
            confirmLabel: "Enable",
            cancelLabel: "Not now",
            icon: "fingerprint",
          });
          if (!enable) {
            console.log("User declined biometric login");
            onLoginSuccess();
          } else {
            try {
              await enableBiometricLogin();
              await dialog.alert(
                "Biometric login enabled",
                "You can now use fingerprint/Face ID to login.",
                "success",
              );
              onLoginSuccess();
            } catch (err) {
              await dialog.alert(
                "Couldn't enable biometrics",
                "Failed to enable biometric login. You can try again later.",
                "error",
              );
              onLoginSuccess();
            }
          }
        } else {
          // No biometric available, proceed directly
          onLoginSuccess();
        }
      }
    } catch (error: any) {
      const elapsed = Date.now() - startTime;
      if (elapsed < minLoadingTime) {
        await new Promise((resolve) =>
          setTimeout(resolve, minLoadingTime - elapsed),
        );
      }

      let errorMessage = "Login failed";
      if (error.message) errorMessage = error.message;
      else if (error.response?.data?.message)
        errorMessage = error.response.data.message;

      setLoginError(errorMessage);
      setLoading(false);
    }
  };

  const onLoginSuccess = () => {
    // Navigate to main app after successful login (password or biometric)
    navigation.replace("Main");
  };

  const handleLogout = async () => {
    try {
      // Clear session data
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");

      // Reset form
      setEmployeecode("");
      setPassword("");
      setLoginError("");
      setBiometricLoginError(null);
      setLoginSuccess(false);

      console.log("Logged out successfully");
    } catch (err) {
      console.error("Logout error:", err);
      dialog.alert("Error", "Failed to logout. Please try again.", "error");
    }
  };

  const rise = (from: number) => ({
    opacity: entrance,
    transform: [
      {
        translateY: entrance.interpolate({ inputRange: [0, 1], outputRange: [from, 0] }),
      },
    ],
  });

  const inlineError = biometricLoginError || (biometricError ? `Biometric Error: ${biometricError}` : "");

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      {/* ── Brand hero ──────────────────────────────────────────── */}
      <LinearGradient
        colors={C.heroGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View pointerEvents="none" style={styles.heroDecor}>
          <View style={[styles.ring, styles.ringLg]} />
          <View style={[styles.ring, styles.ringMd]} />
          <View style={[styles.orb, styles.orbA]} />
          <View style={[styles.orb, styles.orbB]} />
        </View>

        <Animated.View style={[styles.brand, rise(-12)]}>
          <Animated.View
            style={[
              styles.logoGlow,
              {
                transform: [
                  {
                    translateY: logoFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }),
                  },
                ],
              },
            ]}
          >
            <Image source={LOGO} style={styles.logo} />
          </Animated.View>
          <Text style={styles.brandTitle}>RKT ESS</Text>
          <Text style={styles.brandSubtitle}>Employee Self Service Portal</Text>
        </Animated.View>
      </LinearGradient>

      {/* ── Sign-in card ────────────────────────────────────────── */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.heroSpacer} />

          <Animated.View
            style={[styles.card, rise(28), { transform: [...rise(28).transform, { translateX: shake }] }]}
          >
            <Text style={styles.welcome}>Welcome back</Text>
            <Text style={styles.welcomeSub}>Sign in with your employee credentials</Text>

            <LoginField
              icon="badge-account-outline"
              label="Employee code"
              placeholder="e.g. 1024"
              value={employeecode}
              onChangeText={(t) => {
                setEmployeecode(t);
                if (fieldErrors.code) setFieldErrors((e) => ({ ...e, code: undefined }));
              }}
              keyboardType="numeric"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => passwordRef.current?.focus()}
              editable={!loading}
              error={fieldErrors.code}
            />

            <LoginField
              ref={passwordRef}
              icon="lock-outline"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (fieldErrors.password) setFieldErrors((e) => ({ ...e, password: undefined }));
              }}
              secureTextEntry={secureTextEntry}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
              editable={!loading}
              error={fieldErrors.password}
              trailing={
                <TouchableOpacity
                  onPress={togglePasswordVisibility}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  accessibilityLabel={secureTextEntry ? "Show password" : "Hide password"}
                >
                  <MaterialCommunityIcons
                    name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                    size={20}
                    color={C.primaryMuted}
                  />
                </TouchableOpacity>
              }
            />

            <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
              <TouchableOpacity
                onPress={handleLogin}
                activeOpacity={0.9}
                disabled={loading}
                style={styles.signInTouch}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={C.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signIn}
                >
                  <Text style={styles.signInText}>Sign in</Text>
                  <View style={styles.signInArrow}>
                    <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            {showBiometricButton && (
              <>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  activeOpacity={0.85}
                  disabled={loading || isAuthenticating}
                  style={styles.biometric}
                  accessibilityRole="button"
                >
                  <MaterialCommunityIcons
                    name={Platform.OS === "ios" ? "face-recognition" : "fingerprint"}
                    size={22}
                    color={C.accent}
                  />
                  <Text style={styles.biometricText}>
                    {Platform.OS === "ios" ? "Login with Face ID" : "Login with Fingerprint"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {!!inlineError && (
              <View style={styles.inlineError}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={C.dangerText} />
                <Text style={styles.inlineErrorText}>{inlineError}</Text>
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.footer, rise(16)]}>
            <View style={styles.footerRow}>
              <MaterialCommunityIcons name="shield-lock-outline" size={14} color={C.textFaint} />
              <Text style={styles.footerText}>Secured by RishiKirti Technologies</Text>
            </View>
            {!!APP_VERSION && <Text style={styles.footerVersion}>Version {APP_VERSION}</Text>}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Sign-in progress / failure ──────────────────────────── */}
      <AppDialog
        visible={loading}
        variant="loading"
        title="Signing you in"
        message="Verifying your credentials…"
      />
      <AppDialog
        visible={!!loginError && !loading}
        variant="error"
        lottie={DIALOG_LOTTIE.loginError}
        title="Login failed"
        message={loginError}
        primaryLabel="Try again"
        onPrimary={() => {
          setLoginError("");
          setPassword("");
          passwordRef.current?.focus();
        }}
      />
    </View>
  );
};

const HERO_HEIGHT = 330;

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  flex: {
    flex: 1,
  },

  // Hero
  hero: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: HERO_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    overflow: "hidden",
    paddingBottom: 40,
  },
  heroDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  ring: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.14)",
  },
  ringLg: { width: 420, height: 420, top: -190, right: -170 },
  ringMd: { width: 260, height: 260, top: -110, right: -90 },
  orb: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  orbA: { width: 160, height: 160, bottom: -60, left: -50 },
  orbB: { width: 70, height: 70, top: 70, left: 40, backgroundColor: "rgba(125, 211, 252, 0.08)" },
  brand: {
    alignItems: "center",
  },
  logoGlow: {
    borderRadius: 30,
    elevation: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    backgroundColor: "transparent",
  },
  logo: {
    width: 96,
    height: 96,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 2,
    marginTop: 14,
  },
  brandSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    letterSpacing: 0.6,
    marginTop: 4,
  },

  // Card
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 18,
  },
  heroSpacer: {
    height: HERO_HEIGHT - 56,
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: c.border,
    elevation: 12,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 26,
  },
  welcome: {
    fontSize: 22,
    fontWeight: "800",
    color: c.text,
  },
  welcomeSub: {
    fontSize: 13.5,
    color: c.textSoft,
    marginTop: 4,
    marginBottom: 8,
  },

  // Fields
  field: {
    marginTop: 14,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: "700",
    color: c.text,
    marginBottom: 7,
    marginLeft: 2,
  },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 54,
    paddingHorizontal: 14,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surfaceInput,
  },
  fieldBoxFocused: {
    borderColor: c.accent,
    backgroundColor: c.surface,
  },
  fieldBoxError: {
    borderColor: c.dangerText,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15.5,
    color: c.text,
    paddingVertical: 0,
  },
  fieldErrorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    marginLeft: 2,
  },
  fieldErrorText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.dangerText,
  },

  // Buttons
  signInTouch: {
    marginTop: 22,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    backgroundColor: c.primary,
  },
  signIn: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signInText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  signInArrow: {
    position: "absolute",
    right: 8,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: c.divider,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textFaint,
  },
  biometric: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    backgroundColor: c.primaryFaint,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: "700",
    color: c.accent,
  },
  inlineError: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: c.dangerBg,
  },
  inlineErrorText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: "600",
    color: c.dangerText,
    lineHeight: 18,
  },

  // Footer
  footer: {
    alignItems: "center",
    marginTop: 22,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    color: c.textFaint,
    fontWeight: "600",
  },
  footerVersion: {
    fontSize: 11,
    color: c.textFaint,
    marginTop: 4,
  },
}));


export default LoginScreen;
