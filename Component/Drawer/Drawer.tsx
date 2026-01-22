import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Modal, Pressable, Animated } from "react-native";
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
import { StatusBar } from "react-native";
import TimesheetCalendar from "../../Screen/Timesheet/TimesheetCalendar";
import { useNavigation, useRoute, NavigationContainer } from "@react-navigation/native";

const Stack = createNativeStackNavigator();

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

// Create a context to share the current route
const RouteContext = React.createContext();

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

function DrawerNavigator() {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-300));
  const [currentRoute, setCurrentRoute] = useState('Timesheet');

  useEffect(() => {
    async function preloadFonts() {
      try {
        await Font.loadAsync({
          Ionicons: require("react-native-vector-icons/Fonts/Ionicons.ttf"),
          FontAwesome: require("react-native-vector-icons/Fonts/FontAwesome.ttf"),
        });
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
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
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
      <View style={styles.loaderContainer}>
        <LottieView
          source={require("../../assets/animations/loading.json")}
          autoPlay
          loop
          style={styles.loadingLottie}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
      <Stack.Navigator
        initialRouteName="Timesheet"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Attendance">
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
        <Stack.Screen name="MyLeaveScreen">
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
        <Stack.Screen name="AssetModule">
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
              { transform: [{ translateX: slideAnim }] }
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

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgb(0, 41, 87)",
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
    backgroundColor: "white",
  },
  loadingLottie: {
    width: 150,
    height: 150,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "rgb(0, 41, 87)",
    fontWeight: "500",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 300,
    backgroundColor: 'white',
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
});

export default DrawerNavigator;

