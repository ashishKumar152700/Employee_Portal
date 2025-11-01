import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import EmployeeListScreen from '../../Screen/AddAMember/EmployeeListScreen';
import AddUserScreen from '../../Screen/AddAMember/AddUserScreen';

const Tab = createBottomTabNavigator();

function BottomNavForBiometricCrud() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white',
          height: 70,
          paddingBottom: 10,
          paddingTop: 8,
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarActiveTintColor: 'rgb(0, 41, 87)',
        tabBarInactiveTintColor: 'rgba(0, 41, 87, 0.6)',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tab.Screen 
        name="Employees" 
        component={EmployeeListScreen} 
        options={{
        title: 'Employee List',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Icon 
              name="list" 
              color={color} 
              size={22} 
              style={focused ? styles.iconFocused : {}}
            />
          ),
        }}
      />
      <Tab.Screen 
        name="Add User" 
        component={AddUserScreen} 
        options={{
            title: 'Register User',
          headerShown: false,
          tabBarIcon: ({ color, size, focused }) => (
            <Icon 
              name="plus" 
              color={color} 
              size={22} 
              style={focused ? styles.iconFocused : {}}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = {
  iconFocused: {
    shadowColor: 'rgb(0, 41, 87)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
};

export default BottomNavForBiometricCrud;
