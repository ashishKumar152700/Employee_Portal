import React, { useEffect, useLayoutEffect, useState } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import { getLeaves, leaveHistoryPending } from "../../Services/Leave/Leave.service";
import TabViewExample from "../../Component/LeaveScreen/LeaveTabs";

export default function MyLeaveScreen() {
  const [leaveDetails, setLeaveDetails] = useState(null);
  const [pendingLeave, setPendingLeave] = useState(null);
  const [activeTab, setActiveTab] = useState("Pending");

  const dispatch = useDispatch();
  const leaveDetailsSelector = useSelector((state:any) => state.leaveDetails);

  useLayoutEffect(() => {
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
  const leaveBalance = totalLeaves;

  const progressLB =  totalLeaves;
  const progressCasual = (casualLeavesAllowed - casualLeaves) / casualLeavesAllowed;
  const progressSick = (sickLeavesAllowed - sickLeaves) / sickLeavesAllowed;
  const progressPaid = (paidAllowed - paid) / paidAllowed;
  const progressOptional = (optionalAllowed - optional) / optionalAllowed;

  useEffect(() => {
    const fetchPendingLeave = async () => {
      try {
        const pendingLeave = await leaveHistoryPending("Pending");
        setPendingLeave(pendingLeave);
      } catch (error) {
        console.error("Error fetching pending leave:", error);
      }
    };
    fetchPendingLeave();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardDiv}>
        <View style={styles.balanceCard}>
          <View style={{ marginBottom: 45 }}>
            <Progress.Circle
              size={140}
              progress={progressLB}
              showsText
              formatText={() => `${leaveBalance}`}
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
              formatText={() => `${casualLeaves}`}
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
              formatText={() => `${sickLeaves}`}
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
              formatText={() => `${optional}`}
              color="#f44708"
              unfilledColor="#f44708"
              thickness={6}
            />
            <Text style={styles.leaveTypeTextOptional}>Optional</Text>
          </View>
          <View style={[styles.leaveTypeCircle, styles.paid]}>
            <Progress.Circle
              size={60}
              progress={progressPaid}
              showsText
              formatText={() => `${paid}`}
              color="#D81B90"
              unfilledColor="#FCE4EC"
              thickness={6}
            />
            <Text style={styles.leaveTypeTextPaid}>Paid</Text>
          </View>
        </View>
      </View>
      <TabViewExample/>
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
  balanceCard: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    height: 200,
    width: 200,
  },
  balanceText: {
    marginTop: 8,
    fontSize: 18,
    textAlign: "center",
    fontWeight: "900",
    color: "#A020F0",
  },
  leaveTypeCircle: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  casual: {
    top: -40,
    left: -60,
  },
  sick: {
    bottom: 10,
    right: -50,
  },
  optional: {
    bottom: 10,
    left: -60,
  },
  paid: {
    top: -40,
    right: -50,
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
  leaveTypeTextOptional: {
    fontSize: 14,
    color: "#f44708",
    textAlign: "center",
    fontWeight: "700",
  },
  leaveTypeTextPaid: {
    fontSize: 14,
    color: "#D81B90",
    textAlign: "center",
    fontWeight: "700",
  },
});
