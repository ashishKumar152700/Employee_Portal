// Screen/Asset/AssetUI.tsx
// Shared visual building blocks for the Asset module (Asset + My Tickets tabs).
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { BRAND } from "../../Global/GlassTheme";
import { themedStyles } from "../../Global/ThemeContext";

export const PAGE_BG = "#F4F7FB";

// Gradient palettes, all in the navy/blue family so the module stays on-brand
// while each device type still gets its own identity.
const GRADIENTS = {
  ocean: ["#00295A", "#0066C2"],
  indigo: ["#1E1B6B", "#4F46E5"],
  teal: ["#06425C", "#0E9F9A"],
  sky: ["#0B3D91", "#3B8BF6"],
  violet: ["#33196E", "#7C3AED"],
  slate: ["#1B2740", "#4B5B76"],
} as const;

export type DeviceTheme = {
  icon: any; // MaterialCommunityIcons glyph
  gradient: readonly [string, string];
};

const DEVICE_THEMES: { [key: string]: DeviceTheme } = {
  MOUSE: { icon: "mouse", gradient: GRADIENTS.sky },
  KEYBOARD: { icon: "keyboard-variant", gradient: GRADIENTS.teal },
  LAPTOP: { icon: "laptop", gradient: GRADIENTS.ocean },
  MONITOR: { icon: "monitor", gradient: GRADIENTS.indigo },
  "STORAGE DEVICE": { icon: "harddisk", gradient: GRADIENTS.slate },
  HEADPHONE: { icon: "headphones", gradient: GRADIENTS.violet },
  BIOMETRIC: { icon: "fingerprint", gradient: GRADIENTS.teal },
  PRINTER: { icon: "printer", gradient: GRADIENTS.slate },
  DOCKSTATION: { icon: "dock-window", gradient: GRADIENTS.violet },
  "DOCK STATION": { icon: "dock-window", gradient: GRADIENTS.violet },
  "LAPTOP CHARGER": { icon: "power-plug", gradient: GRADIENTS.ocean },
  PENDRIVE: { icon: "usb-flash-drive", gradient: GRADIENTS.sky },
  "PEN DRIVE": { icon: "usb-flash-drive", gradient: GRADIENTS.sky },
  SERVER: { icon: "server", gradient: GRADIENTS.indigo },
  HARDDISK: { icon: "harddisk", gradient: GRADIENTS.slate },
  "HARD DISK": { icon: "harddisk", gradient: GRADIENTS.slate },
  "LAPTOP BAG": { icon: "bag-personal", gradient: GRADIENTS.ocean },
  "TIME ATTENDANCE MACHINE": {
    icon: "clock-time-four-outline",
    gradient: GRADIENTS.indigo,
  },
  "EXTENSION BOARD": { icon: "power-socket-eu", gradient: GRADIENTS.teal },
};

// Allocated assets carry no category, so infer one from the asset code
// (e.g. RKT-MOUSE-0014, RKT-LAP-0099, EXT0005) and the model name.
const DEVICE_RULES: [RegExp, string, string][] = [
  [/MOUSE/, "MOUSE", "Mouse"],
  [/KEYBOARD|-KB-/, "KEYBOARD", "Keyboard"],
  [/CHARGER|ADAPTER/, "LAPTOP CHARGER", "Laptop Charger"],
  [/\bBAG\b|-BAG-/, "LAPTOP BAG", "Laptop Bag"],
  [/-LAP-|LAPTOP|LATITUDE|THINKPAD|MACBOOK|VOSTRO|INSPIRON|ELITEBOOK/, "LAPTOP", "Laptop"],
  [/-MON-|MONITOR/, "MONITOR", "Monitor"],
  [/HEADPHONE|HEADSET/, "HEADPHONE", "Headphone"],
  [/DOCK/, "DOCK STATION", "Dock Station"],
  [/PRINT/, "PRINTER", "Printer"],
  [/SERVER/, "SERVER", "Server"],
  [/PEN ?DRIVE|-PD-/, "PEN DRIVE", "Pen Drive"],
  [/HDD|HARD ?DISK|SSD|STORAGE/, "HARD DISK", "Storage"],
  [/BIOMETRIC|-BIO-/, "BIOMETRIC", "Biometric"],
  [/^EXT|EXTENSION/, "EXTENSION BOARD", "Extension Board"],
];

export const inferAssetType = (
  code: string,
  model: string
): { category: string; label: string } => {
  const text = `${code || ""} ${model || ""}`.toUpperCase().trim();
  for (const [pattern, category, label] of DEVICE_RULES) {
    if (pattern.test(text)) return { category, label };
  }
  return { category: "", label: "Device" };
};

export const getDeviceTheme = (category: string): DeviceTheme =>
  DEVICE_THEMES[(category || "").toUpperCase().trim()] || {
    icon: "devices",
    gradient: GRADIENTS.ocean,
  };

/** Gradient badge with a white device glyph and a soft top sheen. */
export const DeviceBadge = ({
  category,
  size = 48,
}: {
  category: string;
  size?: number;
}) => {
  const theme = getDeviceTheme(category);
  const radius = size * 0.3;
  return (
    <View
      style={[
        styles.badgeShadow,
        {
          borderRadius: radius,
          shadowColor: theme.gradient[1],
          // Android only casts elevation from a view with a background.
          backgroundColor: theme.gradient[0],
        },
      ]}
    >
      <LinearGradient
        colors={theme.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          { width: size, height: size, borderRadius: radius },
        ]}
      >
        <View style={[styles.badgeSheen, { height: size / 2 }]} />
        <MaterialCommunityIcons
          name={theme.icon}
          size={size * 0.52}
          color="#FFFFFF"
        />
      </LinearGradient>
    </View>
  );
};

