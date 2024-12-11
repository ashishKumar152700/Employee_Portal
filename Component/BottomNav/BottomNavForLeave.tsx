import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import MyLeaveScreen from '../../Screen/MyLeave/MyLeaveScreen';
import LeaveApplicationScreen from '../../Screen/MyLeave/LeaveApplicationScreen';
const Tab = createBottomTabNavigator();

function BottomTabNavLeave() {
  return (
    <Tab.Navigator screenOptions={{tabBarStyle:{backgroundColor:'white' , justifyContent: 'center', overflow:'hidden', height:66 , display:'flex'  ,paddingBottom:8 , flexDirection:'row' , position: "absolute"}}}>
    
      <Tab.Screen 
        name="Leave Details" 
        component={MyLeaveScreen} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="list" color={color} size={25} /> 
          ),
        }}
      />
      <Tab.Screen 
        name="Apply for Leaves" 
        component={LeaveApplicationScreen} 
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="plus" color={color} size={25} /> 
          ),
        }}
      />
     
    </Tab.Navigator>
  );
}

export default BottomTabNavLeave;
