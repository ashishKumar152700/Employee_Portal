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
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView>
    </Provider>
  );
}
