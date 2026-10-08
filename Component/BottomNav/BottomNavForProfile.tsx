import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Profile from '../../Screen/Profile/Profile';
import {
  sharedTabBarStyle,
  sharedTabBarLabelStyle,
  sharedActiveTintColor,
  sharedInactiveTintColor,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomNavForProfile() {
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
        name="Profile"
        component={Profile}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="user" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomNavForProfile;
