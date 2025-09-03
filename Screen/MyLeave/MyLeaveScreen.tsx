
import React, { useCallback, useEffect, useState } from "react";
import { View, Text, SafeAreaView, StyleSheet, Animated, Easing, ScrollView, RefreshControl } from "react-native";
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import { getLeaves } from "../../Services/Leave/Leave.service";
import { FAB } from "react-native-paper";
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../Global/Types';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from "react-native-vector-icons/MaterialIcons";

export default function MyLeaveScreen() {
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const dispatch = useDispatch();
  const leaveDetailsSelector = useSelector((state: any) => state.leaveDetails);
  const navigation = useNavigation();
  type leaveHistory = StackNavigationProp<RootStackParamList, 'leaveHistory'>;

    const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
      setRefreshing(true);
        async function fetchLeaveDetails() {
      try {
        const leaves = await getLeaves(dispatch);
        setLeaveDetails(leaves.data);
      } catch (error) {
        console.error("Error fetching leave details:", error);
      }
    }
    fetchLeaveDetails();
      setRefreshing(false);
    }, [dispatch]);

  useEffect(() => {
    async function fetchLeaveDetails() {
      try {
        const leaves = await getLeaves(dispatch);
        setLeaveDetails(leaves.data);
      } catch (error) {
        console.error("Error fetching leave details:", error);
      }
    }
    fetchLeaveDetails();
  }, [dispatch]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const totalLeaves = 28;
  const paidleave = 12;
  const casualLeaves = 12;
  const sickLeaves = 6;
  const optionalLeave = 4;
  const paidleaveUsed = leaveDetailsSelector?.paidleave ?? 0;
  const casualLeavesUsed = leaveDetailsSelector?.casualleave ?? 0;
  const sickLeavesUsed = leaveDetailsSelector?.sickleave ?? 0;
  const optionalLeaveUsed = leaveDetailsSelector?.optionalleave ?? 0;

  const leaveProgress = (usedLeaves) => usedLeaves / totalLeaves;
  const remainingLeaves =   (paidleaveUsed + casualLeavesUsed + sickLeavesUsed + optionalLeaveUsed) - totalLeaves;
  const leavesLeft = totalLeaves - (paidleaveUsed + casualLeavesUsed + sickLeavesUsed + optionalLeaveUsed);

  const handleLeaveHistoryPress = () => {
    navigation.navigate('leaveHistory');
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}   refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Leaves</Text>
            <Text style={styles.headerSubtitle}>Track your leave balance</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>Leave Balance</Text>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeText}>{leavesLeft} leaves left</Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Progress.Circle
                size={120}
                progress={leaveProgress(remainingLeaves)}
                showsText
                formatText={() => `${remainingLeaves}`}
                color="#002957"
                unfilledColor="#e9f0f7"
                // color="#002957"
                // unfilledColor="#e9f0f7"
                thickness={10}
                borderWidth={2}
                textStyle={styles.progressText}
              />
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalLeaves}</Text>
                <Text style={styles.statLabel}>Total Leave</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.usedStat]}>{remainingLeaves}</Text>
                <Text style={styles.statLabel}>Used Leave</Text>
              </View>
            </View>
          </View>

          <View style={styles.leaveTypesContainer}>
            <Text style={styles.sectionTitle}>Leave Breakdown</Text>

            <View style={styles.leaveTypeRow}>

              <View style={styles.leaveTypeItem}>

                <View style={styles.leaveTypeDetails}>
                   <View style={[styles.leaveIconContainer, { backgroundColor: '#e9f0f7' }]}>
                  <Icon name="work" size={32} color="#002957" />
                </View>
                  <Text style={styles.leaveTypeName}>Paid Leave</Text>
                  <Text style={styles.leaveTypeStats}>{paidleave} of {totalLeaves} days</Text>
                </View>
                <Progress.Circle
                  size={70}
                  progress={leaveProgress(paidleave)}
                  color="orange"
                  unfilledColor="#e9f0f7"
                  // color="#002957"
                  // unfilledColor="#e9f0f7"
                  thickness={8}
                  borderWidth={2}
                />

              </View>

              <View style={styles.leaveTypeItem}>

                <View style={styles.leaveTypeDetails}>
                    <View style={[styles.leaveIconContainer, { backgroundColor: '#e9f0f7' }]}>
                  <Icon name="beach-access" size={32} color="#002957" />
                </View>
                  <Text style={styles.leaveTypeName}>Casual Leave</Text>
                  <Text style={styles.leaveTypeStats}>{casualLeaves} of {totalLeaves} days</Text>
                </View>
                <Progress.Circle
                  size={70}
                  progress={leaveProgress(casualLeaves)}
                  color="maroon"
                  unfilledColor="#e9f0f7"
                  // color="#002957"
                  // unfilledColor="#e9f0f7"
                  thickness={8}
                  borderWidth={2}
                />
              </View>
            </View>

            <View style={styles.leaveTypeRow}>
              <View style={styles.leaveTypeItem}>

                <View style={styles.leaveTypeDetails}>
                   <View style={[styles.leaveIconContainer, { backgroundColor: '#e9f0f7' }]}>
                  <Icon name="local-hospital" size={32} color="#002957" />
                </View>
                  <Text style={styles.leaveTypeName}>Sick Leave</Text>
                  <Text style={styles.leaveTypeStats}>{sickLeaves} of {totalLeaves} days</Text>
                </View>
                <Progress.Circle
                  size={70}
                  progress={leaveProgress(sickLeaves)}
                  color="brown"
                  unfilledColor="#e9f0f7"
                  // color="#002957"
                  // unfilledColor="#e9f0f7"
                  thickness={8}
                  borderWidth={2}
                />
              </View>

              <View style={styles.leaveTypeItem}>

                <View style={styles.leaveTypeDetails}>
                    <View style={[styles.leaveIconContainer, { backgroundColor: '#e9f0f7' }]}>
                  <Icon name="event-available" size={32} color="#002957" />
                </View>
                  <Text style={styles.leaveTypeName}>Optional Leave</Text>
                  <Text style={styles.leaveTypeStats}>{optionalLeave} of {totalLeaves} days</Text>
                </View>
                <Progress.Circle
                  size={70}
                  progress={leaveProgress(optionalLeave)}
                  color="#002957"
                  unfilledColor="#e9f0f7"
                  thickness={8}
                  borderWidth={2}
                />
              </View>
            </View>
          </View>
        </ScrollView>

        <FAB
          style={styles.fab}
          icon="history"
          label="Leave History"
          onPress={handleLeaveHistoryPress}
          color="white"
        />
      </SafeAreaView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  header: {
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002957',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002957',
  },
  balanceBadge: {
    backgroundColor: '#e9f0f7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceBadgeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002957',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002957',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002957',
    marginBottom: 4,
  },
  usedStat: {
    color: '#1a4a7a',
  },
  statLabel: {
    fontSize: 14,
    color: '#6c757d',
  },
  leaveTypesContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002957',
    marginBottom: 4,
  },
  leaveTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  leaveTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    width: '48%',
  },
  leaveIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  leaveTypeDetails: {
    flex: 1,
  },
  leaveTypeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#002957',
    marginBottom: 4,
  },
  leaveTypeStats: {
    fontSize: 12,
    color: '#6c757d',
  },
  fab: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#002957',
  },
});
