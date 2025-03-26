import React, { useEffect, useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";
import { leaveHistoryPending } from "../../Services/Leave/Leave.service";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const Tab = createBottomTabNavigator();

// Format only the applied date to "26 Jan 2025"
const formatAppliedDate = (dateString, showTime = false) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  let formattedDate = `${day}-${month}-${year}`;

  if (showTime) {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    formattedDate += ` ${hours}:${minutes}`;
  }

  return formattedDate;
};


const LeaveRoute = ({ leaveType }) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await leaveHistoryPending(leaveType);
        if (response.status === 200) {
          setLeaveData(response.data.data);
          console.log("Leave Data:", response.data.data);

        } else {
          setError("Failed to fetch data");
        }
      } catch (error) {
        setError("Error fetching data");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaveData();
  }, [leaveType]);
  // console.log("yahi undefined hai kya ",formatAppliedDate(leaveData[0].applydate));


  if (loading) {
    return (
      <ActivityIndicator size="large" color="#ff9f43" style={styles.loader} />
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return leaveData.length === 0 ? (
    <View style={styles.emptyContainer}>
    <MaterialCommunityIcons name="calendar-remove" size={50} color="#999" />
    <Text style={styles.noDataText}>No leave records available</Text>
  </View>
  ) : (
    <FlatList
      data={leaveData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        const startDate = new Date(item.leavestart);
        const endDate = new Date(item.leaveend);

        // Days difference nikal rahe hai
        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24)) + 1; // inclusive

        return (
          <View style={styles.itemContainer}>
            <View style={styles.headerRow}>
              <Text style={styles.itemText}>• {item.leavetype}</Text>
              <Text
                style={[
                  styles.appliedDateText,
                  item.leavestatus === "Pending" && { color: "#ff8600" },
                  item.leavestatus === "Approve" && { color: "green" },
                  item.leavestatus === "Decline" && { color: "red" },
                ]}
              >
                {formatAppliedDate(item.applydate, true)}
              </Text>
            </View>


            <Text style={styles.durationText}>
              {item.leavestart === item.leaveend
                ? `Leave Date: ${formatAppliedDate(item.leavestart)} (${item.leavepart === "full-day" ? "Full Day" : item.leavepart === "first-half" ? "First Half" : "Second Half"})`
                : `Leave From ${formatAppliedDate(item.leavestart)} to ${formatAppliedDate(item.leaveend)} (${dayDiff} Day${dayDiff > 1 ? "s" : ""})`}
            </Text>

            {/* <Text style={styles.durationText}>Leave Details:</Text> */}


            {/* {item.leavestart === item.leaveend && (
              <Text style={styles.durationText}>
                Leave Part: {item.leavepart === "full-day" ? "Full Day" : item.leavepart === "first-half" ? "First Half" : "Second Half"}
              </Text>
            )} */}

            <Text style={styles.durationText}>Reason: {item.reason}</Text>
          </View>
        );
      }}
      contentContainerStyle={styles.contentContainer}
    />

  );
};

export default function LeaveTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "rgb(0, 41, 87)",
          height: 66,
          paddingBottom: 8,
          position: "absolute",
        },
        tabBarActiveTintColor: "#ff9f43",
        tabBarInactiveTintColor: "#fff",
      }}
    >
      <Tab.Screen
        name="Pending"
        children={() => <LeaveRoute leaveType="Pending" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon name="clock-o" color={color} size={25} />
          ),
        }}
      />
      <Tab.Screen
        name="Approved"
        children={() => <LeaveRoute leaveType="Approve" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon name="check" color={color} size={25} />
          ),
        }}
      />
      <Tab.Screen
        name="Declined"
        children={() => <LeaveRoute leaveType="Decline" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => (
            <Icon name="times" color={color} size={25} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  noDataText: {
    fontSize: 16,
    color: "#777",
    marginTop: 10,
    fontWeight: "500",
  },
  itemContainer: {
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  appliedDateText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  durationText: {
    fontSize: 12,
    marginBottom: 4,
    color: "#808080",
    fontWeight: "500",
  },
  contentContainer: {
    paddingBottom: 50,
    backgroundColor: "white",
    height: "100%",
  },
  loader: {
    marginTop: 20,
    alignSelf: "center",
  },
  errorText: {
    textAlign: "center",
    color: "#d9534f",
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 20,
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 50,
  },

});
