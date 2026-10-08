import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';
import {
  sharedTabBarStyle,
  sharedTabBarLabelStyle,
  sharedActiveTintColor,
  sharedInactiveTintColor,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
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
        name="Punch"
        component={PunchScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="pencil" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Calendar"
        component={Schedule}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="calendar" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
