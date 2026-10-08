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
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { BRAND, GlassSurface } from '../../Global/GlassTheme';

const BAR_INSET = 16;
const BAR_PADDING = 6;

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

  const tabWidth = (layout.width - BAR_INSET * 2 - BAR_PADDING * 2) / 2;

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
      <View style={styles.tabBarWrapper}>
        <GlassSurface radius={28} style={styles.tabBar}>
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
          >
            <LinearGradient
              colors={BRAND.primaryGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateToPage(0)}
            activeOpacity={0.8}
          >
            <Icon
              name="pencil"
              size={15}
              color={page === 0 ? '#FFFFFF' : BRAND.primaryMuted}
            />
            <Text style={[styles.tabText, page === 0 && styles.activeTabText]}>
              Attendance
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.tabItem}
            onPress={() => navigateToPage(1)}
            activeOpacity={0.8}
          >
            <Icon
              name="calendar"
              size={15}
              color={page === 1 ? '#FFFFFF' : BRAND.primaryMuted}
            />
            <Text style={[styles.tabText, page === 1 && styles.activeTabText]}>
              Calendar
            </Text>
          </TouchableOpacity>
        </GlassSurface>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  pagerView: { flex: 1 },
  page: { flex: 1 },

  tabBarWrapper: {
    paddingHorizontal: BAR_INSET,
    paddingTop: 8,
    paddingBottom: 14,
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    padding: BAR_PADDING,
    elevation: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
  },

  // Navy pill that glides between tabs.
  slidingIndicator: {
    position: 'absolute',
    top: BAR_PADDING,
    bottom: BAR_PADDING,
    left: BAR_PADDING,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: BRAND.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    color: BRAND.primaryMuted,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

