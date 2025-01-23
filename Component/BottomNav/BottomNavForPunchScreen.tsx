import * as React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';



const renderScene = SceneMap({
  first: PunchScreen,
  second: Schedule,
});

const routes = [
  { key: 'first', title: 'Attendance' },
  { key: 'second', title: 'Calander' },
];

export default function BottomNavForPunchScreen() {
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
  scene: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  text: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});
