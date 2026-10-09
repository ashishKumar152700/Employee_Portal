// Component/Feedback/AppDialog.tsx
// One dialog for the whole app: confirmations, success / error / warning
// results, and blocking "loading" states. Theme-aware, keeps the app's
// Lottie animations, and can be used two ways:
//
//   1. <AppDialog visible ... />           — for screens that own their state
//      (required inside another Modal, e.g. the timesheet form).
//   2. dialog.alert(...) / dialog.confirm(...) / dialog.loading(...)
//      — imperative API rendered by <DialogHost /> at the app root.
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { C, themedStyles } from "../../Global/ThemeContext";

export type DialogVariant =
  | "success"
  | "error"
  | "warning"
  | "danger"
  | "confirm"
  | "info"
  | "loading";

// The app's existing animations, reused per variant.
export const DIALOG_LOTTIE = {
  success: require("../../assets/animations/success.json"),
  error: require("../../assets/animations/error.json"),
  cancel: require("../../assets/animations/cancel.json"),
  loading: require("../../assets/animations/loading.json"),
  loginError: require("../../assets/animations/LoginError.json"),
};

const DEFAULT_LOTTIE: Partial<Record<DialogVariant, any>> = {
  success: DIALOG_LOTTIE.success,
  error: DIALOG_LOTTIE.error,
  warning: DIALOG_LOTTIE.cancel,
  danger: DIALOG_LOTTIE.cancel,
  loading: DIALOG_LOTTIE.loading,
};

const DEFAULT_ICON: Record<DialogVariant, any> = {
  success: "check-circle-outline",
  error: "alert-circle-outline",
  warning: "alert-outline",
  danger: "trash-can-outline",
  confirm: "help-circle-outline",
  info: "information-outline",
  loading: "progress-clock",
};

// Read at render time so tones follow light / dark mode.
const tone = (variant: DialogVariant) => {
  switch (variant) {
    case "success":
      return { fg: C.successText, halo: C.successBg };
    case "error":
    case "danger":
      return { fg: C.dangerText, halo: C.dangerBg };
    case "warning":
      return { fg: C.warningText, halo: C.warningBg };
    default:
      return { fg: C.accent, halo: C.primaryFaint };
  }
};

export type AppDialogProps = {
  visible: boolean;
  variant?: DialogVariant;
  title: string;
  message?: string;
  /** Lottie source; defaults per variant. Pass `null` to force the icon badge. */
  lottie?: any;
  /** Loop the Lottie (defaults to true for loading). */
  loop?: boolean;
  /** Icon badge glyph (MaterialCommunityIcons) when no Lottie is shown. */
  icon?: any;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  /** Close when the backdrop / Android back button is pressed. */
  dismissible?: boolean;
  onDismiss?: () => void;
  /** Extra content between the message and the buttons (e.g. details). */
  children?: React.ReactNode;
  /** No buttons (for transient states that close themselves). */
  hideActions?: boolean;
};

