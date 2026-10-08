import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { themedStyles, C } from "../../Global/ThemeContext";

type PayrollStatus = "Draft" | "Calculated" | "Finalized";

interface Props {
  status: PayrollStatus | string;
}

// A function so the badge colours follow the active light / dark theme.
const getStatusConfig = (): Record<string, { bg: string; fg: string; label: string }> => ({
  Draft: { bg: C.surfaceAlt, fg: C.neutralText, label: "DRAFT" },
  Calculated: { bg: C.warningBg, fg: C.warningText, label: "CALCULATED" },
  Finalized: { bg: C.successBg, fg: C.successText, label: "FINALIZED" },
});

const PayrollStatusBadge: React.FC<Props> = ({ status }) => {
  const statusConfig = getStatusConfig();
  const config = statusConfig[status] || statusConfig.Draft;

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.fg }]}>{config.label}</Text>
    </View>
  );
};

const styles = themedStyles((c) => ({
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
}));

export default PayrollStatusBadge;
