// App.tsx
(global as any).__reanimatedWorkletInit = () => {};
import "react-native-reanimated";

import React, { useEffect, useMemo, useRef, useState } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Provider, useSelector } from "react-redux";
import { applyMiddleware, legacy_createStore as createStore } from "redux";
import { thunk } from "redux-thunk";
import reducers from "./Global/reducers";
import "./config";
import LoginScreen from "./Screen/Login/Login";
import DrawerNavigator from "./Component/Drawer/Drawer";
import TabViewExample from "./Component/LeaveScreen/LeaveTabs";
import LoanTabNavigator from "./Component/LoanScreens/LoanTabs";
import SalaryAdTabNavigator from "./Component/SalaryScreen/salaryTabs";
import ReimbursementTabNavigator from "./Component/ReimburseScreen/reimburseTabs";
import AddMemberNavigator from "./Component/AddMemberScreen/addMemberTabs";
import OvertimeNavigator from "./Component/OvertimeScreen/OvertimeTabs";
import ResignNavigator from "./Component/ResignScreen/ResignTabs";
import TimesheetCalendar from "./Screen/Timesheet/TimesheetCalendar";
import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import {
  MD3DarkTheme,
  MD3LightTheme,
  Provider as PaperProvider,
} from "react-native-paper";
import { C, ThemeProvider, useTheme } from "./Global/ThemeContext";
import { DialogHost } from "./Component/Feedback/AppDialog";
import { AnimatedSplash } from "./Component/Splash/AnimatedSplash";

// Keep the native splash up until the animated splash has painted over it.
SplashScreen.preventAutoHideAsync().catch(() => {});
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";
import { useOTAUpdate } from "./src/hooks/useOTAUpdate";

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const store = createStore(reducers, applyMiddleware(thunk));

// The root SafeAreaView skips the bottom edge so tab screens can draw behind
// the floating tab bar (edge-to-edge). Every other screen gets the bottom
// inset back here, so nothing sits under the system navigation bar.
const useBottomInsetContentStyle = () => {
  const insets = useSafeAreaInsets();
  return { paddingBottom: insets.bottom };
};

function AuthStackScreen() {
  const contentStyle = useBottomInsetContentStyle();
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, contentStyle }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppStackScreen() {
  const contentStyle = useBottomInsetContentStyle();
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false, contentStyle }}>
      {/* Main handles the bottom inset per screen (see Drawer.tsx). */}
      <AppStack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ contentStyle: { paddingBottom: 0 } }}
      />
      <AppStack.Screen name="leaveHistory" component={TabViewExample} />
      <AppStack.Screen name="loanHistory" component={LoanTabNavigator} />
      <AppStack.Screen
        name="salaryAdHistory"
        component={SalaryAdTabNavigator}
      />
      <AppStack.Screen
        name="reimburseHistory"
        component={ReimbursementTabNavigator}
      />
      <AppStack.Screen name="overtimeHistory" component={OvertimeNavigator} />
      <AppStack.Screen name="addMemberHistory" component={AddMemberNavigator} />
      <AppStack.Screen name="resignHistory" component={ResignNavigator} />
      <AppStack.Screen
        name="timesheetCalendar"
        component={TimesheetCalendar}
        options={{
          headerShown: true,
          title: "Timesheet Calendar",
          headerStyle: { backgroundColor: "rgb(0, 41, 87)" },
          headerTintColor: "#ffffff",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
    </AppStack.Navigator>
  );
}

function Navigation() {
  const userDetails = useSelector((state: any) => state.userDetails);
  const isLoggedIn = userDetails && userDetails.user;
  const { mode, isDark } = useTheme();

  // Switching theme remounts the navigator (key={mode}) so every screen
  // re-renders with the new palette; the saved state puts the user back on
  // the same screen.
  const navStateRef = useRef<any>(undefined);
  useEffect(() => {
    // Auth and app stacks have different shapes; never restore across them.
    navStateRef.current = undefined;
  }, [isLoggedIn]);

  const navTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: C.accent,
        background: C.background,
        card: C.surface,
        text: C.text,
        border: C.border,
      },
    };
  }, [mode]);

  return (
    <NavigationContainer
      key={mode}
      theme={navTheme}
      initialState={navStateRef.current}
      onStateChange={(state) => {
        navStateRef.current = state;
      }}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor="rgb(0, 41, 87)"
        translucent={false}
      />

      {isLoggedIn ? <AppStackScreen /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

function ThemedRoot() {
  const { mode, isDark } = useTheme();
  const paperTheme = useMemo(() => {
    const base = isDark ? MD3DarkTheme : MD3LightTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: C.accent,
        background: C.background,
        surface: C.surface,
        onSurface: C.text,
      },
    };
  }, [mode]);

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView
        edges={["top", "left", "right"]}
        style={{
          flex: 1,
          // Status-bar strip: navy in both modes, matching every header.
          backgroundColor: C.primary,
        }}
      >
        <Navigation />
      </SafeAreaView>
      {/* App-wide dialogs (dialog.alert / confirm / loading) */}
      <DialogHost />
    </PaperProvider>
  );
}

export default function App() {
  useOTAUpdate();
  const [splashDone, setSplashDone] = useState(false);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedRoot />
        </ThemeProvider>
        {!splashDone && <AnimatedSplash onFinish={() => setSplashDone(true)} />}
      </SafeAreaProvider>
    </Provider>
  );
}
