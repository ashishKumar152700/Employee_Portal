import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Modal, Pressable, Animated, useWindowDimensions } from "react-native";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import * as Font from "expo-font";
import LottieView from "lottie-react-native";
import BottomNavForAsset from "../BottomNav/BottomNavForAsset";
import MyTickets from "../../Screen/Asset/MyTickets";
import CustomDrawerContent from "./DrawerContnet";
import { LoadingScreen } from "../Feedback/LoadingScreen";
import Ionicons from "react-native-vector-icons/Ionicons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import LeaveRequest from "../../Screen/LeaveRequestList/LeaveRequest";
import ProfilePage from "../../Screen/Profile/Testing";
import BottomTabNavigator from "../BottomNav/BottomNav";
import BottomTabNavLeave from "../BottomNav/BottomNavForLeave";
import Dashboard from "../../Screen/DashBoard/DashBoard";
import LoanRequestForm from "../../Screen/LoadRequest/LoanRequestForm";
import SalaryAdvanceRequestForm from "../../Screen/SalaryAdvance/SalaryAdvanceRequestForm";
import ReimbursementForm from "../../Screen/Reimbursement/ReimbursementForm";
import AddEmployeeRequestForm from "../../Screen/AddEmpToTeam/AddEmployeeRequestForm";
import OvertimeRequestForm from "../../Screen/Overtime/OvertimeRequestForm";
import ResignationForm from "../../Screen/Resignation/ResignationForm";
import TaxModule from "../../Screen/TaxModule/TaxModule";
import PayrollScreen from "../../Screen/Payroll/PayrollScreen";
import PayrollDetailScreen from "../../Screen/Payroll/PayrollDetailScreen";
import PayslipScreen from "../../Screen/Payroll/PayslipScreen";
import TaxReportScreen from "../../Screen/Payroll/TaxReportScreen";
import { StatusBar } from "react-native";
import TimesheetCalendar from "../../Screen/Timesheet/TimesheetCalendar";
import { useNavigation, useRoute, NavigationContainer } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { themedStyles } from "../../Global/ThemeContext";

const Stack = createNativeStackNavigator();

// Screens hosting a floating bottom tab bar draw edge-to-edge; the bar itself
// accounts for the bottom safe-area inset.
const edgeToEdgeOptions = { contentStyle: { paddingBottom: 0 } };

const CustomHeader = ({ navigation, title, onMenuPress }) => {
  const formatTitle = (text) => {
    return text.replace(/([A-Z])/g, " $1").trim();
  };

  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity
        onPress={onMenuPress}
        style={styles.menuButton}
      >
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>

      {/* Lottie Animation instead of Logo */}
      <View style={styles.lottieContainer}>
        <LottieView
          source={require("../../assets/animations/header.json")}
          autoPlay
          loop
          style={styles.lottieAnimation}
        />
      </View>

      <Text style={styles.headerText}>{formatTitle(title)}</Text>

      <TouchableOpacity
        onPress={() => navigation.navigate("Profile")}
        style={styles.profileButton}
      >
        <FontAwesome name="user-circle" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
};


// Wrapper component that provides route context
const RouteProvider = ({ children, onRouteChange }) => {
  const route = useRoute();
  
  useEffect(() => {
    if (route.name && onRouteChange) {
      onRouteChange(route.name);
    }
  }, [route.name]);

  return children;
};

// Wrapper component to pass navigation and route to header
const ScreenWrapper = ({ component: Component, onMenuPress, ...props }) => {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <>
      <CustomHeader 
        navigation={navigation} 
        title={route.name}
        onMenuPress={onMenuPress}
      />
      <Component {...props} />
    </>
  );
};

// Survives remounts (e.g. switching light/dark theme) so the font loader
// doesn't flash again once the icon fonts are in.
let iconFontsReady = false;

