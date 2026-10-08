import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';
import {
  renderGlassTabBar,
  sharedTabScreenOptions,
  TabIcon,
} from './TabBarTheme';

const Tab = createBottomTabNavigator();

function BottomNavForAsset() {
  return (
    <Tab.Navigator
      tabBar={renderGlassTabBar}
      screenOptions={sharedTabScreenOptions}>
      <Tab.Screen
        name="Asset"
        component={AssetModule}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="briefcase" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="My Tickets"
        component={MyTickets}
        options={{
          headerShown: false,
          tabBarIcon: ({focused}) => <TabIcon name="ticket" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default BottomNavForAsset;
