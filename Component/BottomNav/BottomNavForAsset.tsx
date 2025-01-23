import * as React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';



const renderScene = SceneMap({
  first: AssetModule,
  second: MyTickets,
});

const routes = [
  { key: 'first', title: 'Asset' },
  { key: 'second', title: 'My Tickets' },
];

export default function BottomNavForAsset() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      style={styles.tabView}
      tabBarPosition='bottom'
      renderTabBar={(props) => (
             <TabBar
               {...props}
               style={styles.tabBar}
               indicatorStyle={styles.indicator}
               
             />
           )}
    />
  );
}

const styles = StyleSheet.create({
  tabView: {
    flex: 1,
  },
  indicator: {
    backgroundColor: "#ff9f43",
    height: 4,
    borderRadius: 2,
  },
  tabBar: {
    // backgroundColor: "purple",
    backgroundColor: "rgb(0, 41, 87)",
      color:'red',
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
