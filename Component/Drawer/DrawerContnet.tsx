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
import LottieView from "lottie-react-native";
import { useNavigation } from "@react-navigation/native";
import { clearAllCache } from "../../Services/Timesheet/timesheetService";

export const CustomDrawerContent = ({
  onClose,
  isDrawerOpen,
  currentRoute,
  setCurrentRoute,
}: any) => {
  const navigation = useNavigation();

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
            color={isActive ? "#FFFFFF" : "rgb(0, 41, 87)"}
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
          color={isActive ? "rgba(255,255,255,0.9)" : "rgba(0,41,87,0.35)"}
        />
      </View>
    );

    return (
      <TouchableOpacity
        key={item.route}
        style={styles.menuItem}
        onPress={() => {
          setCurrentRoute(item.route);
          navigation.navigate(item.route as never);
          onClose();
        }}
        activeOpacity={0.75}
      >
        {isActive ? (
          <LinearGradient
            colors={["rgb(0, 41, 87)", "rgb(0, 86, 160)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.menuItemInner}
          >
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

    return (
      <View style={styles.statusContainer}>
        <Text style={styles.sectionLabel}>System Status</Text>
        <TouchableOpacity
          style={styles.statusCard}
          onPress={checkMachineStatus}
          activeOpacity={0.75}
        >
          <View style={styles.statusIconTile}>
            <MaterialIcons name="memory" size={18} color="rgb(0, 41, 87)" />
          </View>
          <View style={styles.statusTextBlock}>
            <Text style={styles.statusText}>Biometric Device</Text>
            <View style={styles.statusIndicatorContainer}>
              {statusLoading ? (
                <MaterialIcons name="refresh" size={12} color="#E6A100" />
              ) : (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: machineStatus ? "#28A745" : "#DC3545" },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.statusLabel,
                  { color: machineStatus ? "#28A745" : "#DC3545" },
                ]}
              >
                {statusLoading
                  ? "Checking..."
                  : machineStatus
                    ? "Online"
                    : "Offline"}
              </Text>
            </View>
          </View>
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
    <View style={styles.container}>
      <LinearGradient
        colors={["rgb(0, 41, 87)", "rgb(0, 86, 160)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <LottieView
          source={require("../../assets/animations/header.json")}
          autoPlay
          loop
          style={styles.headerLottie}
        />
        <View style={styles.headerOverlay} />
        <View style={styles.userInfoContainer}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitials}>{initials || "U"}</Text>
            </View>
          </View>
          <View style={styles.userTextContainer}>
            <Text style={styles.username} numberOfLines={1}>
              {userInfo.username}
            </Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>
                {String(userInfo.role).toUpperCase()}
              </Text>
            </View>
            <Text style={styles.email} numberOfLines={1}>
              {userInfo.email}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.drawerContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.sectionLabel}>Menu</Text>
          {renderMachineStatus()}
          {menuItems.map((item) => renderMenuItem(item))}
          <View style={styles.menuFooter}>
            <MaterialIcons
              name="verified-user"
              size={13}
              color="rgba(0,41,87,0.4)"
            />
            <Text style={styles.menuFooterText}>Employee Self Service</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          onPress={handleLogout}
          activeOpacity={0.85}
          style={styles.logoutTouch}
        >
          <LinearGradient
            colors={["rgb(0, 41, 87)", "rgb(0, 86, 160)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.logoutButton}
          >
            <MaterialIcons name="logout" size={20} color="white" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  headerGradient: {
    paddingTop: 34,
    paddingBottom: 34,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(0, 41, 87, 0.45)",
  },
  headerLottie: {
    position: "absolute",
    left: -20,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.25,
    width: "160%",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 41, 87, 0.45)",
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarRing: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  userTextContainer: {
    marginLeft: 14,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 5,
  },
  roleBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginBottom: 5,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.8,
  },
  email: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.75)",
  },
  drawerContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  menuContainer: {
    paddingTop: 14,
    paddingBottom: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(0, 41, 87, 0.45)",
    textTransform: "uppercase",
    letterSpacing: 1.1,
    marginHorizontal: 26,
    marginBottom: 8,
  },
  menuItem: {
    marginHorizontal: 14,
    marginVertical: 3,
    borderRadius: 14,
    overflow: "hidden",
  },
  menuItemInner: {
    backgroundColor: "#F7F9FC",
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  iconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0, 41, 87, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconTileActive: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  menuText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1F2A37",
    flex: 1,
    marginRight: 8,
  },
  activeMenuText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  menuFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 18,
    marginBottom: 6,
  },
  menuFooterText: {
    fontSize: 11,
    color: "rgba(0, 41, 87, 0.4)",
    marginLeft: 6,
    letterSpacing: 0.3,
  },
  logoutContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "rgba(0, 41, 87, 0.07)",
  },
  logoutTouch: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "rgb(0, 41, 87)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  statusContainer: {
    marginBottom: 6,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 14,
    marginBottom: 4,
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0, 41, 87, 0.07)",
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  statusIconTile: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0, 41, 87, 0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statusTextBlock: {
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2A37",
    marginBottom: 2,
  },
  statusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginLeft: 3,
  },
});

export default CustomDrawerContent;
