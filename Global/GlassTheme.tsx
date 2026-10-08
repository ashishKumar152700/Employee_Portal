import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { C } from "./ThemeContext";

// Brand tokens used across navigation surfaces and redesigned screens.
// Resolved against the active theme on every read, so they follow
// light / dark mode. `primary` / `primaryGradient` are fills (navy in both
// modes); use `accent` for navy-as-text so it stays readable in dark mode.
type Brand = {
  primary: string;
  primaryLight: string;
  primaryGradient: readonly [string, string];
  primaryMuted: string;
  primaryFaint: string;
  primaryBorder: string;
  accent: string;
  ink: string;
  inkSoft: string;
  shadow: string;
  success: string;
  danger: string;
  warning: string;
};

const brandGetters: { [K in keyof Brand]: () => Brand[K] } = {
  primary: () => C.primary,
  primaryLight: () => C.primaryLight,
  primaryGradient: () => C.primaryGradient,
  primaryMuted: () => C.primaryMuted,
  primaryFaint: () => C.primaryFaint,
  primaryBorder: () => C.border,
  accent: () => C.accent,
  ink: () => C.text,
  inkSoft: () => C.textSoft,
  shadow: () => C.shadow,
  success: () => C.successSolid,
  danger: () => C.dangerSolid,
  warning: () => C.warningSolid,
};

export const BRAND: Brand = new Proxy({} as Brand, {
  get: (_target, key) => brandGetters[key as keyof Brand]?.(),
});

// Frosted-glass tokens. Without a native blur, the "glass" look is built from
// stacked translucent gradients, a bright top highlight and a tinted hairline.
export const GLASS = {
  get light() {
    return C.glass;
  },
  dark: ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.1)"] as const,
  get highlightLight() {
    return C.glassHighlight;
  },
  highlightDark: "rgba(255, 255, 255, 0.28)",
  get borderLight() {
    return C.glassBorder;
  },
  borderDark: "rgba(255, 255, 255, 0.2)",
};

type GlassSurfaceProps = {
  tone?: "light" | "dark";
  radius?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** A frosted panel: translucent gradient body + top-edge sheen + hairline border. */
export const GlassSurface = ({
  tone = "light",
  radius = 16,
  style,
  children,
}: GlassSurfaceProps) => {
  const isDark = tone === "dark";
  return (
    <View
      style={[
        styles.surface,
        {
          borderRadius: radius,
          borderColor: isDark ? GLASS.borderDark : GLASS.borderLight,
          borderWidth: isDark ? 1 : StyleSheet.hairlineWidth * 2,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={isDark ? GLASS.dark : GLASS.light}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: radius }]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.sheen,
          {
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            backgroundColor: isDark ? GLASS.highlightDark : GLASS.highlightLight,
          },
        ]}
      />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  surface: {
    overflow: "hidden",
  },
  sheen: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
  },
});
