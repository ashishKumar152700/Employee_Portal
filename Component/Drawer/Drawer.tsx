import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import BottomTabNavigator from '../BottomNav/BottomNav'; 
import CustomDrawerContent from './DrawerContnet'; 
import { View } from 'react-native';
import BottomTabNavLeave from '../BottomNav/BottomNavForLeave';
import Profile from '../../Screen/Profile/Profile';
import TimesheetCalendar from '../../Screen/Timesheet/TimesheetCalendar';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';

const Drawer = createDrawerNavigator();

function DrawerNavigator() {
  return (
    <View style={{ flex: 1 }}> 
      <Drawer.Navigator  
        initialRouteName='Attendance'
        drawerContent={(props) => <CustomDrawerContent {...props} />}>
        
        <Drawer.Screen name="Attendance" component={BottomTabNavigator} /> 
        <Drawer.Screen name="MyLeaveScreen" component={BottomTabNavLeave} /> 
        <Drawer.Screen name="Timesheet" component={TimesheetCalendar} />  
        <Drawer.Screen name="AssetModule" component={AssetModule} /> 
        <Drawer.Screen name="MyTickets" component={MyTickets} /> 
        <Drawer.Screen name="Profile" component={Profile} /> 
        
      </Drawer.Navigator>
    </View>
  );
}


export default DrawerNavigator;
