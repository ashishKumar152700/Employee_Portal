import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PayrollComponent } from "../../types/payroll.types";
import { themedStyles } from "../../Global/ThemeContext";

interface Props {
  component: PayrollComponent;
  isLast?: boolean;
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getComponentLabel = (component: PayrollComponent): string => {
  return component.name || component.code;
};

const PayrollComponentRow: React.FC<Props> = ({ component, isLast }) => {
  return (
    <View style={[styles.row, isLast && styles.lastRow]}>
      <View style={styles.left}>
        <View style={styles.dot} />
        <Text style={styles.label} numberOfLines={1} ellipsizeMode="tail">
          {getComponentLabel(component)}
        </Text>
      </View>
      <Text style={styles.amount}>{formatCurrency(component.currentAmount)}</Text>
    </View>
  );
};

const styles = themedStyles((c) => ({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.primary,
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    color: c.textSoft,
    fontWeight: "500",
    flex: 1,
  },
  amount: {
    fontSize: 14,
    color: c.accent,
    fontWeight: "700",
  },
}));

export default PayrollComponentRow;
