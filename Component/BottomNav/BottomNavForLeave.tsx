import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MyLeaveScreen from '../../Screen/MyLeave/MyLeaveScreen';
import LeaveApplicationScreen from '../../Screen/MyLeave/LeaveApplicationScreen';
import {
  sharedTabBarStyle,
  sharedTabBarLabelStyle,
  sharedActiveTintColor,
  sharedInactiveTintColor,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomTabNavLeave() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: sharedTabBarStyle,
        tabBarLabelStyle: sharedTabBarLabelStyle,
        tabBarItemStyle: {paddingTop: 4},
        tabBarActiveTintColor: sharedActiveTintColor,
        tabBarInactiveTintColor: sharedInactiveTintColor,
      }}>
      <Tab.Screen
        name="Leave Details"
        component={MyLeaveScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="list" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Apply for Leaves"
        component={LeaveApplicationScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="plus" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavLeave;
