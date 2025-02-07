import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';

export default function BottomNavForPunchScreen() {
  const layout = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  // Update the state when the page is swiped
  const onPageSelected = (e) => {
    setPage(e.nativeEvent.position);
  };

  // Navigate to the selected page when a tab is pressed
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
          <PunchScreen />
        </View>
        <View key="2" style={styles.page}>
          <Schedule />
        </View>
      </PagerView>

  
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem , page === 0 && styles.activeTab]}
          onPress={() => navigateToPage(0)}
        >
          <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
            Attendance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem , page === 1 && styles.activeTab]}
          onPress={() => navigateToPage(1)}
        >
          <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
            Calander
          </Text>
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
    backgroundColor: 'rgb(0, 41, 87)',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#ff9f43',
  },
  activeTab: {
    borderTopWidth: 3,
    borderColor: '#ff9f43',
  },
});


// import * as React from 'react';
// import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
// import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
// import AssetModule from '../../Screen/Asset/AssetRequest';
// import MyTickets from '../../Screen/Asset/MyTickets';
// import PunchScreen from '../../Screen/Attendance/Punch';
// import Schedule from '../../Screen/Calander/Calander';



// const renderScene = SceneMap({
//   first: PunchScreen,
//   second: Schedule,
// });

// const routes = [
//   { key: 'first', title: 'Attendance' },
//   { key: 'second', title: 'Calander' },
// ];

// export default function BottomNavForPunchScreen() {
//   const layout = useWindowDimensions();
//   const [index, setIndex] = React.useState(0);

//   return (
//     <TabView
//     navigationState={{ index, routes }}
//     renderScene={renderScene}
//     onIndexChange={setIndex}
//     initialLayout={{ width: layout.width }}
//     style={styles.tabView}
//     tabBarPosition='bottom'
//     renderTabBar={(props) => (
//            <TabBar
//              {...props}
//              style={styles.tabBar}
//              indicatorStyle={styles.indicator}
             
//            />
//          )}
//   />
//   );
// }

// const styles = StyleSheet.create({
//   tabView: {
//     flex: 1,
//   },
//   scene: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   indicator: {
//     backgroundColor: "#ff9f43",
//     height: 4,
//     borderRadius: 2,
//   },
//   tabBar: {
//     // backgroundColor: "purple",
//     backgroundColor: "rgb(0, 41, 87)",
//       color:'red',
//     borderBottomWidth: 1,
//     borderBottomColor: "#e0e0e0",
//   },
//   text: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
// });
