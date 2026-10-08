import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import PayrollStatusBadge from "./PayrollStatusBadge";
import { PayrollHistoryItem } from "../../types/payroll.types";
import { themedStyles } from "../../Global/ThemeContext";

interface Props {
  item: PayrollHistoryItem;
  onPress: () => void;
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatCurrencyShort = (value: number) =>
  `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const PayrollSummaryCard: React.FC<Props> = ({ item, onPress }) => {
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress}>
      <LinearGradient
        colors={["rgb(0, 41, 87)", "rgba(0, 41, 87, 0.85)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.topRow}>
          <Text style={styles.monthTitle}>
            Payroll – {item.month} {item.year}
          </Text>
          <View style={styles.badgeWrapper}>
            <PayrollStatusBadge status={item.status} />
          </View>
        </View>

        <View style={styles.netSection}>
          <Text style={styles.netLabel}>Net Salary</Text>
          <Text style={styles.netValue}>{formatCurrency(item.netSalary)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Gross</Text>
            <Text style={styles.statValue}>
              {formatCurrencyShort(item.grossSalary)}
            </Text>
          </View>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Deductions</Text>
            <Text style={styles.statValue}>
              {formatCurrencyShort(item.totalDeductions)}
            </Text>
          </View>
        </View>

        <View style={styles.viewRow}>
          <Text style={styles.viewText}>View Payroll</Text>
          <Text style={styles.arrow}>→</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = themedStyles((c) => ({
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  monthTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 8,
  },
  badgeWrapper: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    padding: 2,
  },
  netSection: {
    marginBottom: 16,
  },
  netLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  netValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 14,
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 3,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  viewRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 10,
    paddingVertical: 10,
  },
  viewText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  arrow: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
}));

export default PayrollSummaryCard;
