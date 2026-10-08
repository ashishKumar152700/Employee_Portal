import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PayrollAttendance } from "../../types/payroll.types";
import { themedStyles } from "../../Global/ThemeContext";

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

const styles = themedStyles((c) => ({
  grid: {
    gap: 10,
  },
  gridRow: {
    flexDirection: "row",
    gap: 10,
  },
  tile: {
    flex: 1,
    backgroundColor: c.background,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: "center",
  },
  tileAccent: {
    backgroundColor: c.primaryFaint,
    borderColor: c.border,
  },
  tileLabel: {
    fontSize: 12,
    color: c.textSoft,
    fontWeight: "500",
    marginBottom: 6,
    textAlign: "center",
  },
  tileLabelAccent: {
    color: c.accent,
    fontWeight: "600",
  },
  tileValue: {
    fontSize: 22,
    color: c.text,
    fontWeight: "800",
  },
  tileValueAccent: {
    color: c.accent,
  },
}));

export default AttendanceSummary;
