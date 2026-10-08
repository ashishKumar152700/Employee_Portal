import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import EmployeeListScreen from '../../Screen/AddAMember/EmployeeListScreen';
import AddUserScreen from '../../Screen/AddAMember/AddUserScreen';
import {
  renderGlassTabBar,
  sharedTabScreenOptions,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomNavForBiometricCrud() {
  return (
    <Tab.Navigator
      tabBar={renderGlassTabBar}
      screenOptions={sharedTabScreenOptions}>
      <Tab.Screen
        name="Employees"
        component={EmployeeListScreen}
        options={{
          title: 'Employee List',
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="list" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Add User"
        component={AddUserScreen}
        options={{
          title: 'Register User',
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="plus" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomNavForBiometricCrud;
