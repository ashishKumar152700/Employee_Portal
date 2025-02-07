import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import PagerView from 'react-native-pager-view';
import PunchScreen from '../../Screen/Attendance/Punch';
import Profile from '../../Screen/Profile/Profile'; 
import Schedule from '../../Screen/Calander/Calander';
import Icon from 'react-native-vector-icons/FontAwesome';

export default function BottomNavForProfile() {
  const layout = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  // Update the current page index when the user swipes
  const onPageSelected = (e) => {
    setPage(e.nativeEvent.position);
  };

  // Navigate to a specific page when a tab is pressed
  const navigateToPage = (pageNumber) => {
    if (pagerRef.current) {
      pagerRef.current.setPage(pageNumber);
      setPage(pageNumber);
    }
  };

  return (
    <View style={styles.container}>
      <PagerView
        style={[styles.pagerView, { width: layout.width }]}
        initialPage={0}
        onPageSelected={onPageSelected}
        ref={pagerRef}
      >
        <View key="1" style={styles.page}>
          <Profile />
        </View>
        <View key="2" style={styles.page}>
          <PunchScreen />
        </View>
        <View key="3" style={styles.page}>
          <Schedule />
        </View>
      </PagerView>


      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, page === 0 && styles.activeTab]}
          onPress={() => navigateToPage(0)}
        >
          <Icon name="user" size={28} color={page === 0 ? '#ff9f43' : 'gray'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, page === 1 && styles.activeTab]}
          onPress={() => navigateToPage(1)}
        >
          <Icon name="clock-o" size={28} color={page === 1 ? '#ff9f43' : 'gray'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, page === 2 && styles.activeTab]}
          onPress={() => navigateToPage(2)}
        >
          <Icon name="calendar" size={28} color={page === 2 ? '#ff9f43' : 'gray'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    height: 66,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'white',
    paddingBottom: 8,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Active tab style adds a top border to highlight the active tab
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#ff9f43',
  },
});


// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import PunchScreen from '../../Screen/Attendance/Punch';
// import Profile from '../../Screen/Profile/Profile'; 
// import Schedule from '../../Screen/Calander/Calander';
// import Icon from 'react-native-vector-icons/FontAwesome';

// const Tab = createBottomTabNavigator();

// function BottomNavForProfile() {
//   return (
//     <Tab.Navigator screenOptions={{tabBarStyle:{backgroundColor:'white' , justifyContent: 'center', overflow:'hidden', height:66 , display:'flex'  ,paddingBottom:8 , flexDirection:'row' , position: "absolute"}}}>
   
//       <Tab.Screen 
//         name="Profile" 
//         component={Profile} 
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="user" color={color} size={28} /> 
//           ),
//         }} 
//       />
//     </Tab.Navigator>
//   );
// }


// export default BottomNavForProfile ;