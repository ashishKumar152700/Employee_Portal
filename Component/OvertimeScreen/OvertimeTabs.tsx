import React from "react";
import { FlatList, View, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";

const Tab = createBottomTabNavigator();

const overtimeData = [
  {
    id: 1,
    requestDate: "2024-02-02",
    reason: "Project Deadline",
    status: "Pending",
  },
  {
    id: 2,
    requestDate: "2024-01-20",
    reason: "System Maintenance",
    status: "Approved",
  },
  {
    id: 3,
    requestDate: "2024-01-10",
    reason: "Year-End Work",
    status: "Declined",
  },
  {
    id: 4,
    requestDate: "2024-02-05",
    reason: "Team Shortage",
    status: "Pending",
  },
];

const OvertimeRoute = ({ status }: { status: string }) => {
  const filteredData = overtimeData.filter((item) => item.status === status);

  return filteredData.length === 0 ? (
    <Text style={styles.noDataText}>No records available</Text>
  ) : (
    <FlatList
      data={filteredData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.itemText}>• Overtime Request</Text>
            <Text style={[styles.statusText, getStatusColor(item.status)]}>
              {item.requestDate}
            </Text>
          </View>
          <Text style={styles.reasonText}>Reason: {item.reason}</Text>
        </View>
      )}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

export default function OvertimeNavigator() {
  return (
    <Tab.Navigator screenOptions={tabScreenOptions}>
      <Tab.Screen
        name="Pending"
        children={() => <OvertimeRoute status="Pending" />}
        options={{ tabBarIcon: getTabIcon("clock-o") }}
      />
      <Tab.Screen
        name="Approved"
        children={() => <OvertimeRoute status="Approved" />}
        options={{ tabBarIcon: getTabIcon("check") }}
      />
      <Tab.Screen
        name="Declined"
        children={() => <OvertimeRoute status="Declined" />}
        options={{ tabBarIcon: getTabIcon("times") }}
      />
    </Tab.Navigator>
  );
}

const tabScreenOptions = {
  tabBarStyle: {
    backgroundColor: "rgb(0,47,81)",
    height: 66,
    paddingBottom: 8,
  },
  tabBarActiveTintColor: "#ff9f43",
  tabBarInactiveTintColor: "#fff",
};

const getTabIcon =
  (iconName: string) =>
  ({ color }: { color: string }) =>
    <Icon name={iconName} color={color} size={25} />;

const styles = StyleSheet.create({
  noDataText: {
    textAlign: "center",
    color: "gray",
    fontSize: 16,
    marginTop: 20,
  },
  itemContainer: {
    padding: 15,
    margin: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 5,
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between" },
  itemText: { fontSize: 13, fontWeight: "600", color: "#444" },
  statusText: { fontSize: 14, fontWeight: "bold" },
  reasonText: { fontSize: 12, color: "#666", fontWeight: "500" },
  contentContainer: { paddingBottom: 50 },
});

const getStatusColor = (status: string) => ({
  color:
    status === "Pending" ? "#ff8600" : status === "Approved" ? "green" : "red",
});
