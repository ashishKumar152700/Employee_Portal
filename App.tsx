import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { SafeAreaView } from "react-native-safe-area-context";
import LoginScreen from "./Screen/Login/Login";
import DrawerNavigator from "./Component/Drawer/Drawer";
import { Provider, useSelector } from "react-redux";
import { applyMiddleware, legacy_createStore as createStore } from "redux";
import { thunk } from "redux-thunk";
import reducers from "./Global/reducers"; // Make sure this path is correct
import TabViewExample from "./Component/LeaveScreen/LeaveTabs";
import LoanTabNavigator from "./Component/LoanScreens/LoanTabs";
import SalaryAdTabNavigator from "./Component/SalaryScreen/salaryTabs";
import ReimbursementTabNavigator from "./Component/ReimburseScreen/reimburseTabs";
import AddMemberNavigator from "./Component/AddMemberScreen/addMemberTabs";
import OvertimeNavigator from "./Component/OvertimeScreen/OvertimeTabs";
import ResignNavigator from "./Component/ResignScreen/ResignTabs";
// import TimesheetCalendar from "./Component/TimesheetScreen/TimesheetCalendar"; // Add this import
import "./config"; 
import TimesheetCalendar from "./Screen/Timesheet/TimesheetCalendar";

const Stack = createStackNavigator();
const AuthStack = createStackNavigator();
const AppStack = createStackNavigator();

// Debug the reducer to ensure it's a function
console.log('Reducers type:', typeof reducers);
console.log('Reducers value:', reducers);

const store = createStore(reducers, applyMiddleware(thunk));

// Auth Stack Navigator
function AuthStackScreen() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
      />
    </AuthStack.Navigator>
  );
}

