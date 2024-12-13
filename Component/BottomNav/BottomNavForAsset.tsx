import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/FontAwesome';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';

const Tab = createBottomTabNavigator();

function BottomNavForAsset() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: 'white',
          justifyContent: 'center',
          overflow: 'hidden',
          height: 66,
          display: 'flex',
          paddingBottom: 8,
          flexDirection: 'row',
          position: 'absolute',
        },
      }}
    >
      <Tab.Screen
        name="Leave Request"
        component={AssetModule}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="desktop" color="rgb(0,47,81)" size={25} />
          ),
        }}
      />
      <Tab.Screen
        name="My Tickets"
        component={MyTickets}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Icon name="ticket" color="rgb(0,47,81)" size={25} /> // Corrected icon name
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomNavForAsset;

// import React from 'react';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import Icon from 'react-native-vector-icons/FontAwesome';
// import AssetModule from '../../Screen/Asset/AssetRequest';
// import MyTickets from '../../Screen/Asset/MyTickets';
// const Tab = createBottomTabNavigator();

// function BottomNavForAsset() {
//   return (
//     <Tab.Navigator screenOptions={{tabBarStyle:{backgroundColor:'white' , justifyContent: 'center', overflow:'hidden', height:66 , display:'flex'  ,paddingBottom:8 , flexDirection:'row' , position: "absolute"}}}>
    
//       <Tab.Screen 
//         name="Leave Request" 
//         component={AssetModule} 
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="mouse" color={color} size={25} /> 
//           ),
//         }}
//       />
//       <Tab.Screen 
//         name="My Tickets" 
//         component={MyTickets} 
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size }) => (
//             <Icon name="ticket" color={color} size={25} /> 
//           ),
//         }}
//       />
     
//     </Tab.Navigator>
//   );
// }

// export default BottomNavForAsset;