function DrawerNavigator() {
  const [fontsLoaded, setFontsLoaded] = useState(iconFontsReady);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentRoute, setCurrentRoute] = useState('Timesheet');
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const drawerWidth = Math.min(340, Math.max(280, windowWidth * 0.85));
  const [slideAnim] = useState(new Animated.Value(-drawerWidth));

  useEffect(() => {
    if (!isDrawerOpen) {
      slideAnim.setValue(-drawerWidth);
    }
  }, [drawerWidth]);

  useEffect(() => {
    async function preloadFonts() {
      try {
        await Font.loadAsync({
          Ionicons: require("react-native-vector-icons/Fonts/Ionicons.ttf"),
          FontAwesome: require("react-native-vector-icons/Fonts/FontAwesome.ttf"),
        });
        iconFontsReady = true;
        setFontsLoaded(true);
      } catch (error) {
        console.error("Error loading fonts:", error);
      }
    }

    preloadFonts();
  }, []);

  useEffect(() => {
    if (isDrawerOpen) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -drawerWidth,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [isDrawerOpen]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const handleRouteChange = (routeName) => {
    console.log(`[DrawerNavigator] Current route changed to: ${routeName}`);
    setCurrentRoute(routeName);
  };

  if (!fontsLoaded) {
    return (
      <LoadingScreen message="Getting things ready" submessage="Setting up your workspace" />
    );
  }

  return (
    <>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
      <Stack.Navigator
        initialRouteName="Attendance"
        screenOptions={{
          headerShown: false,
          contentStyle: { paddingBottom: insets.bottom },
        }}
      >
        <Stack.Screen name="Attendance" options={edgeToEdgeOptions}>
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={BottomTabNavigator} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="MyLeaves" options={edgeToEdgeOptions}>
        {/* <Stack.Screen name="MyLeaveScreen"> */}
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={BottomTabNavLeave} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="Timesheet">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={TimesheetCalendar} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="AssetModule" options={edgeToEdgeOptions}>
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={BottomNavForAsset} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="MyTickets">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={MyTickets} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="LeaveRequest">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={LeaveRequest} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="Profile">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={ProfilePage} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="DashBoard">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={Dashboard} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="LoanRequest">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={LoanRequestForm} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="SalaryAdvanceRequest">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={SalaryAdvanceRequestForm} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="Reimbursement">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={ReimbursementForm} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="AddMember">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={AddEmployeeRequestForm} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="OvertimeRequest">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={OvertimeRequestForm} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="SeparationRequest">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={ResignationForm} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="TaxModule">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={TaxModule} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="Payroll">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={PayrollScreen} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="PayrollDetail">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={PayrollDetailScreen} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="Payslip">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={PayslipScreen} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
        <Stack.Screen name="TaxReport">
          {(props) => (
            <RouteProvider onRouteChange={handleRouteChange}>
              <ScreenWrapper 
                {...props} 
                component={TaxReportScreen} 
                onMenuPress={openDrawer}
              />
            </RouteProvider>
          )}
        </Stack.Screen>
      </Stack.Navigator>

      {/* Custom Drawer Modal */}
      <Modal
        visible={isDrawerOpen}
        transparent={true}
        animationType="none"
        onRequestClose={closeDrawer}
        statusBarTranslucent={false}
      >
        <Pressable 
          style={styles.modalContainer} 
          onPress={closeDrawer}
        >
          <Animated.View
            style={[
              styles.drawerContainer,
              { width: drawerWidth, transform: [{ translateX: slideAnim }] },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <CustomDrawerContent 
              onClose={closeDrawer}
              isDrawerOpen={isDrawerOpen}
              currentRoute={currentRoute}
               setCurrentRoute={setCurrentRoute}
            />
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = themedStyles((c) => ({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 8,
    shadowColor: "rgb(0, 41, 87)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    height: 60,
  },
  menuButton: {
    padding: 4,
    borderRadius: 20,
  },
  lottieContainer: {
    width: 90,
    height: 40,
    marginHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
    overflow: "hidden",
  },
  lottieAnimation: {
    width: 90,
    height: 70,
  },
  headerText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    marginLeft: 8,
  },
  profileButton: {
    padding: 4,
    borderRadius: 20,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.surface,
  },
  loadingLottie: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: c.accent,
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    // Navy-tinted scrim keeps the backdrop on-brand instead of plain grey.
    backgroundColor: c.overlay,
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: c.background,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 28,
    borderRightWidth: 1,
    borderRightColor: c.glassHighlight,
    overflow: 'hidden',
    elevation: 18,
    shadowColor: '#001A38',
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
  },
}));

export default DrawerNavigator;

