import React, { useEffect, useState } from "react";
import { Keyboard, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";

export const PRIMARY = BRAND.primary;
export const PRIMARY_MUTED = BRAND.primaryMuted;

export const sharedActiveTintColor = PRIMARY;
export const sharedInactiveTintColor = PRIMARY_MUTED;

const BAR_RADIUS = 30;
export const TAB_BAR_HEIGHT = 68;
// Gap between the floating pill and the bottom safe-area edge.
export const TAB_BAR_BOTTOM_GAP = 12;
// Breathing room between the last scroll item and the top of the pill.
const CONTENT_GAP = 16;

/**
 * Space a tab screen must leave at the bottom so its last item can scroll
 * fully above the floating bar, while still scrolling visibly behind it.
 * - contentPaddingBottom: use as `contentContainerStyle.paddingBottom`.
 * - barTop: distance from the screen bottom to the top edge of the pill
 *   (for anchoring FABs above the bar).
 */
export const useTabBarClearance = () => {
  const insets = useSafeAreaInsets();
  const barTop = insets.bottom + TAB_BAR_BOTTOM_GAP + TAB_BAR_HEIGHT;
  return { barTop, contentPaddingBottom: barTop + CONTENT_GAP };
};

// Single source of truth for every bottom-tab navigator in the app.
export const sharedTabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: sharedActiveTintColor,
  tabBarInactiveTintColor: sharedInactiveTintColor,
  tabBarHideOnKeyboard: true,
};

const useKeyboardVisible = () => {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () => setVisible(true));
    const hide = Keyboard.addListener(hideEvent, () => setVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return visible;
};

/**
 * Floating glass pill. The wrapper is absolutely positioned and fully
 * transparent, so page content scrolls behind the bar and shows around its
 * rounded corners and side margins — no full-width strip.
 */
export const GlassTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardVisible();

  const focusedOptions = descriptors[state.routes[state.index].key].options;
  if (focusedOptions.tabBarHideOnKeyboard && keyboardVisible) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrapper, { paddingBottom: insets.bottom + TAB_BAR_BOTTOM_GAP }]}
    >
      <GlassSurface radius={BAR_RADIUS} style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label =
            typeof options.tabBarLabel === "string"
              ? options.tabBarLabel
              : options.title ?? route.name;
          const tint = focused
            ? options.tabBarActiveTintColor ?? sharedActiveTintColor
            : options.tabBarInactiveTintColor ?? sharedInactiveTintColor;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: "tabLongPress", target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.item}
            >
              {options.tabBarIcon?.({ focused, color: tint, size: 18 })}
              <Text
                numberOfLines={1}
                style={[styles.label, { color: tint }]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </GlassSurface>
    </View>
  );
};

// Pass to `<Tab.Navigator tabBar={renderGlassTabBar}>`.
export const renderGlassTabBar = (props: BottomTabBarProps) => <GlassTabBar {...props} />;

type TabIconProps = {
  name: string;
  focused: boolean;
  size?: number;
};

export const TabIcon = ({ name, focused, size = 18 }: TabIconProps) => {
  if (focused) {
    return (
      <View style={styles.pillShadow}>
        <LinearGradient
          colors={BRAND.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.pill}
        >
          <View style={styles.pillSheen} />
          <Icon name={name} size={size} color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.pill}>
      <Icon name={name} size={size} color={PRIMARY_MUTED} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    height: TAB_BAR_HEIGHT,
    paddingHorizontal: 6,
    // Slightly opaque base so Android can cast the elevation shadow;
    // the glass gradient inside GlassSurface sits on top of it.
    backgroundColor: "rgba(255, 255, 255, 0.82)",
    elevation: 14,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    marginTop: 4,
  },
  pill: {
    width: 56,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pillShadow: {
    borderRadius: 15,
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: BRAND.primary,
  },
  pillSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 15,
    backgroundColor: "rgba(255, 255, 255, 0.12)",
  },
});