export const AppDialog = ({
  visible,
  variant = "info",
  title,
  message,
  lottie,
  loop,
  icon,
  primaryLabel = "OK",
  onPrimary,
  secondaryLabel,
  onSecondary,
  dismissible,
  onDismiss,
  children,
  hideActions,
}: AppDialogProps) => {
  const isLoading = variant === "loading";
  const [mounted, setMounted] = useState(visible);
  const backdrop = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const lift = useRef(new Animated.Value(16)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      scale.setValue(0.9);
      lift.setValue(16);
      Animated.parallel([
        Animated.timing(backdrop, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scale, { toValue: 1, friction: 7, tension: 110, useNativeDriver: true }),
        Animated.spring(lift, { toValue: 0, friction: 8, tension: 90, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 160,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
  }, [visible]);

  // Indeterminate progress sweep for loading dialogs.
  useEffect(() => {
    if (!mounted || !isLoading) return;
    progress.setValue(0);
    const loopAnim = Animated.loop(
      Animated.timing(progress, {
        toValue: 1,
        duration: 1300,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      })
    );
    loopAnim.start();
    return () => loopAnim.stop();
  }, [mounted, isLoading]);

  if (!mounted) return null;

  const t = tone(variant);
  const source = lottie === undefined ? DEFAULT_LOTTIE[variant] : lottie;
  const canDismiss = dismissible ?? (!isLoading && !secondaryLabel);
  const dismiss = () => {
    if (!canDismiss) return;
    (onDismiss ?? onSecondary ?? onPrimary)?.();
  };
  const destructive = variant === "danger" || variant === "error";
  const primaryColors: readonly [string, string] =
    variant === "danger" ? ["#B91C1C", "#EF4444"] : C.primaryGradient;

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <Animated.View style={[styles.backdrop, { opacity: backdrop }]}>
        <Pressable
          style={styles.backdropPress}
          onPress={dismiss}
          accessibilityLabel={canDismiss ? "Close dialog" : undefined}
        />
        <Animated.View
          accessibilityRole="alert"
          accessibilityViewIsModal
          style={[
            styles.card,
            { opacity: backdrop, transform: [{ translateY: lift }, { scale }] },
          ]}
        >
          {/* Tinted wash behind the hero */}
          <LinearGradient
            colors={[t.halo, "transparent"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.wash}
            pointerEvents="none"
          />

          <View style={[styles.halo, { backgroundColor: t.halo }]}>
            <View style={[styles.haloRing, { borderColor: t.halo }]} />
            {source ? (
              <LottieView
                source={source}
                autoPlay
                loop={loop ?? isLoading}
                style={styles.lottie}
              />
            ) : (
              <LinearGradient
                colors={destructive ? ["#B91C1C", "#EF4444"] : C.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.badge}
              >
                <MaterialCommunityIcons
                  name={icon ?? DEFAULT_ICON[variant]}
                  size={34}
                  color="#FFFFFF"
                />
              </LinearGradient>
            )}
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          {children}

          {isLoading ? (
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressBar,
                  {
                    transform: [
                      {
                        translateX: progress.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-120, 260],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <LinearGradient
                  colors={["transparent", C.accent, "transparent"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressFill}
                />
              </Animated.View>
            </View>
          ) : hideActions ? (
            <View style={styles.actionsSpacer} />
          ) : (
            <View style={styles.actions}>
              {!!secondaryLabel && (
                <TouchableOpacity
                  onPress={onSecondary}
                  activeOpacity={0.75}
                  style={[styles.button, styles.secondary]}
                  accessibilityRole="button"
                >
                  <Text style={styles.secondaryText}>{secondaryLabel}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={onPrimary}
                activeOpacity={0.88}
                style={[styles.button, styles.primaryWrap]}
                accessibilityRole="button"
              >
                <LinearGradient
                  colors={primaryColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.primary}
                >
                  <Text style={styles.primaryText}>{primaryLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

/** Label / value rows for showing record details inside a dialog. */
export const DialogDetails = ({ rows }: { rows: { label: string; value?: string }[] }) => (
  <View style={styles.details}>
    {rows.map((row, i) => (
      <View key={row.label} style={[styles.detailRow, i > 0 && styles.detailDivider]}>
        <Text style={styles.detailLabel}>{row.label}</Text>
        <Text style={styles.detailValue} numberOfLines={3}>
          {row.value || "—"}
        </Text>
      </View>
    ))}
  </View>
);

// ════════════════════════════════════════════════════════════════════════
//  Imperative API + host
// ════════════════════════════════════════════════════════════════════════

type HostRequest = Omit<AppDialogProps, "visible">;
type Listener = (request: HostRequest | null) => void;

let listener: Listener | null = null;
let pending: HostRequest | null | undefined;

const emit = (request: HostRequest | null) => {
  if (listener) listener(request);
  else pending = request; // host not mounted yet — deliver on mount
};

export const dialog = {
  /** Show any dialog configuration. */
  show(request: HostRequest) {
    emit(request);
  },
  hide() {
    emit(null);
  },
  /** One-button notice. Resolves when dismissed. */
  alert(
    title: string,
    message?: string,
    variant: DialogVariant = "info",
    options: Partial<HostRequest> = {}
  ): Promise<void> {
    return new Promise((resolve) => {
      const done = () => {
        emit(null);
        resolve();
      };
      emit({ variant, title, message, primaryLabel: "OK", onPrimary: done, onDismiss: done, ...options });
    });
  },
  /** Two-button question. Resolves true when confirmed. */
  confirm(options: {
    title: string;
    message?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: DialogVariant;
    icon?: any;
    lottie?: any;
  }): Promise<boolean> {
    return new Promise((resolve) => {
      const finish = (value: boolean) => {
        emit(null);
        resolve(value);
      };
      emit({
        variant: options.variant ?? "confirm",
        title: options.title,
        message: options.message,
        icon: options.icon,
        lottie: options.lottie,
        primaryLabel: options.confirmLabel ?? "Confirm",
        secondaryLabel: options.cancelLabel ?? "Cancel",
        onPrimary: () => finish(true),
        onSecondary: () => finish(false),
      });
    });
  },
  /** Blocking progress dialog. Returns a function that hides it. */
  loading(title: string, message?: string) {
    emit({ variant: "loading", title, message });
    return () => emit(null);
  },
};

/** Mount once near the app root (inside the theme provider). */
export const DialogHost = () => {
  const [request, setRequest] = useState<HostRequest | null>(null);
  const last = useRef<HostRequest | null>(null);

  useEffect(() => {
    listener = (next) => {
      if (next) last.current = next;
      setRequest(next);
    };
    if (pending !== undefined) {
      listener(pending);
      pending = undefined;
    }
    return () => {
      listener = null;
    };
  }, []);

  // Keep rendering the last request while the exit animation plays.
  const shown = request ?? last.current;
  if (!shown) return null;
  return <AppDialog visible={!!request} {...shown} />;
};

const styles = themedStyles((c) => ({
  backdrop: {
    flex: 1,
    backgroundColor: c.overlay,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backdropPress: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: c.surface,
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: c.border,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.28,
    shadowRadius: 30,
  },
  wash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    opacity: 0.9,
  },
  halo: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  haloRing: {
    position: "absolute",
    top: -8,
    left: -8,
    right: -8,
    bottom: -8,
    borderRadius: 66,
    borderWidth: 1.5,
    opacity: 0.9,
  },
  lottie: {
    width: 112,
    height: 112,
  },
  badge: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: c.text,
    textAlign: "center",
    letterSpacing: 0.2,
  },
  message: {
    fontSize: 14.5,
    lineHeight: 21,
    color: c.textSoft,
    textAlign: "center",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    alignSelf: "stretch",
    gap: 10,
    marginTop: 22,
  },
  actionsSpacer: {
    height: 6,
  },
  button: {
    flex: 1,
    borderRadius: 15,
    minHeight: 50,
  },
  secondary: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: c.borderStrong,
    backgroundColor: c.surface,
  },
  secondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
  },
  primaryWrap: {
    overflow: "hidden",
  },
  primary: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  primaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  progressTrack: {
    alignSelf: "stretch",
    height: 4,
    borderRadius: 2,
    marginTop: 22,
    marginBottom: 4,
    backgroundColor: c.primaryFaint,
    overflow: "hidden",
  },
  progressBar: {
    width: 120,
    height: 4,
  },
  progressFill: {
    flex: 1,
  },
  details: {
    alignSelf: "stretch",
    marginTop: 16,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
  },
  detailRow: {
    paddingVertical: 10,
  },
  detailDivider: {
    borderTopWidth: 1,
    borderTopColor: c.divider,
  },
  detailLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: c.textFaint,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: c.text,
    marginTop: 3,
  },
}));

