import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PayrollAttendance } from "../../types/payroll.types";

interface Props {
  attendance: PayrollAttendance;
}

interface StatTileProps {
  label: string;
  value: number;
  accent?: boolean;
}

const StatTile: React.FC<StatTileProps> = ({ label, value, accent }) => (
  <View style={[styles.tile, accent && styles.tileAccent]}>
    <Text style={[styles.tileLabel, accent && styles.tileLabelAccent]}>
      {label}
    </Text>
    <Text style={[styles.tileValue, accent && styles.tileValueAccent]}>
      {value}
    </Text>
  </View>
);

const AttendanceSummary: React.FC<Props> = ({ attendance }) => {
  return (
    <View style={styles.grid}>
      <View style={styles.gridRow}>
        <StatTile label="Calendar Days" value={attendance.calendarDays} />
        <StatTile label="Payable Days" value={attendance.payableDays} accent />
      </View>
      <View style={styles.gridRow}>
        <StatTile label="Paid Days" value={attendance.paidDays} accent />
        <StatTile label="LOP Days" value={attendance.lopDays} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E9ECEF",
    alignItems: "center",
  },
  tileAccent: {
    backgroundColor: "#EEF3FB",
    borderColor: "rgba(0, 41, 87, 0.15)",
  },
  tileLabel: {
    fontSize: 12,
    color: "#6C757D",
    fontWeight: "500",
    marginBottom: 6,
    textAlign: "center",
  },
  tileLabelAccent: {
    color: "rgb(0, 41, 87)",
    fontWeight: "600",
  },
  tileValue: {
    fontSize: 22,
    color: "#343A40",
    fontWeight: "800",
  },
  tileValueAccent: {
    color: "rgb(0, 41, 87)",
  },
});

export default AttendanceSummary;
