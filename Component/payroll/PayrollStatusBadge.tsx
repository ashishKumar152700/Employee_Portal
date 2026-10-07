import React from "react";
import { View, Text, StyleSheet } from "react-native";

type PayrollStatus = "Draft" | "Calculated" | "Finalized";

interface Props {
  status: PayrollStatus | string;
}

const STATUS_CONFIG: Record<string, { bg: string; fg: string; label: string }> = {
  Draft: { bg: "#E9ECEF", fg: "#495057", label: "DRAFT" },
  Calculated: { bg: "#FFF3CD", fg: "#856404", label: "CALCULATED" },
  Finalized: { bg: "#D4EDDA", fg: "#155724", label: "FINALIZED" },
};

const PayrollStatusBadge: React.FC<Props> = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});

export default PayrollStatusBadge;
