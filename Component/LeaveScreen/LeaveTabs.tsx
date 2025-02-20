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

const Tab = createBottomTabNavigator();

// Format only the applied date to "26 Jan 2025"
const formatAppliedDate = (dateString) => {
  const date = new Date(dateString);
  // If the date is invalid, return the original string
  if (isNaN(date.getTime())) return dateString;
  const options = {
    day: "numeric" as const,
    month: "short" as const,
    year: "numeric" as const,
  };
  return date.toLocaleDateString("en-GB", options);
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

  if (loading) {
    return (
      <ActivityIndicator size="large" color="#ff9f43" style={styles.loader} />
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return leaveData.length === 0 ? (
    <Text style={styles.noDataText}>No leave records available</Text>
  ) : (
    <FlatList
      data={leaveData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.itemText}>• {item.leavetype}</Text>
            <Text
              style={[
                styles.appliedDateText,
                leaveType === "Pending" && { color: "#ff8600" },
                leaveType === "Approve" && { color: "green" },
                leaveType === "Decline" && { color: "red" },
              ]}
            >
              {formatAppliedDate(item.applydate)}
            </Text>
          </View>
          <Text style={styles.durationText}>
            Applied From {item.leavestart} to {item.leaveend}
          </Text>
          <Text style={styles.durationText}>Reason : {item.reason}</Text>
        </View>
      )}
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
    textAlign: "center",
    color: "gray",
    fontSize: 16,
    marginTop: 20,
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
});
