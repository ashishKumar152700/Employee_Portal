import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';
import Icon from 'react-native-vector-icons/FontAwesome';

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'rgb(0, 41, 87)', // Dark blue background
          height: 66,
          paddingBottom: 8,
          flexDirection: 'row',
          position: 'absolute',
        },
        tabBarActiveTintColor: '#ff9f43', // Highlighted tab color
        tabBarInactiveTintColor: '#fff',  // Default white color for inactive tabs
      }}
    >
      <Tab.Screen 
        name="Punch" 
        component={PunchScreen} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="pencil" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen 
        name="Calendar" 
        component={Schedule} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="calendar" color={color} size={28} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

export default BottomTabNavigator;
