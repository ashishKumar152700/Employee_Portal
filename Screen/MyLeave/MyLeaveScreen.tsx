import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  Animated,
  Easing,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import { getLeaves } from "../../Services/Leave/Leave.service";
import { FAB } from "react-native-paper";
import { RootStackParamList } from "../../Global/Types";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const getLeaveIcon = (leaveCode: string) => {
  switch (leaveCode) {
    case "PL":
      return "payments";

    case "CL":
      return "weekend";

    case "SL":
      return "local-hospital";

    case "EL":
      return "work";

    case "ML":
      return "pregnant-woman";

    case "PTL":
      return "man";

    case "BL":
      return "groups";

    case "CO":
      return "cached";

    case "OH":
      return "celebration";

    default:
      return "event";
  }
};

const getLeaveColor = (leaveCode: string) => {
  switch (leaveCode) {
    case "PL":
      return "#2E7D32"; // Green

    case "CL":
      return "#FB8C00"; // Orange

    case "SL":
      return "#E53935"; // Red

    case "EL":
      return "#1565C0"; // Blue

    case "ML":
      return "#D81B60"; // Pink

    case "PTL":
      return "#3949AB"; // Indigo

    case "BL":
      return "#6D4C41"; // Brown

    case "CO":
      return "#00897B"; // Teal

    case "OH":
      return "#8E24AA"; // Purple

    default:
      return "#002957";
  }
};

export default function MyLeaveScreen() {
  const [fadeAnim] = useState(new Animated.Value(0));
  const dispatch = useDispatch();
  const leaveDetailsSelector = useSelector((state: any) => state.leaveDetails);
  const navigation = useNavigation();
  type leaveHistory = NativeStackNavigationProp<
    RootStackParamList,
    "leaveHistory"
  >;
  const [refreshing, setRefreshing] = useState(false);

  const fetchLeaveDetails = useCallback(async () => {
    try {
      await getLeaves(dispatch);
    } catch (error) {
      console.error("Error fetching leave details:", error);
    }
  }, [dispatch]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    await fetchLeaveDetails();

    setRefreshing(false);
  }, [fetchLeaveDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchLeaveDetails();
    }, [fetchLeaveDetails]),
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const getLeaveData = () => {
    if (
      !leaveDetailsSelector ||
      !leaveDetailsSelector.summary ||
      !leaveDetailsSelector.leaveTypes
    ) {
      return {
        summary: {
          allocated: 0,
          used: 0,
          remaining: 0,
          progress: 0,
        },
        leaveTypes: [],
      };
    }

    return leaveDetailsSelector;
  };

  const leaveData = getLeaveData();
  const summary = leaveData.summary;

  const paidLeave = leaveData.leaveTypes.find((l: any) => l.leaveCode === "PL");

  const casualLeave = leaveData.leaveTypes.find(
    (l: any) => l.leaveCode === "CL",
  );

  const sickLeave = leaveData.leaveTypes.find((l: any) => l.leaveCode === "SL");

  const optionalLeave = leaveData.leaveTypes.find(
    (l: any) => l.leaveCode === "OH",
  );
  console.log("Final Leave Data:", leaveData);

  const handleLeaveHistoryPress = () => {
    navigation.navigate("leaveHistory");
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <SafeAreaView style={styles.safeArea}>
        {/* <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        > */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Leaves</Text>
          </View>

          <View style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceTitle}>Leave Balance</Text>
              <View style={styles.balanceBadge}>
                <Text style={styles.balanceBadgeText}>
                  {summary.used} Used / {summary.allocated} Total
                </Text>
              </View>
            </View>

            <View style={styles.progressContainer}>
              <Progress.Circle
                size={120}
                progress={summary.progress}
                showsText
                formatText={() => `${summary.remaining}`}
                color="#002957"
                unfilledColor="#e9f0f7"
                thickness={10}
                borderWidth={2}
                textStyle={styles.progressText}
              />
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{summary.allocated}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.usedStat]}>
                  {summary.used}
                </Text>
                <Text style={styles.statLabel}>Used</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statNumber, styles.usedStat]}>
                  {summary.remaining}
                </Text>
                <Text style={styles.statLabel}>Remaining</Text>
              </View>
            </View>
          </View>

          <View style={styles.leaveTypesContainer}>
            <Text style={styles.sectionTitle}>Leave Breakdown</Text>

            <View style={styles.radioButtonContainer}>
              {leaveData.leaveTypes.map((item: any) => (
                <View key={item.leaveCode} style={styles.leaveTypeItem}>
                  <View style={styles.progressWithIcon}>
                    <Progress.Circle
                      size={50}
                      progress={item.progress ?? 0}
                      color="#002957"
                      unfilledColor="#e9f0f7"
                      thickness={8}
                      borderWidth={2}
                    />

                    <View style={styles.iconInsideCircle}>
                      <Icon
                        name={getLeaveIcon(item.leaveCode)}
                        size={22}
                        color={getLeaveColor(item.leaveCode)}
                      />
                    </View>
                  </View>

                  <View style={styles.leaveTypeDetails}>
                    <Text style={styles.leaveTypeName}>{item.title}</Text>

                    <Text style={styles.leaveMonthlyText}>
                      {item.used} Used
                    </Text>

                    <Text
                      style={[
                        styles.leaveLeftText,
                        item.remaining <= 0 && {
                          color: "#dc3545",
                        },
                      ]}
                    >
                      {item.remaining} / {item.allocated}
                    </Text>
                  </View>
                </View>
              ))}
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
    backgroundColor: "#f8f9fa",
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
    fontWeight: "bold",
    color: "#002957",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6c757d",
  },
  balanceCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  balanceTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
  },
  balanceBadge: {
    backgroundColor: "#e9f0f7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  balanceBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#002957",
  },
  progressContainer: {
    alignItems: "center",
    marginBottom: 4,
  },
  progressText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#002957",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#002957",
    marginBottom: 4,
  },
  usedStat: {
    color: "#1a4a7a",
  },
  statLabel: {
    fontSize: 11,
    color: "#28a745",
    fontWeight: "500",
  },
  leaveTypesContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  radioButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    // paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
    marginBottom: 14,
  },
  leaveTypeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  // leaveTypeItem: {
  //   flexDirection: 'row',
  //   alignItems: 'center',
  //   backgroundColor: '#f8f9fa',
  //   borderRadius: 12,
  //   padding: 14,
  //   width: '48%',
  // },
  leaveIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  // leaveTypeDetails: {
  //   flex: 1,
  // },
  leaveTypeName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#002957",
    marginBottom: 4,
  },
  leaveTypeStats: {
    fontSize: 12,
    color: "#6c757d",
    marginBottom: 2,
  },
  leaveLeftText: {
    fontSize: 11,
    color: "#28a745",
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 92,
    backgroundColor: "#002957",
  },
  progressWithIcon: {
    position: "relative",
    marginRight: 12,
  },
  iconInsideCircle: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  leaveTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    padding: 12,
    width: "48%",
  },
  leaveTypeDetails: {
    flex: 1,
  },
  leaveMonthlyText: {
    fontSize: 10,
    color: "#6c757d",
    marginBottom: 2,
  },
});
