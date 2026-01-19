// App.tsx
(global as any).__reanimatedWorkletInit = () => {};
import "react-native-reanimated";

import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "react-native";

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const store = createStore(reducers, applyMiddleware(thunk));

function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
}

function AppStackScreen() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen name="Main" component={DrawerNavigator} />
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

  return (
    <NavigationContainer>
         <StatusBar
        barStyle="light-content"
        backgroundColor="rgb(0, 41, 87)"
        translucent={false}
      />

      {isLoggedIn ? <AppStackScreen /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

export default function App() {

  return (
    <Provider store={store}>
      <SafeAreaView
        style={{
          flex: 1,
        }}
      >
        <Navigation />
      </SafeAreaView>
    </Provider>
  );
}
