import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginScreen from "./Screen/Login/Login";
import DrawerNavigator from "./Component/Drawer/Drawer";
import { Provider } from "react-redux";
import { applyMiddleware, legacy_createStore as createStore } from "redux";
import { thunk } from "redux-thunk";
import reducers from "./Global/reducers";
import TabViewExample from "./Component/LeaveScreen/LeaveTabs";
import LoanTabNavigator from "./Component/LoanScreens/LoanTabs";
import SalaryAdTabNavigator from "./Component/SalaryScreen/salaryTabs";
import ReimbursementTabNavigator from "./Component/ReimburseScreen/reimburseTabs";
import AddMemberNavigator from "./Component/AddMemberScreen/addMemberTabs";
import OvertimeNavigator from "./Component/OvertimeScreen/OvertimeTabs";
import ResignNavigator from "./Component/ResignScreen/ResignTabs";

const Stack = createStackNavigator();
const store = createStore(reducers, applyMiddleware(thunk));

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1 }}>
        <NavigationContainer>
          <Stack.Navigator initialRouteName="Splash">
           
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Main"
              component={DrawerNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="leaveHistory"
              component={TabViewExample}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="loanHistory"
              component={LoanTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="salaryAdHistory"
              component={SalaryAdTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="reimburseHistory"
              component={ReimbursementTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="overtimeHistory"
              component={OvertimeNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="addMemberHistory"
              component={AddMemberNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="resignHistory"
              component={ResignNavigator}
              options={{ headerShown: false }}
            />
         
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </Provider>
  );
}
