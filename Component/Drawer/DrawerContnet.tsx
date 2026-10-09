import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector, useDispatch } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { clearAllCache } from "../../Services/Timesheet/timesheetService";
import { BRAND, GlassSurface } from "../../Global/GlassTheme";
import { themedStyles, C, useTheme } from "../../Global/ThemeContext";

export const CustomDrawerContent = ({
  onClose,
  isDrawerOpen,
  currentRoute,
  setCurrentRoute,
}: any) => {
  const navigation = useNavigation();
  // The drawer Modal is edge-to-edge (RN 0.81 forces translucent system bars),
  // so the header and footer pad for the status bar and gesture bar themselves.
  const insets = useSafeAreaInsets();
  const { isDark, toggle: toggleTheme } = useTheme();

  const [machineStatus, setMachineStatus] = useState<boolean>(true);
  const [statusLoading, setStatusLoading] = useState<boolean>(false);
  const userDetails = useSelector((state: any) => state.userDetails);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isDrawerOpen && userDetails?.user?.role === "ADMIN") {
      checkMachineStatus();
    }
  }, [isDrawerOpen]);

  // Real-time machine status check every 10 seconds for ADMIN
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (userDetails?.user?.role === "ADMIN" && isDrawerOpen) {
      interval = setInterval(() => {
        checkMachineStatus();
      }, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isDrawerOpen, userDetails?.user?.role]);

  const userInfo = {
    username: userDetails?.user?.name || "User",
    email: userDetails?.user?.email || "email@example.com",
    role: userDetails?.user?.role || "Employee",
  };

  const initials = userInfo.username
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word: string) => (word[0] ? word[0].toUpperCase() : ""))
    .join("");

  const menuItems = [
    {
      name: "Attendance",
      icon: "fingerprint",
      route: "Attendance",
    },
    {
      name: "Timesheet",
      icon: "keyboard",
      route: "Timesheet",
    },
    {
      name: "Ask for Assets",
      icon: "mouse",
      route: "AssetModule",
    },
    {
      name: "Leave Section",
      icon: "beach-access",
      route: "MyLeaves",
    },
    {
      name: "Leave Approval",
      icon: "fact-check",
      route: "LeaveRequest",
    },
    {
      name: "Payroll",
      icon: "payments",
      route: "Payroll",
    },
  ];

  // Development builds only (e.g. Expo Go via `npm run dev`): effect playgrounds.
  const devItems = __DEV__
    ? [{ name: "Burn effect demo", icon: "local-fire-department", route: "BurnDemo" }]
    : [];

  const checkMachineStatus = async () => {
    try {
      setStatusLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setMachineStatus(true);
    } catch (error) {
      console.error("Error checking machine status:", error);
      setMachineStatus(true);
    } finally {
      setStatusLoading(false);
    }
  };

  const renderMenuItem = (item: any) => {
    const isActive = currentRoute === item.route;

    const row = (
      <View style={styles.menuItemContent}>
        <View style={[styles.iconTile, isActive && styles.iconTileActive]}>
          <MaterialIcons
            name={item.icon as any}
            size={18}
            color={isActive ? "#FFFFFF" : C.accent}
          />
        </View>
        <Text
          style={[styles.menuText, isActive && styles.activeMenuText]}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        <MaterialIcons
          name="chevron-right"
          size={20}
          color={isActive ? "rgba(255,255,255,0.85)" : C.primaryMuted}
        />
      </View>
    );

    return (
      <TouchableOpacity
        key={item.route}
        style={[styles.menuItem, isActive && styles.menuItemActive]}
        onPress={() => {
          setCurrentRoute(item.route);
          navigation.navigate(item.route as never);
          onClose();
        }}
        activeOpacity={0.75}
      >
        {isActive ? (
          <LinearGradient
            colors={BRAND.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuItemInner}
          >
            <View style={styles.activeSheen} />
            {row}
          </LinearGradient>
        ) : (
          <View style={styles.menuItemInner}>{row}</View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMachineStatus = () => {
    if (userDetails?.user?.role !== "ADMIN") return null;

    const statusColor = statusLoading
      ? BRAND.warning
      : machineStatus
        ? BRAND.success
        : BRAND.danger;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>System Status</Text>
        <TouchableOpacity onPress={checkMachineStatus} activeOpacity={0.8}>
          <GlassSurface radius={16} style={styles.statusCard}>
            <View style={styles.iconTile}>
              <MaterialIcons name="memory" size={18} color={C.accent} />
            </View>
            <View style={styles.statusTextBlock}>
              <Text style={styles.statusText}>Biometric Device</Text>
              <Text style={styles.statusSubText}>Tap to refresh</Text>
            </View>
            <View style={[styles.statusChip, { borderColor: statusColor }]}>
              {statusLoading ? (
                <MaterialIcons name="refresh" size={11} color={statusColor} />
              ) : (
                <View
                  style={[styles.statusDot, { backgroundColor: statusColor }]}
                />
              )}
              <Text style={[styles.statusLabel, { color: statusColor }]}>
                {statusLoading
                  ? "Checking"
                  : machineStatus
                    ? "Online"
                    : "Offline"}
              </Text>
            </View>
          </GlassSurface>
        </TouchableOpacity>
      </View>
    );
  };

  const handleLogout = async () => {
    console.log(" [Logout] Starting logout process...");
    try {
      await AsyncStorage.clear();
      console.log(" [Logout] AsyncStorage cleared");

      await clearAllCache();
      console.log(" [Logout] Service cache cleared");

      dispatch({ type: "RESET_ALL_STATE" });
      console.log(" [Logout] Redux state reset");

      dispatch({ type: "userDetails", payload: {} });
      dispatch({ type: "managerInfo", payload: [] });
      dispatch({ type: "punchInfo", payload: [] });
      dispatch({ type: "leaveDetails", payload: {} });
      dispatch({ type: "calendarData", payload: [] });
      dispatch({ type: "todayPunch", payload: null });

      dispatch({ type: "SET_TIMESHEET_TASKS", payload: [] });
      dispatch({ type: "SET_TIMESHEET_PROJECTS", payload: [] });
      dispatch({ type: "SET_MONTHLY_TIMESHEET_DATA", payload: {} });
      dispatch({ type: "SET_SELECTED_TIMESHEET_DATE", payload: null });

      dispatch({ type: "SET_ASSET_CATEGORIES", payload: [] });
      dispatch({ type: "SET_MY_TICKETS", payload: [] });
      dispatch({
        type: "SET_TICKET_STATS",
        payload: {
          total: 0,
          pending: 0,
          approved: 0,
          allocated: 0,
          rejected: 0,
          cancelled: 0,
        },
      });
      dispatch({ type: "SET_ASSET_LOADING", payload: false });
      dispatch({ type: "SET_TICKET_LOADING", payload: false });
      dispatch({ type: "SET_RAISING_TICKET", payload: null });
      dispatch({ type: "SET_CANCELLING_TICKET", payload: null });

      console.log(" [Logout] Complete logout cleanup finished");

      onClose();
    } catch (e) {
      console.error(" [Logout] Failed during logout cleanup:", e);
    }
  };

  return (
    <LinearGradient
      colors={[C.surfaceAlt, C.surface]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.container}
    >
      <LinearGradient
        colors={BRAND.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.headerGradient, { paddingTop: insets.top + 16 }]}
      >
        {/*
          Decorations live in their own clipped layer, rendered before the card
          so the card always sits above them. They are positioned to stay
          entirely in the bands above and below the card, so nothing shows
          through its frosted surface.
        */}
        <View pointerEvents="none" style={styles.decorLayer}>
          <View
            style={[styles.circle, styles.circleLarge, { top: insets.top - 92 }]}
          />
          <View
            style={[styles.ring, { top: insets.top - 26 }]}
          />
          <View style={[styles.circle, styles.circleBottom]} />
        </View>

        <View style={styles.headerTopRow}>
          <Text style={styles.brandText} numberOfLines={1} adjustsFontSizeToFit>
            Employee Self Service
          </Text>
          {/* Light / dark switch */}
          <TouchableOpacity
            onPress={toggleTheme}
            activeOpacity={0.85}
            style={styles.themeToggle}
            accessibilityRole="switch"
            accessibilityState={{ checked: isDark }}
            accessibilityLabel="Dark mode"
          >
            <View style={[styles.themeKnob, isDark ? styles.themeKnobRight : styles.themeKnobLeft]} />
            <View style={styles.themeIcon}>
              <MaterialIcons
                name="light-mode"
                size={14}
                color={isDark ? "rgba(255,255,255,0.6)" : C.primary}
              />
            </View>
            <View style={styles.themeIcon}>
              <MaterialIcons
                name="dark-mode"
                size={14}
                color={isDark ? C.primary : "rgba(255,255,255,0.6)"}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            activeOpacity={0.75}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="close" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <GlassSurface tone="dark" radius={20} style={styles.userCard}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials || "U"}</Text>
            </View>
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.username} numberOfLines={1}>
              {userInfo.username}
            </Text>
            <Text style={styles.email} numberOfLines={1}>
              {userInfo.email}
            </Text>
            <View style={styles.roleBadge}>
              <MaterialIcons
                name="verified"
                size={11}
                color="rgba(255,255,255,0.9)"
              />
              <Text style={styles.roleBadgeText}>
                {String(userInfo.role).toUpperCase()}
              </Text>
            </View>
          </View>
        </GlassSurface>
      </LinearGradient>

      <ScrollView
        style={styles.drawerContent}
        contentContainerStyle={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderMachineStatus()}
        {devItems.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Developer</Text>
            {devItems.map((item) => renderMenuItem(item))}
          </View>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Menu</Text>
          {menuItems.map((item) => renderMenuItem(item))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity onPress={handleLogout} activeOpacity={0.8}>
          <GlassSurface radius={16} style={styles.logoutButton}>
            <View style={styles.logoutIconTile}>
              <MaterialIcons name="logout" size={18} color={BRAND.danger} />
            </View>
            <Text style={styles.logoutButtonText}>Logout</Text>
            <MaterialIcons
              name="chevron-right"
              size={20}
              color={C.primaryMuted}
            />
          </GlassSurface>
        </TouchableOpacity>
        <View style={styles.footerMeta}>
          <MaterialIcons
            name="verified-user"
            size={12}
            color={C.primaryMuted}
          />
          <Text style={styles.footerMetaText}>Secured session</Text>
        </View>
      </View>
    </LinearGradient>
  );
};

const H_GUTTER = 16;
const HEADER_RADIUS = 28;
const HEADER_BOTTOM_PADDING = 22;

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
  },

  // Header
  headerGradient: {
    paddingBottom: HEADER_BOTTOM_PADDING,
    paddingHorizontal: H_GUTTER,
    borderBottomRightRadius: HEADER_RADIUS,
    overflow: "hidden",
  },
  decorLayer: {
    ...StyleSheet.absoluteFillObject,
    borderBottomRightRadius: HEADER_RADIUS,
    overflow: "hidden",
  },
  circle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  // Top-right, partly off-screen; its bottom edge stays above the card.
  circleLarge: {
    width: 150,
    height: 150,
    right: -50,
  },
  // Bottom-left, partly off-screen; only peeks into the band below the card.
  circleBottom: {
    width: 110,
    height: 110,
    left: -36,
    bottom: -(110 - (HEADER_BOTTOM_PADDING - 4)),
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  // Small outline ring, kept above the brand label row.
  ring: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    right: 84,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  brandText: {
    flex: 1,
    marginRight: 8,
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.7)",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    width: 60,
    height: 30,
    borderRadius: 15,
    padding: 3,
    marginRight: 10,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  themeKnob: {
    position: "absolute",
    top: 3,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  themeKnobLeft: {
    left: 3,
  },
  themeKnobRight: {
    left: 31,
  },
  themeIcon: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
  },
  avatarRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  userTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  username: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  email: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 8,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
    marginLeft: 4,
  },

  // Body
  drawerContent: {
    flex: 1,
  },
  menuContainer: {
    paddingTop: 18,
    paddingBottom: 12,
  },
  section: {
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: c.primaryMuted,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginHorizontal: H_GUTTER + 4,
    marginBottom: 8,
  },
  menuItem: {
    marginHorizontal: H_GUTTER - 4,
    marginVertical: 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItemActive: {
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
    backgroundColor: BRAND.primary,
  },
  menuItemInner: {
    borderRadius: 14,
  },
  activeSheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconTileActive: {
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "500",
    color: BRAND.ink,
    flex: 1,
    marginRight: 8,
  },
  activeMenuText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },

  // Status card
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: H_GUTTER - 4,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: BRAND.ink,
  },
  statusSubText: {
    fontSize: 11,
    color: BRAND.inkSoft,
    marginTop: 1,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 5,
  },

  // Footer
  footer: {
    paddingHorizontal: H_GUTTER - 4,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BRAND.primaryBorder,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  logoutIconTile: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "rgba(214, 69, 69, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(214, 69, 69, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  logoutButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: BRAND.ink,
  },
  footerMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  footerMetaText: {
    fontSize: 11,
    color: c.primaryMuted,
    marginLeft: 5,
    letterSpacing: 0.3,
  },
}));

export default CustomDrawerContent;
