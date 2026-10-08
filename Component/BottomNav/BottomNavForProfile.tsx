import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import Profile from '../../Screen/Profile/Profile';
import {
  renderGlassTabBar,
  sharedTabScreenOptions,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomNavForProfile() {
  return (
    <Tab.Navigator
      tabBar={renderGlassTabBar}
      screenOptions={sharedTabScreenOptions}>
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
