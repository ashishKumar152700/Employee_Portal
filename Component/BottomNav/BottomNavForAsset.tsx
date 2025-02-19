import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';
import Icon from 'react-native-vector-icons/FontAwesome';

const Tab = createBottomTabNavigator();

function BottomNavForAsset() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white', // Dark blue background
          height: 66,
          paddingBottom: 8,
          flexDirection: 'row',
          position: 'absolute',
        },
        tabBarActiveTintColor: 'rgb(0, 41, 87)', // Theme-consistent dark blue
        tabBarInactiveTintColor: 'black',  // Default white color for inactive tabs
      }}
    >
      <Tab.Screen 
        name="Asset" 
        component={AssetModule} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="briefcase" color={color} size={28} />
          ),
        }}
      />
      <Tab.Screen 
        name="My Tickets" 
        component={MyTickets} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="ticket" color={color} size={28} />
          ),
        }} 
      />
    </Tab.Navigator>
  );
}

export default BottomNavForAsset;
