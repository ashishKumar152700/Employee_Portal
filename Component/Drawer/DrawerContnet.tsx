import React, { useEffect, useState } from "react";
import {
  View,
  Image,
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
    profilePic:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU",
  };

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
    // Direct comparison - currentRoute should be the actual screen name
    const isActive = currentRoute === item.route;

    // console.log(`[Drawer] Rendering ${item.route}, isActive: ${isActive}, currentRoute: ${currentRoute}`);

    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.menuItem,
          isActive && styles.activeMenuItem,
          isActive && { borderWidth: 4, borderColor: "#FFFFFF" }, // Debug border
        ]}
        onPress={() => {
          // console.log(`[Drawer] Navigating to ${item.route}`);
          setCurrentRoute(item.route); // Add this line to update immediately
          navigation.navigate(item.route as never);
          onClose();
        }}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemContent}>
          <MaterialIcons
            name={item.icon as any}
            size={22}
            color={isActive ? "#FFFFFF" : "#555555"}
            style={styles.menuIcon}
          />
          <Text
            style={[
              styles.menuText,
              isActive && styles.activeMenuText,
              // isActive && { fontWeight: 'bold', fontSize: 17 } // Make it more obvious
            ]}
          >
            {item.name}
          </Text>
        </View>
        {isActive && (
          <View style={styles.activeIndicator}>
            <View style={styles.activeIndicatorInner} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderMachineStatus = () => {
    if (userDetails?.user?.role !== "ADMIN") return null;

    return (
      <View style={styles.statusContainer}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusHeaderText}>System Status</Text>
        </View>
        <TouchableOpacity
          style={styles.statusItem}
          onPress={checkMachineStatus}
          activeOpacity={0.7}
        >
          <View style={styles.statusItemContent}>
            <MaterialIcons
              name="memory"
              size={22}
              color="#666666"
              style={styles.menuIcon}
            />
            <Text style={styles.statusText}>Biometric Device</Text>
            <View style={styles.statusIndicatorContainer}>
              {statusLoading ? (
                <MaterialIcons name="refresh" size={16} color="#ffa500" />
              ) : (
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: machineStatus ? "#28a745" : "#dc3545" },
                  ]}
                />
              )}
              <Text
                style={[
                  styles.statusLabel,
                  { color: machineStatus ? "#28a745" : "#dc3545" },
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
        colors={["rgba(0, 41, 87, 0.95)", "rgba(0, 41, 87, 0.85)"]}
        style={styles.headerGradient}
      >
        <View style={styles.userInfoContainer}>
          <Image
            source={{ uri: userInfo.profilePic }}
            style={styles.profilePic}
          />
          <View style={styles.userTextContainer}>
            <Text style={styles.username}>{userInfo.username}</Text>
            <Text style={styles.userRole}>Employee</Text>
            <Text style={styles.email}>{userInfo.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.drawerContent}>
        <View style={styles.menuContainer}>
          {renderMachineStatus()}
          {menuItems.map((item) => renderMenuItem(item))}
        </View>
      </ScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={22} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
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
    paddingTop: 50,
    paddingBottom: 20,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  userTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
  },
  drawerContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  menuContainer: {
    paddingTop: 10,
  },
  menuItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
  },
  activeMenuItem: {
    backgroundColor: "rgb(0, 41, 87)",
    shadowColor: "rgb(0, 41, 87)",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
    width: 22,
  },
  menuText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333333",
    flex: 1,
  },
  activeMenuText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  activeIndicator: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  activeIndicatorInner: {
    width: 4,
    height: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  logoutContainer: {
    margin: 12,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(0, 41, 87, 0.95)",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 12,
  },
  statusContainer: {
    marginHorizontal: 12,
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    overflow: "hidden",
  },
  statusHeader: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#e9ecef",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  statusHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#495057",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statusItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  statusItemContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#333333",
    flex: 1,
  },
  statusIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
  },
});

export default CustomDrawerContent;
