import React, { useEffect, useState } from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import * as Font from 'expo-font'; // Import expo-font
import BottomNavForPunchScreen from '../BottomNav/BottomNavForPunchScreen';
import BottomNavForLeaveScreen from '../BottomNav/BottomNavForLeaveScreen';
import CalendarListScreen from '../../Screen/Timesheet/Testing';
import BottomNavForAsset from '../BottomNav/BottomNavForAsset';
import MyTickets from '../../Screen/Asset/MyTickets';
import CustomDrawerContent from './DrawerContnet';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LeaveRequest from '../../Screen/LeaveRequestList/LeaveRequest';
import ProfilePage from '../../Screen/Profile/Testing';
import BottomTabNavigator from '../BottomNav/BottomNav';
import BottomTabNavLeave from '../BottomNav/BottomNavForLeave';
import Dashboard from '../../Screen/DashBoard/DashBoard';
import LoanRequestForm from '../../Screen/LoadRequest/LoanRequestForm';
import SalaryAdvanceRequestForm from '../../Screen/SalaryAdvance/SalaryAdvanceRequestForm';
import ReimbursementForm from '../../Screen/Reimbursement/ReimbursementForm';
import AddEmployeeRequestForm from '../../Screen/AddEmpToTeam/AddEmployeeRequestForm';
import OvertimeRequestForm from '../../Screen/Overtime/OvertimeRequestForm';
import ResignationForm from '../../Screen/Resignation/ResignationForm';
import TaxModule from '../../Screen/TaxModule/TaxModule';
const Drawer = createDrawerNavigator();

const CustomHeader = ({ navigation, title }) => {
  return (
    <View style={styles.headerContainer}>
      <TouchableOpacity onPress={() => navigation.openDrawer()}>
        <Ionicons name="menu" size={28} color="white" />
      </TouchableOpacity>

      <Image
        style={styles.logo}
        source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Logo_TV_2015.png' }}
      />
      <Text style={styles.headerText}>{title}</Text>

      <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
        <FontAwesome name="user-circle" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
};

function DrawerNavigator() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function preloadFonts() {
      try {
        // Load necessary fonts
        await Font.loadAsync({
          Ionicons: require('react-native-vector-icons/Fonts/Ionicons.ttf'),
          FontAwesome: require('react-native-vector-icons/Fonts/FontAwesome.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    }

    preloadFonts();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <Drawer.Navigator
        initialRouteName="Attendance"
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: true,
          header: ({ navigation, route }) => (
            <CustomHeader navigation={navigation} title={route.name} />
          ),
          swipeEdgeWidth: 100,}}
      >
        <Drawer.Screen name="Attendance" component={BottomTabNavigator} />
        <Drawer.Screen name="MyLeaves" component={BottomTabNavLeave} />
        <Drawer.Screen name="Timesheet" component={CalendarListScreen} />
        <Drawer.Screen name="AssetModule" component={BottomNavForAsset} />
        <Drawer.Screen name="MyTickets" component={MyTickets} />
        <Drawer.Screen name="LeaveRequest" component={LeaveRequest} />
        <Drawer.Screen name="Profile" component={ProfilePage} />
        <Drawer.Screen name="DashBoard" component={Dashboard} />
        <Drawer.Screen name="LoanRequest" component={LoanRequestForm} />
        <Drawer.Screen name="SalaryAdvanceRequest" component={SalaryAdvanceRequestForm} />
        <Drawer.Screen name="Reimbursement" component={ReimbursementForm} />
        <Drawer.Screen name="AddMember" component={AddEmployeeRequestForm} />
        <Drawer.Screen name="OvertimeRequest" component={OvertimeRequestForm} />
        <Drawer.Screen name="SeparationRequest" component={ResignationForm} />
        <Drawer.Screen name="TaxModule" component={TaxModule} />

      </Drawer.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgb(0, 41, 87)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 4,
  },
  logo: {
    width: 40,
    height: 40,
    marginHorizontal: 20,
    backgroundColor: 'white',
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: 'rgb(0, 41, 87)',
  },
});

export default DrawerNavigator;
