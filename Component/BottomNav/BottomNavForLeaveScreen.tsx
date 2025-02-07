import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import MyLeaveScreen from '../../Screen/MyLeave/MyLeaveScreen';
import LeaveApplicationScreen from '../../Screen/MyLeave/LeaveApplicationScreen';

export default function BottomNavForLeaveScreen() {
  const layout = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pagerRef = useRef(null);

  // Update the current page index when the user swipes between pages
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
          <MyLeaveScreen />
        </View>
        <View key="2" style={styles.page}>
          <LeaveApplicationScreen />
        </View>
      </PagerView>

  
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, page === 0 && styles.activeTab]}
          onPress={() => navigateToPage(0)}
        >
          <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
            Leave Detail
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, page === 1 && styles.activeTab]}
          onPress={() => navigateToPage(1)}
        >
          <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
            Apply For Leave
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
  // Active tab style: adds a top border to highlight the active tab
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

