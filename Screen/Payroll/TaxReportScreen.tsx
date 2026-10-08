import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import {
  getEmployeeTaxReport,
  getPayrollEmployeeId,
} from "../../Services/Payroll/payroll.service";
import { TaxReport, TaxMonthlyRecord } from "../../types/payroll.types";
import { downloadPdf, openPdfExternally } from "../../src/utils/pdfUtils";
import { themedStyles, C } from "../../Global/ThemeContext";

const PRIMARY = "rgb(0, 41, 87)";

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface RowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const SummaryRow: React.FC<RowProps> = ({ label, value, highlight }) => (
  <View style={[styles.row, highlight && styles.rowHighlight]}>
    <Text style={[styles.rowLabel, highlight && styles.rowLabelHighlight]}>
      {label}
    </Text>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>
      {value}
    </Text>
  </View>
);

const TaxReportScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const userDetails = useSelector((state: any) => state.userDetails);
  const userId: number | undefined = userDetails?.user?.id;
  const employeeCode: string | undefined =
    userDetails?.user?.employeecode !== undefined &&
    userDetails?.user?.employeecode !== null
      ? String(userDetails.user.employeecode)
      : undefined;

  const [payrollEmployeeId, setPayrollEmployeeId] = useState<number | null>(null);
  const [report, setReport] = useState<TaxReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    try {
      setError(null);

      const resolvedPayrollEmployeeId = await getPayrollEmployeeId();
      if (!resolvedPayrollEmployeeId) {
        throw new Error("Unable to identify your employee record.");
      }
      setPayrollEmployeeId(resolvedPayrollEmployeeId);

      console.log("[Payroll] Loading tax report", {
        userId,
        payrollEmployeeId: resolvedPayrollEmployeeId,
        employeeCode,
      });

      const data = await getEmployeeTaxReport(resolvedPayrollEmployeeId);
      setReport(data);
    } catch (err: any) {
      setError(err.message || "Unable to load tax report.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, employeeCode]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchReport();
  }, [fetchReport]);

  const handleDownloadPdf = useCallback(async () => {
    if (!payrollEmployeeId || pdfLoading) return;
    setPdfLoading(true);
    try {
      Toast.show({
        type: "info",
        position: "top",
        text1: "Preparing tax report…",
        visibilityTime: 2000,
        autoHide: true,
      });

      const result = await downloadPdf(
        `/api/v1/payroll/tax/report/employee/${payrollEmployeeId}/pdf`,
        `tax_report_${payrollEmployeeId}.pdf`
      );

      Toast.show({
        type: "success",
        position: "top",
        text1: "Tax Report PDF ready",
        visibilityTime: 2000,
        autoHide: true,
      });

      await openPdfExternally(result.uri);
    } catch (err: any) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Unable to open tax report",
        text2: err.message || "Unable to download tax report. Please try again.",
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setPdfLoading(false);
    }
  }, [payrollEmployeeId, pdfLoading]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>Loading tax report…</Text>
          <View style={styles.skeletonCard} />
          <View style={[styles.skeletonCard, { height: 160 }]} />
          <View style={[styles.skeletonCard, { height: 100 }]} />
        </View>
      </View>
    );
  }

  if (error || !report) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <MaterialIcons name="cloud-off" size={56} color={C.textFaint} />
          <Text style={styles.errorTitle}>Unable to load payroll.</Text>
          <Text style={styles.errorSubtitle}>{error || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchReport}>
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
      >
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={20} color={C.accent} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={[PRIMARY, "rgba(0, 41, 87, 0.85)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerCard}
        >
          <Text style={styles.headerTitle}>Tax Summary</Text>
          <View style={styles.headerDivider} />
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Employee</Text>
            <Text style={styles.headerValue}>{report.employee.name}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Employee Code</Text>
            <Text style={styles.headerValue}>
              {String(report.employee.employeeCode)}
            </Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Financial Year</Text>
            <Text style={styles.headerValue}>{report.financialYear}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Assessment Year</Text>
            <Text style={styles.headerValue}>{report.assessmentYear}</Text>
          </View>
          <View style={styles.headerRow}>
            <Text style={styles.headerLabel}>Tax Regime</Text>
            <Text style={styles.headerValue}>{report.taxRegime}</Text>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Annual Summary</Text>
          <View style={styles.divider} />
          <SummaryRow
            label="Annual Gross Income"
            value={formatCurrency(report.annualGrossIncome)}
          />
          <SummaryRow
            label="Standard Deduction"
            value={formatCurrency(report.standardDeduction)}
          />
          <SummaryRow
            label="Taxable Income"
            value={formatCurrency(report.taxableIncome)}
            highlight
          />
          <View style={styles.separator} />
          <SummaryRow label="Total Tax" value={formatCurrency(report.totalTax)} />
          <SummaryRow label="Total TDS" value={formatCurrency(report.totalTds)} />
        </View>

        <Text style={styles.sectionTitle}>Monthly Tax Summary</Text>
        {report.monthlyRecords.length > 0 ? (
          report.monthlyRecords.map((record: TaxMonthlyRecord, idx: number) => (
            <View key={`${record.payrollId}-${idx}`} style={styles.monthCard}>
              <Text style={styles.monthTitle}>
                {record.month} {record.year}
              </Text>
              <View style={styles.monthDivider} />
              <View style={styles.monthRow}>
                <Text style={styles.monthLabel}>Taxable Income</Text>
                <Text style={styles.monthValue}>
                  {formatCurrency(record.taxableIncome)}
                </Text>
              </View>
              <View style={styles.monthRow}>
                <Text style={styles.monthLabel}>TDS</Text>
                <Text style={styles.monthValue}>{formatCurrency(record.tds)}</Text>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.card}>
            <Text style={styles.noDataText}>
              No monthly tax records available for this financial year.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.downloadButton}
          activeOpacity={0.8}
          onPress={handleDownloadPdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialIcons name="file-download" size={18} color="#fff" />
          )}
          <Text style={styles.downloadButtonText}>
            {pdfLoading ? "Preparing…" : "Download Tax Report"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast />
    </View>
  );
};

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backRow: {
    marginBottom: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: c.primaryFaint,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: c.accent,
    marginLeft: 4,
  },
  headerCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 6,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 10,
  },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
  },
  headerLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
  },
  headerValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
    flex: 1,
    textAlign: "right",
  },
  card: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: c.accent,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  divider: {
    height: 1.5,
    backgroundColor: c.surfaceAlt,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
  },
  rowHighlight: {
    backgroundColor: c.primaryFaint,
    marginHorizontal: -8,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  rowLabel: {
    fontSize: 14,
    color: c.textSoft,
    fontWeight: "500",
    flex: 1,
    marginRight: 8,
  },
  rowLabelHighlight: {
    color: c.accent,
    fontWeight: "700",
  },
  rowValue: {
    fontSize: 14,
    color: c.text,
    fontWeight: "600",
    textAlign: "right",
  },
  rowValueHighlight: {
    color: c.accent,
    fontWeight: "800",
  },
  separator: {
    height: 1,
    backgroundColor: c.surfaceAlt,
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
    marginBottom: 10,
    marginTop: 6,
  },
  monthCard: {
    backgroundColor: c.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
    marginBottom: 6,
  },
  monthDivider: {
    height: 1,
    backgroundColor: c.surfaceAlt,
    marginBottom: 6,
  },
  monthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  monthLabel: {
    fontSize: 13,
    color: c.textSoft,
    fontWeight: "500",
  },
  monthValue: {
    fontSize: 13,
    color: c.text,
    fontWeight: "600",
  },
  noDataText: {
    fontSize: 14,
    color: c.textSoft,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
    marginTop: 8,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  downloadButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    marginLeft: 8,
  },
  centerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: c.textSoft,
    marginBottom: 24,
  },
  skeletonCard: {
    width: "100%",
    height: 120,
    backgroundColor: c.surfaceAlt,
    borderRadius: 14,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: c.text,
    marginTop: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: c.textSoft,
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: PRIMARY,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  retryText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
}));

export default TaxReportScreen;
