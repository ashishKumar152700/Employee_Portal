import React, { useEffect, useState } from "react";
import { View, Text, SafeAreaView, StyleSheet } from "react-native";
import * as Progress from "react-native-progress";
import { useDispatch, useSelector } from "react-redux";
import { getLeaves } from "../../Services/Leave/Leave.service";
import { FAB } from "react-native-paper"; 
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../../Global/Types';
import { StackNavigationProp } from '@react-navigation/stack';

export default function MyLeaveScreen() {
  const [leaveDetails, setLeaveDetails] = useState(null);
  const dispatch = useDispatch();
  const leaveDetailsSelector = useSelector((state: any) => state.leaveDetails);
  const navigation = useNavigation(); 
  type leaveHistory = StackNavigationProp<RootStackParamList, 'leaveHistory'>;

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

  const totalLeaves = 24;
  const paidleave = leaveDetailsSelector?.paidleave ?? 0;
  const casualLeaves = leaveDetailsSelector?.casualleave ?? 0;
  const sickLeaves = leaveDetailsSelector?.sickleave ?? 0;
  const optionalLeave = leaveDetailsSelector?.optionalleave ?? 0;

  const leaveProgress = (usedLeaves) => usedLeaves / totalLeaves;

  const handleLeaveHistoryPress = () => {
    navigation.navigate('leaveHistory'); 
  };

  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cardDiv}>
        {/* Leave Balance */}
        <View style={styles.balanceCard}>
          <Progress.Circle
            size={130}
            progress={leaveProgress(paidleave + casualLeaves + sickLeaves + optionalLeave)}
            showsText
            formatText={() =>
              `${totalLeaves - (paidleave + casualLeaves + sickLeaves + optionalLeave)}`
            }
            color="#c087e6"
            unfilledColor="#E5E5E5"
            thickness={10}
            borderWidth={0}
          />
          <Text style={styles.balanceText}>Leave Balance</Text>
        </View>

        {/* Leave Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              <Text style={styles.bullet}>• </Text>
              <Text style={{fontSize:15}}>Total Leave</Text>
            </Text>
            <Text style={styles.summaryValue}>{totalLeaves}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              <Text style={styles.bullet}>• </Text>
              <Text style={{fontSize:15}}>Used Leave</Text>
            </Text>
            <Text style={[styles.summaryValue, { color: "#A020F0" }]}>
              {paidleave + casualLeaves + sickLeaves}
            </Text>
          </View>
        </View>

        {/* Leave Types */}
        <View style={styles.leaveTypesRow}>
          <View style={styles.leaveType}>
            <Progress.Circle
              size={80}
              progress={leaveProgress(paidleave)}
              showsText
              formatText={() => `${paidleave}`}
              color="#007BFF"
              unfilledColor="#E5E5E5"
              thickness={8}
              borderWidth={0}
            />
            <Text style={styles.leaveTypeLabel}>Paid Leave</Text>
          </View>
          <View style={styles.leaveType}>
            <Progress.Circle
              size={80}
              progress={leaveProgress(casualLeaves)}
              showsText
              formatText={() => `${casualLeaves}`}
              color="#28A745"
              unfilledColor="#E5E5E5"
              thickness={8}
              borderWidth={0}
            />
            <Text style={styles.leaveTypeLabel}>Casual Leave</Text>
          </View>
          <View style={styles.leaveType}>
            <Progress.Circle
              size={80}
              progress={leaveProgress(sickLeaves)}
              showsText
              formatText={() => `${sickLeaves}`}
              color="#FFC107"
              unfilledColor="#E5E5E5"
              thickness={8}
              borderWidth={0}
            />
            <Text style={styles.leaveTypeLabel}>Sick Leave</Text>
          </View>
          
          
        </View>

        <View style={styles.optional}>
            <Progress.Circle
              size={80}
              progress={leaveProgress(optionalLeave)}
              showsText
              formatText={() => `${optionalLeave}`}
              color="#d8315b"
              unfilledColor="#E5E5E5"
              thickness={8}
              borderWidth={0}
            />
            <Text style={styles.leaveTypeLabel}>Optional Leave</Text>

          </View>
            {/* <TabViewExample/> */}

        
      </View>

              <FAB
          style={styles.fab}
          icon="history"
          label="Leave History"
          onPress={handleLeaveHistoryPress}
          color="white"
        />

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  optional:{
    marginTop:35
  },
  cardDiv: {
    alignItems: "center",
    paddingTop: 20,
  },
  balanceCard: {
    alignItems: "center",
    marginBottom: 10,
  },
  balanceText: {
    marginTop: 12,
    fontSize: 18,
    fontWeight: "700",
    color: "#000",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "80%",
    marginVertical: 20,
  },
  summaryItem: {
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#A0A0A0",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#000",
  },
  leaveTypesRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 20,
  },
  bullet: {
    color: "grey",
    fontSize: 30,
    margin: 0,
  },
  leaveType: {
    alignItems: "center",
    width: "30%",
  },
  leaveTypeLabel: {
    fontSize: 14,
    color: "#A0A0A0",
    marginTop: 8,
    textAlign: "center",
  },
  fab: {
    position: "absolute",
    right: 16,
    bottom: 16,
    // backgroundColor: "purple",
    // backgroundColor: "#007BFF",
    backgroundColor: "rgb(0, 41, 87)",

  },
 
  fabLabel: {
    color: "white",  // Set font color to white
  },
});
