import React from "react";
import { StyleSheet, View, ViewStyle, StyleProp } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Primary brand palette shared by navigation surfaces (drawer, tab bars).
export const BRAND = {
  primary: "rgb(0, 41, 87)",
  primaryLight: "rgb(0, 86, 160)",
  primaryGradient: ["rgb(0, 41, 87)", "rgb(0, 86, 160)"] as const,
  primaryMuted: "rgba(0, 41, 87, 0.48)",
  primaryFaint: "rgba(0, 41, 87, 0.06)",
  primaryBorder: "rgba(0, 41, 87, 0.08)",
  ink: "#14213D",
  inkSoft: "rgba(20, 33, 61, 0.62)",
  shadow: "#001A38",
  success: "#1E9E5A",
  danger: "#D64545",
  warning: "#E6A100",
};

// Frosted-glass tokens. Without a native blur, the "glass" look is built from
// stacked translucent gradients, a bright top highlight and a tinted hairline.
export const GLASS = {
  light: ["rgba(255, 255, 255, 0.94)", "rgba(240, 245, 252, 0.88)"] as const,
  dark: ["rgba(255, 255, 255, 0.12)", "rgba(255, 255, 255, 0.1)"] as const,
  highlightLight: "rgba(255, 255, 255, 0.95)",
  highlightDark: "rgba(255, 255, 255, 0.28)",
  borderLight: "rgba(0, 41, 87, 0.08)",
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
