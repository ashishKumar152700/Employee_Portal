

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
          backgroundColor: 'white', 
          height: 66,
          paddingBottom: 8,
          flexDirection: 'row',
          position: 'absolute',
        },
        tabBarActiveTintColor: 'rgb(0,47,81)', // Theme-consistent dark blue
        tabBarInactiveTintColor: 'grey',  // Default white color for inactive tabs
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


// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import PunchScreen from '../../Screen/Attendance/Punch';
// import Schedule from '../../Screen/Calander/Calander';
// import Icon from 'react-native-vector-icons/FontAwesome';

// const Tab = createBottomTabNavigator();

// function BottomTabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarStyle: {
//           backgroundColor: 'white', 
//           height: 70,
//           paddingBottom: 10,
//           paddingTop: 8,
//           borderTopWidth: 1,
//           borderTopColor: '#e0e0e0',
//           elevation: 8,
//           shadowColor: '#000',
//           shadowOffset: { width: 0, height: -2 },
//           shadowOpacity: 0.1,
//           shadowRadius: 4,
//         },
//         tabBarActiveTintColor: 'rgb(0, 47, 81)',
//         tabBarInactiveTintColor: 'rgba(0, 47, 81, 0.6)',
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: '500',
//           marginTop: 4,
//         },
//       }}
//     >
//       <Tab.Screen 
//         name="Punch" 
//         component={PunchScreen} 
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size, focused }) => (
//             <Icon 
//               name="pencil" 
//               color={color} 
//               size={24} 
//               style={focused ? styles.iconFocused : {}}
//             />
//           ),
//         }}
//       />
//       <Tab.Screen 
//         name="Calendar" 
//         component={Schedule} 
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size, focused }) => (
//             <Icon 
//               name="calendar" 
//               color={color} 
//               size={24} 
//               style={focused ? styles.iconFocused : {}}
//             />
//           ),
//         }} 
//       />
//     </Tab.Navigator>
//   );
// }

// const styles = {
//   iconFocused: {
//     shadowColor: 'rgb(0, 47, 81)',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 3,
//   }
// };

// export default BottomTabNavigator;