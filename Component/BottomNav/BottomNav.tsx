import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';
import Icon from 'react-native-vector-icons/FontAwesome';
import AgendaScreen from '../../Screen/Calander/Testing';

const Tab = createBottomTabNavigator();

function BottomTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{tabBarStyle:{backgroundColor:'white' , justifyContent: 'center', overflow:'hidden', height:66 , display:'flex'  ,paddingBottom:8 , flexDirection:'row' , position: "absolute"}}}>
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
        name="Calander" 
        // component={AgendaScreen} 
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