/** Navy hero band that continues the app header, with soft decorations. */
export const HeroHeader = ({
  title,
  subtitle,
  children,
  style,
}: {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  style?: any;
}) => (
  <LinearGradient
    colors={BRAND.primaryGradient}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={[styles.hero, style]}
  >
    <View pointerEvents="none" style={styles.heroDecor}>
      <View style={[styles.heroCircle, styles.heroCircleRight]} />
      <View style={[styles.heroCircle, styles.heroCircleLeft]} />
    </View>
    <Text style={styles.heroTitle}>{title}</Text>
    <Text style={styles.heroSubtitle}>{subtitle}</Text>
    {children}
  </LinearGradient>
);

export const PrimaryButton = ({
  label,
  icon,
  onPress,
  style,
}: {
  label: string;
  icon?: any;
  onPress: () => void;
  style?: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.85}
    style={[styles.primaryTouch, style]}
  >
    <LinearGradient
      colors={BRAND.primaryGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.primaryButton}
    >
      {icon && <FontAwesome name={icon} size={14} color="#FFFFFF" />}
      <Text style={styles.primaryText}>{label}</Text>
    </LinearGradient>
  </TouchableOpacity>
);

export const SecondaryButton = ({
  label,
  onPress,
  style,
}: {
  label: string;
  onPress: () => void;
  style?: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.75}
    style={[styles.secondaryButton, style]}
  >
    <Text style={styles.secondaryText}>{label}</Text>
  </TouchableOpacity>
);

export type ViewMode = "grid" | "list";

/** Grid / list switch shared by My Assets and My Tickets. */
export const ViewToggle = ({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) => (
  <View style={styles.toggle}>
    {(["grid", "list"] as ViewMode[]).map((option) => {
      const active = mode === option;
      const icon = option === "grid" ? "view-grid-outline" : "format-list-bulleted";
      return (
        <TouchableOpacity
          key={option}
          onPress={() => onChange(option)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={option === "grid" ? "Grid view" : "List view"}
          accessibilityState={{ selected: active }}
          style={styles.toggleItem}
        >
          {active ? (
            <LinearGradient
              colors={BRAND.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.toggleActive}
            >
              <MaterialCommunityIcons name={icon} size={17} color="#FFFFFF" />
            </LinearGradient>
          ) : (
            <MaterialCommunityIcons
              name={icon}
              size={17}
              color={BRAND.primaryMuted}
            />
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

type DialogVariant = "confirm" | "success" | "error" | "cancel";

const DIALOG_ANIMATIONS: Partial<Record<DialogVariant, any>> = {
  success: require("../../assets/animations/success.json"),
  error: require("../../assets/animations/error.json"),
  cancel: require("../../assets/animations/cancel.json"),
};

type AssetDialogProps = {
  visible: boolean;
  variant: DialogVariant;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

/** One dialog style for every confirm / success / error prompt in the module. */
export const AssetDialog = ({
  visible,
  variant,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: AssetDialogProps) => {
  const translateY = useRef(new Animated.Value(40)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    translateY.setValue(40);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  const dismiss = onSecondary ?? onPrimary;
  const animation = DIALOG_ANIMATIONS[variant];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismiss}
    >
      <Animated.View style={[styles.dialogOverlay, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} />
        <Animated.View
          style={[styles.dialogCard, { transform: [{ translateY }] }]}
        >
          {animation ? (
            <LottieView
              source={animation}
              autoPlay
              loop={false}
              style={styles.dialogLottie}
            />
          ) : (
            <View style={styles.dialogBadgeRing}>
              <LinearGradient
                colors={BRAND.primaryGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.dialogBadge}
              >
                <FontAwesome name="cube" size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
          )}

          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>

          <View style={styles.dialogButtons}>
            {secondaryLabel && onSecondary && (
              <SecondaryButton
                label={secondaryLabel}
                onPress={onSecondary}
                style={styles.dialogButton}
              />
            )}
            <PrimaryButton
              label={primaryLabel}
              onPress={onPrimary}
              style={styles.dialogButton}
            />
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = themedStyles((c) => ({
  toggle: {
    flexDirection: "row",
    padding: 3,
    borderRadius: 12,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  toggleItem: {
    width: 36,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActive: {
    width: 36,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  badgeShadow: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  badge: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  badgeSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },

  // Hero
  hero: {
    paddingHorizontal: 20,
    paddingTop: 6,
    paddingBottom: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: "hidden",
  },
  heroDecor: {
    ...StyleSheet.absoluteFillObject,
  },
  heroCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.07)",
  },
  heroCircleRight: {
    width: 160,
    height: 160,
    top: -90,
    right: -40,
  },
  heroCircleLeft: {
    width: 90,
    height: 90,
    bottom: -55,
    left: -25,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.75)",
    marginTop: 3,
  },

  // Buttons
  primaryTouch: {
    borderRadius: 14,
    overflow: "hidden",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: 18,
    gap: 8,
  },
  primaryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  secondaryButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surface,
  },
  secondaryText: {
    color: c.accent,
    fontSize: 15,
    fontWeight: "600",
  },

  // Dialog
  dialogOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    backgroundColor: c.overlay,
  },
  dialogCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: c.surface,
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    alignItems: "center",
    elevation: 16,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  dialogLottie: {
    width: 120,
    height: 120,
    marginTop: -8,
    marginBottom: -4,
  },
  dialogBadgeRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: BRAND.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  dialogBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: c.accent,
    textAlign: "center",
  },
  dialogMessage: {
    fontSize: 14,
    lineHeight: 20,
    color: BRAND.inkSoft,
    textAlign: "center",
    marginTop: 6,
  },
  dialogButtons: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginTop: 22,
  },
  dialogButton: {
    flex: 1,
  },
}));