// App Stack Navigator
function AppStackScreen() {
  return (
    <AppStack.Navigator screenOptions={{ headerShown: false }}>
      <AppStack.Screen
        name="Main"
        component={DrawerNavigator}
      />
      <AppStack.Screen
        name="leaveHistory"
        component={TabViewExample}
      />
      <AppStack.Screen
        name="loanHistory"
        component={LoanTabNavigator}
      />
      <AppStack.Screen
        name="salaryAdHistory"
        component={SalaryAdTabNavigator}
      />
      <AppStack.Screen
        name="reimburseHistory"
        component={ReimbursementTabNavigator}
      />
      <AppStack.Screen
        name="overtimeHistory"
        component={OvertimeNavigator}
      />
      <AppStack.Screen
        name="addMemberHistory"
        component={AddMemberNavigator}
      />
      <AppStack.Screen
        name="resignHistory"
        component={ResignNavigator}
      />
      {/* Add Timesheet Screen */}
      <AppStack.Screen
        name="timesheetCalendar"
        component={TimesheetCalendar}
        options={{ 
          headerShown: true,
          title: "Timesheet Calendar",
          headerStyle: {
            backgroundColor: 'rgb(0, 41, 87)',
          },
          headerTintColor: '#ffffff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />
    </AppStack.Navigator>
  );
}

// Main Navigation Component
function Navigation() {
  const userDetails = useSelector((state: any) => state.userDetails);
  const isLoggedIn = userDetails && userDetails.user;

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppStackScreen /> : <AuthStackScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaView style={{ flex: 1 }}>
        <Navigation />
      </SafeAreaView>
    </Provider>
  );
}

// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// import React from "react";
// import { NavigationContainer } from "@react-navigation/native";
// import { createStackNavigator } from "@react-navigation/stack";
// import { SafeAreaView } from "react-native-safe-area-context";
// import LoginScreen from "./Screen/Login/Login";
// import DrawerNavigator from "./Component/Drawer/Drawer";
// import { Provider, useSelector } from "react-redux";
// import { applyMiddleware, legacy_createStore as createStore } from "redux";
// import { thunk } from "redux-thunk";
// import reducers from "./Global/reducers";
// import TabViewExample from "./Component/LeaveScreen/LeaveTabs";
// import LoanTabNavigator from "./Component/LoanScreens/LoanTabs";
// import SalaryAdTabNavigator from "./Component/SalaryScreen/salaryTabs";
// import ReimbursementTabNavigator from "./Component/ReimburseScreen/reimburseTabs";
// import AddMemberNavigator from "./Component/AddMemberScreen/addMemberTabs";
// import OvertimeNavigator from "./Component/OvertimeScreen/OvertimeTabs";
// import ResignNavigator from "./Component/ResignScreen/ResignTabs";
// import "./config"; 

// const Stack = createStackNavigator();
// const AuthStack = createStackNavigator();
// const AppStack = createStackNavigator();
// const store = createStore(reducers, applyMiddleware(thunk));

// // Auth Stack Navigator
// function AuthStackScreen() {
//   return (
//     <AuthStack.Navigator screenOptions={{ headerShown: false }}>
//       <AuthStack.Screen
//         name="Login"
//         component={LoginScreen}
//       />
//     </AuthStack.Navigator>
//   );
// }

// // App Stack Navigator
// function AppStackScreen() {
//   return (
//     <AppStack.Navigator screenOptions={{ headerShown: false }}>
//       <AppStack.Screen
//         name="Main"
//         component={DrawerNavigator}
//       />
//       <AppStack.Screen
//         name="leaveHistory"
//         component={TabViewExample}
//       />
//       <AppStack.Screen
//         name="loanHistory"
//         component={LoanTabNavigator}
//       />
//       <AppStack.Screen
//         name="salaryAdHistory"
//         component={SalaryAdTabNavigator}
//       />
//       <AppStack.Screen
//         name="reimburseHistory"
//         component={ReimbursementTabNavigator}
//       />
//       <AppStack.Screen
//         name="overtimeHistory"
//         component={OvertimeNavigator}
//       />
//       <AppStack.Screen
//         name="addMemberHistory"
//         component={AddMemberNavigator}
//       />
//       <AppStack.Screen
//         name="resignHistory"
//         component={ResignNavigator}
//       />
//     </AppStack.Navigator>
//   );
// }

// // Main Navigation Component
// function Navigation() {
//   const userDetails = useSelector((state: any) => state.userDetails);
//   const isLoggedIn = userDetails && userDetails.user;

//   return (
//     <NavigationContainer>
//       {isLoggedIn ? <AppStackScreen /> : <AuthStackScreen />}
//     </NavigationContainer>
//   );
// }

// export default function App() {
//   return (
//     <Provider store={store}>
//       <SafeAreaView style={{ flex: 1 }}>
//         <Navigation />
//       </SafeAreaView>
//     </Provider>
//   );
// }

// // import React from "react";
// // import { NavigationContainer } from "@react-navigation/native";
// // import { createStackNavigator } from "@react-navigation/stack";
// // import { SafeAreaView } from "react-native-safe-area-context";
// // import LoginScreen from "./Screen/Login/Login";
// // import DrawerNavigator from "./Component/Drawer/Drawer";
// // import { Provider } from "react-redux";
// // import { applyMiddleware, legacy_createStore as createStore } from "redux";
// // import { thunk } from "redux-thunk";
// // import reducers from "./Global/reducers";
// // import TabViewExample from "./Component/LeaveScreen/LeaveTabs";
// // import LoanTabNavigator from "./Component/LoanScreens/LoanTabs";
// // import SalaryAdTabNavigator from "./Component/SalaryScreen/salaryTabs";
// // import ReimbursementTabNavigator from "./Component/ReimburseScreen/reimburseTabs";
// // import AddMemberNavigator from "./Component/AddMemberScreen/addMemberTabs";
// // import OvertimeNavigator from "./Component/OvertimeScreen/OvertimeTabs";
// // import ResignNavigator from "./Component/ResignScreen/ResignTabs";
// // import "./config"; 

// // const Stack = createStackNavigator();
// // const store = createStore(reducers, applyMiddleware(thunk));

// // export default function App() {
// //   return (
// //     <Provider store={store}>
// //       <SafeAreaView style={{ flex: 1 }}>
// //         <NavigationContainer>
// //           <Stack.Navigator initialRouteName="Splash">
           
// //             <Stack.Screen
// //               name="Login"
// //               component={LoginScreen}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="Main"
// //               component={DrawerNavigator}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="leaveHistory"
// //               component={TabViewExample}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="loanHistory"
// //               component={LoanTabNavigator}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="salaryAdHistory"
// //               component={SalaryAdTabNavigator}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="reimburseHistory"
// //               component={ReimbursementTabNavigator}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="overtimeHistory"
// //               component={OvertimeNavigator}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="addMemberHistory"
// //               component={AddMemberNavigator}
// //               options={{ headerShown: false }}
// //             />
// //             <Stack.Screen
// //               name="resignHistory"
// //               component={ResignNavigator}
// //               options={{ headerShown: false }}
// //             />
         
// //           </Stack.Navigator>
// //         </NavigationContainer>
// //       </SafeAreaView>
// //     </Provider>
// //   );
// // }
