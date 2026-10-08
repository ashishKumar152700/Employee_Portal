import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PayrollTaxDetail } from "../../types/payroll.types";

interface Props {
  tax: PayrollTaxDetail;
}

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface RowProps {
  label: string;
  value: string;
  bold?: boolean;
}

const TaxRow: React.FC<RowProps> = ({ label, value, bold }) => (
  <View style={[styles.row, bold && styles.rowBold]}>
    <Text style={[styles.rowLabel, bold && styles.rowLabelBold]}>{label}</Text>
    <Text style={[styles.rowValue, bold && styles.rowValueBold]}>{value}</Text>
  </View>
);

const TaxSummaryCard: React.FC<Props> = ({ tax }) => {
  return (
    <View style={styles.card}>
      <TaxRow label="Financial Year" value={tax.financialYear} />
      <TaxRow label="Assessment Year" value={tax.assessmentYear} />
      <TaxRow label="Tax Regime" value={tax.taxRegime} />
      <View style={styles.separator} />
      <TaxRow label="Gross Income" value={formatCurrency(tax.grossIncome)} />
      <TaxRow
        label="Standard Deduction"
        value={formatCurrency(tax.standardDeduction)}
      />
      <TaxRow
        label="Taxable Income"
        value={formatCurrency(tax.taxableIncome)}
        bold
      />
      <View style={styles.separator} />
      <TaxRow label="Tax Payable" value={formatCurrency(tax.taxPayable)} />
      <TaxRow label="TDS" value={formatCurrency(tax.tds)} />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E9ECEF",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  rowBold: {
    backgroundColor: "#EEF3FB",
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: "#6C757D",
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  rowLabelBold: {
    color: "rgb(0, 41, 87)",
    fontWeight: "700",
  },
  rowValue: {
    fontSize: 14,
    color: "#212529",
    fontWeight: "600",
    textAlign: "right",
  },
  rowValueBold: {
    color: "rgb(0, 41, 87)",
    fontWeight: "800",
  },
  separator: {
    height: 1,
    backgroundColor: "#E9ECEF",
    marginVertical: 6,
  },
});

export default TaxSummaryCard;
