// radial circle
import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import { getLeaves } from '../../Services/Leave/Leave.service' ;

export default function MyLeaveScreen() {
  const [leaveDetails, setLeaveDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("Approvals");

  const dispatch = useDispatch();
  const leaveDetailsSelector = useSelector((state: any) => state.leaveDetails);
  console.log("leaveDetailsSelector : " , leaveDetailsSelector);
  

  useLayoutEffect(() => {
    async function fetchLeaveDetails() {
      try {
        const leaves = await getLeaves(dispatch);
        setLeaveDetails(leaves.data.data);
        console.log("leaveDetails from fetchLeaveDetails : " , leaveDetails);
        
      } catch (error) {
        console.error("Error fetching leave details:", error);
      }
    }
    fetchLeaveDetails();
  }, [dispatch]);

  const totalLeaves = 28;
  const casualLeavesAllowed = 6;
  const sickLeavesAllowed = 6;
  const paidAllowed = 12;
  const optionalAllowed = 4;

  const casualLeaves = leaveDetailsSelector?.casualleave ?? 0;
  const sickLeaves = leaveDetailsSelector?.sickleave ?? 0;
  const paid = leaveDetailsSelector?.paidleave ?? 0;
  const optional = leaveDetailsSelector?.optionalleave ?? 0;

  const usedLeaves = casualLeaves + sickLeaves + paid + optional;
  const leaveBalance = totalLeaves - usedLeaves;

  const progressLB = leaveBalance / totalLeaves;
  const progressCasual = (casualLeavesAllowed - casualLeaves) / casualLeavesAllowed;
  const progressSick = (sickLeavesAllowed - sickLeaves) / sickLeavesAllowed;
  const progressPaid = (paidAllowed - paid) / paidAllowed;
  const progressOptional = (optionalAllowed - optional) / optionalAllowed;

  const tabs = ["Approvals", "Leave History", "Approved", "Declined"];

  const onTabPress = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardDiv}>
        <View style={styles.balanceCard}>
          <View style={{ marginBottom: 45 }}>
            <Progress.Circle
              size={140}
              progress={progressLB}
              showsText
              formatText={() => `${leaveBalance}/${totalLeaves}`}
              textStyle={styles.progressText}
              color="#A020F0"
              unfilledColor="lavender"
              thickness={10}
            />
            <Text style={styles.balanceText}>Leave Balance</Text>
          </View>
          <View style={[styles.leaveTypeCircle, styles.casual]}>
            <Progress.Circle
              size={60}
              progress={progressCasual}
              showsText
              formatText={() => `${casualLeavesAllowed - casualLeaves}`}
              textStyle={styles.progressTextEH}
              color="orange"
              unfilledColor="#FFDAB9"
              thickness={6}
            />
            <Text style={styles.leaveTypeTextCasual}>Casual</Text>
          </View>
          <View style={[styles.leaveTypeCircle, styles.sick]}>
            <Progress.Circle
              size={60}
              progress={progressSick}
              showsText
              formatText={() => `${sickLeavesAllowed - sickLeaves}`}
              textStyle={styles.progressTextEH}
              color="green"
              unfilledColor="yellowgreen"
              thickness={6}
            />
            <Text style={styles.leaveTypeTextSick}>Sick</Text>
          </View>
          <View style={[styles.leaveTypeCircle, styles.optional]}>
            <Progress.Circle
              size={60}
              progress={progressOptional}
              showsText
              formatText={() => `${optionalAllowed - optional}`}
              textStyle={styles.progressTextEH}
              color="#4FC3F7"
              unfilledColor="#E0F7FA"
              thickness={6}
            />
            <Text style={styles.leaveTypeTextOptional}>Optional</Text>
          </View>
          <View style={[styles.leaveTypeCircle, styles.paid]}>
            <Progress.Circle
              size={60}
              progress={progressPaid}
              showsText
              formatText={() => `${paidAllowed - paid}`}
              textStyle={styles.progressTextEH}
              color="#D81B90"
              unfilledColor="#FCE4EC"
              thickness={6}
            />
            <Text style={styles.leaveTypeTextPaid}>Paid</Text>
          </View>
        </View>
      </View>

      <View>
        <FlatList
          horizontal
          data={tabs}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsSection}
          renderItem={({ item }) => {
            const selected = activeTab === item;
            return (
              <TouchableOpacity
                onPress={() => onTabPress(item)}
                style={[
                  styles.tabButton,
                  selected && conditionalStyles.activeTab,
                ]}
              >
                <Text
                  style={
                    selected
                      ? conditionalStyles.activeTabText
                      : conditionalStyles.tabText
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
        <View style={conditionalStyles.contentSection}>
          {activeTab === "Approvals" && <Text>Approvals Content</Text>}
          {activeTab === "Leave History" && <Text>Leave History Content</Text>}
          {activeTab === "Approved" && <Text>Approved Content</Text>}
          {activeTab === "Declined" && <Text>Declined Content</Text>}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  cardDiv: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    marginBottom: 5,
  },
  // Center Leave Balance
  balanceCard: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 200, // Adjust to your desired size
    width: 200, // Adjust to your desired size
  },
  balanceText: {
    marginTop: 8,
    fontSize: 18,
    // color: "#555",
    textAlign: "center",
    fontWeight: "900",
    color: "#A020F0",
  },
  // Smaller Circles Positioned Radially
  leaveTypeCircle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  casual: {
    top: -40, // Position above the center circle
    left: -60,
  },
  sick: {
    bottom: 10, // Position below the center circle
    right: -50,
  },
  optional: {
    bottom: 10, // Position slightly bottom-left
    left: -60,
  },
  paid: {
    top: -40, // Position slightly top-right
    right: -50,
  },
  progressTextEH: {
    fontSize: 18,
    fontWeight: "800",
  },
  leaveTypeTextCasual: {
    fontSize: 14,
    color: "orange",
    textAlign: "center",
    fontWeight: "700",
  },
  leaveTypeTextSick: {
    fontSize: 14,
    color: "green",
    textAlign: "center",
    fontWeight: "700",
  },
  leaveTypeTextPaid: {
    fontSize: 14,
    color: "#D81B90",
    textAlign: "center",
    fontWeight: "700",
  },
  leaveTypeTextOptional: {
    fontSize: 14,
    color: "#4FC3F7",
    textAlign: "center",
    fontWeight: "700",
  },
  tabsSection: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 10,
  },
  tabButton: {
    paddingVertical: 5,
    paddingHorizontal: 15,
  },
  progressText: {
    fontSize: 32,
    fontWeight: "bold",
  },
});

const conditionalStyles = StyleSheet.create({
  activeTab: {
    borderBottomColor: "#007AFF", // Active tab underline color
    borderBottomWidth: 2, // Optional underline thickness
  },
  tabText: {
    fontSize: 16,
    color: "#555",
    fontWeight: "600",
  },
  activeTabText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#007AFF", // Active tab text color
  },
  contentSection: {
    padding: 16,
    // backgroundColor:'yellow'
  },
});
