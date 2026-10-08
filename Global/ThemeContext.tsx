// Global/ThemeContext.tsx
// App-wide light / dark theming.
//
// How it works:
// - PALETTES holds the two colour sets. The navy brand fill (headers, hero
//   cards, gradients, primary buttons) is the same in both; only surfaces,
//   text and tints change. Navy used as *foreground* (text/icons on cards)
//   becomes `accent`, which is light blue in dark mode so it stays readable.
// - `C` and `themedStyles()` resolve against the active mode at render time,
//   so components don't need a hook to read colours.
// - Changing the mode remounts the app tree (navigation state is restored by
//   App.tsx), which re-renders every screen with the new palette.
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark";

const NAVY = "rgb(0, 41, 87)";

const light = {
  // Brand (fills)
  primary: NAVY,
  primaryLight: "rgb(0, 86, 160)",
  primaryGradient: ["rgb(0, 41, 87)", "rgb(0, 86, 160)"] as readonly [string, string],
  heroGradient: ["#001A3A", "rgb(0, 41, 87)", "#0058A8"] as readonly [string, string, string],
  // Brand (foreground on surfaces)
  accent: NAVY,
  link: "rgb(0, 86, 160)",
  primaryFaint: "rgba(0, 41, 87, 0.06)",
  primaryMuted: "rgba(0, 41, 87, 0.48)",

  // Surfaces
  background: "#F4F7FB",
  surface: "#FFFFFF",
  surfaceAlt: "#F1F5FA",
  surfaceInput: "#F8FAFD",
  elevated: "#FFFFFF",
  skeleton: "#EEF2F7",

  // Lines
  border: "rgba(0, 41, 87, 0.08)",
  borderStrong: "rgba(0, 41, 87, 0.16)",
  divider: "rgba(0, 41, 87, 0.10)",

  // Text
  text: "#14213D",
  textSoft: "rgba(20, 33, 61, 0.62)",
  textFaint: "rgba(20, 33, 61, 0.38)",
  placeholder: "#A3AEBD",
  onPrimary: "#FFFFFF",

  // Status
  successText: "#166534",
  successBg: "#DCFCE7",
  successSolid: "#059669",
  warningText: "#92400E",
  warningBg: "#FEF3C7",
  warningSolid: "#D97706",
  dangerText: "#B91C1C",
  dangerBg: "#FEE2E2",
  dangerSolid: "#D64545",
  infoText: "#3730A3",
  infoBg: "#E0E7FF",
  violetText: "#7E22CE",
  violetBg: "#F3E8FF",
  neutralText: "#374151",
  neutralBg: "#F3F4F6",

  // Chrome
  overlay: "rgba(0, 22, 48, 0.55)",
  shadow: "#001A38",
  tabBar: "rgba(255, 255, 255, 0.82)",
  glass: ["rgba(255, 255, 255, 0.94)", "rgba(240, 245, 252, 0.88)"] as readonly [string, string],
  glassHighlight: "rgba(255, 255, 255, 0.95)",
  glassBorder: "rgba(0, 41, 87, 0.08)",
};

export type ThemeColors = typeof light;

const dark: ThemeColors = {
  primary: NAVY,
  primaryLight: "#3D8EF0",
  primaryGradient: ["#00336B", "#0B64C0"],
  heroGradient: ["#00122A", "#002450", "#004A92"],
  accent: "#8EC5FF",
  link: "#8EC5FF",
  primaryFaint: "rgba(142, 197, 255, 0.10)",
  primaryMuted: "rgba(170, 198, 235, 0.55)",

  background: "#060D1A",
  surface: "#0E1A2E",
  surfaceAlt: "#14233C",
  surfaceInput: "#101E35",
  elevated: "#15253F",
  skeleton: "#1A2A44",

  border: "rgba(148, 178, 222, 0.14)",
  borderStrong: "rgba(148, 178, 222, 0.26)",
  divider: "rgba(148, 178, 222, 0.12)",

  text: "#E7EEF8",
  textSoft: "rgba(214, 226, 243, 0.68)",
  textFaint: "rgba(214, 226, 243, 0.40)",
  placeholder: "rgba(214, 226, 243, 0.35)",
  onPrimary: "#FFFFFF",

  successText: "#4ADE80",
  successBg: "rgba(34, 197, 94, 0.14)",
  successSolid: "#10B981",
  warningText: "#FBBF24",
  warningBg: "rgba(245, 158, 11, 0.15)",
  warningSolid: "#F59E0B",
  dangerText: "#F87171",
  dangerBg: "rgba(239, 68, 68, 0.15)",
  dangerSolid: "#EF4444",
  infoText: "#A5B4FC",
  infoBg: "rgba(99, 102, 241, 0.18)",
  violetText: "#C4B5FD",
  violetBg: "rgba(139, 92, 246, 0.18)",
  neutralText: "#CBD5E1",
  neutralBg: "rgba(148, 163, 184, 0.15)",

  overlay: "rgba(0, 0, 0, 0.62)",
  shadow: "#000000",
  tabBar: "rgba(14, 26, 46, 0.92)",
  glass: ["rgba(22, 38, 64, 0.97)", "rgba(14, 26, 46, 0.94)"],
  glassHighlight: "rgba(255, 255, 255, 0.08)",
  glassBorder: "rgba(148, 178, 222, 0.16)",
};

export const PALETTES: Record<ThemeMode, ThemeColors> = { light, dark };

// ─── Active mode (module level so styles/colours resolve without hooks) ────
let currentMode: ThemeMode = "light";
export const getThemeMode = () => currentMode;

/** Active palette. Read inside render (JSX, style factories), never cache it at module load. */
export const C: ThemeColors = new Proxy({} as ThemeColors, {
  get: (_target, key) => PALETTES[currentMode][key as keyof ThemeColors],
});

/**
 * Like StyleSheet.create, but the factory receives the active palette.
 * One StyleSheet per mode is created lazily and cached.
 */
export function themedStyles<
  T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>,
>(factory: (c: ThemeColors) => T & StyleSheet.NamedStyles<any>): T {
  const cache: Partial<Record<ThemeMode, T>> = {};
  const resolve = () => {
    if (!cache[currentMode]) {
      cache[currentMode] = StyleSheet.create(factory(PALETTES[currentMode]) as any) as T;
    }
    return cache[currentMode] as T;
  };
  return new Proxy({} as T, {
    get: (_target, key) => (resolve() as any)[key],
  });
}

// ─── Provider ───────────────────────────────────────────────────────────────
const STORAGE_KEY = "appThemeMode";

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  isDark: false,
  colors: light,
  setMode: () => {},
  toggle: () => {},
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(currentMode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved === "light" || saved === "dark") {
          currentMode = saved;
          setModeState(saved);
        }
      } catch {
        // Fall back to light.
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    // Update the module-level mode *before* re-rendering so every style and
    // colour read during the next render resolves to the new palette.
    currentMode = next;
    setModeState(next);
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setMode(currentMode === "dark" ? "light" : "dark");
  }, [setMode]);

  // Avoid a light-mode flash before the saved preference is read.
  if (!ready) return null;

  return (
    <ThemeContext.Provider
      value={{ mode, isDark: mode === "dark", colors: PALETTES[mode], setMode, toggle }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
