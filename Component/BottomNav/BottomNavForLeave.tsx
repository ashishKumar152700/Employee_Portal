import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import MyLeaveScreen from '../../Screen/MyLeave/MyLeaveScreen';
import LeaveApplicationScreen from '../../Screen/MyLeave/LeaveApplicationScreen';
import {
  renderGlassTabBar,
  sharedTabScreenOptions,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomTabNavLeave() {
  return (
    <Tab.Navigator
      tabBar={renderGlassTabBar}
      screenOptions={sharedTabScreenOptions}>
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
