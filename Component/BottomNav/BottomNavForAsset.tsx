import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import AssetModule from '../../Screen/Asset/AssetRequest';
import MyTickets from '../../Screen/Asset/MyTickets';

export default function BottomNavForAsset() {
  const layout = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  // Update the current page index when the user swipes
  const onPageSelected = (e) => {
    setPage(e.nativeEvent.position);
  };

  // Navigate to the specified page when a tab is pressed
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
          <AssetModule />
        </View>
        <View key="2" style={styles.page}>
          <MyTickets />
        </View>
      </PagerView>

      {/* Custom Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, page === 0 && styles.activeTab]}
          onPress={() => navigateToPage(0)}
        >
          <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
            Asset
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, page === 1 && styles.activeTab]}
          onPress={() => navigateToPage(1)}
        >
          <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
            My Tickets
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
  // Active tab styling: Top border and highlighted text color
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#ff9f43',
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
  },
  activeTabText: {
    fontWeight: 'bold',
    color: '#ff9f43',
  },
});


// import * as React from 'react';
// import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
// import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
// import AssetModule from '../../Screen/Asset/AssetRequest';
// import MyTickets from '../../Screen/Asset/MyTickets';



// const renderScene = SceneMap({
//   first: AssetModule,
//   second: MyTickets,
// });

// const routes = [
//   { key: 'first', title: 'Asset' },
//   { key: 'second', title: 'My Tickets' },
// ];

// export default function BottomNavForAsset() {
//   const layout = useWindowDimensions();
//   const [index, setIndex] = React.useState(0);

//   return (
//     <TabView
//       navigationState={{ index, routes }}
//       renderScene={renderScene}
//       onIndexChange={setIndex}
//       initialLayout={{ width: layout.width }}
//       style={styles.tabView}
//       tabBarPosition='bottom'
//       renderTabBar={(props) => (
//              <TabBar
//                {...props}
//                style={styles.tabBar}
//                indicatorStyle={styles.indicator}
               
//              />
//            )}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   tabView: {
//     flex: 1,
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
//   scene: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   text: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
// });
