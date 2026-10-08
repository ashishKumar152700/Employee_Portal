import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  Animated,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import PunchScreen from '../../Screen/Attendance/Punch';
import Schedule from '../../Screen/Calander/Calander';
import LottieView from 'lottie-react-native';

export default function BottomNavForPunchScreen() {
  const layout = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pagerRef = useRef<any>(null);

  const [calendarRefreshKey, setCalendarRefreshKey] = useState(0);

  // ✅ Transition control
  const [transitioning, setTransitioning] = useState(false);

  // ✅ Indicator animation
  const indicatorX = useRef(new Animated.Value(0)).current;

  const transitionAnim = require('../../assets/animations/pageTransition.json');

  // 🔥 COMMON TRANSITION HANDLER
  const triggerTransition = () => {
    setTransitioning(true);
  };

  const onPageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      const newPage = e.nativeEvent.position;

      setPage(newPage);
      triggerTransition();

      Animated.spring(indicatorX, {
        toValue: newPage,
        tension: 180,
        friction: 20,
        useNativeDriver: true,
      }).start();

      if (newPage === 1) {
        setCalendarRefreshKey((k) => k + 1);
      }
    },
    [indicatorX]
  );

  const navigateToPage = useCallback(
    (pageNumber: number) => {
      if (pagerRef.current) {
        pagerRef.current.setPage(pageNumber);

        setPage(pageNumber);
        triggerTransition();

        Animated.spring(indicatorX, {
          toValue: pageNumber,
          tension: 180,
          friction: 20,
          useNativeDriver: true,
        }).start();

        if (pageNumber === 1) {
          setCalendarRefreshKey((k) => k + 1);
        }
      }
    },
    [indicatorX]
  );

  const tabWidth = layout.width / 2;

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
          <Schedule refreshTrigger={calendarRefreshKey} />
        </View>
      </PagerView>

      {/* ✅ LOTTIE TRANSITION (FIXED) */}
      {transitioning && (
        <LottieView
          source={transitionAnim}
          autoPlay
          loop={false}
          style={[StyleSheet.absoluteFill, { zIndex: 99 }]}
          onAnimationFinish={() => setTransitioning(false)}
        />
      )}

      {/* TAB BAR */}
      <View style={styles.tabBar}>
        <Animated.View
          style={[
            styles.slidingIndicator,
            {
              width: tabWidth,
              transform: [
                {
                  translateX: indicatorX.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, tabWidth],
                  }),
                },
              ],
            },
          ]}
        />

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToPage(0)}
        >
          <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
            Attendance
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => navigateToPage(1)}
        >
          <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
            Calendar
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  pagerView: { flex: 1 },
  page: { flex: 1 },

  tabBar: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // The orange sliding indicator that glides between tabs.
  slidingIndicator: {
    position: 'absolute',
    top: 0,
    height: 3,
    backgroundColor: '#ff9f43',
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabText: {
    color: 'rgba(0, 41, 87, 0.5)',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: 'rgb(0, 41, 87)',
    fontWeight: '700',
  },
});

