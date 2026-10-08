import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { getPayslipData } from "../../Services/Payroll/payroll.service";
import { PayslipData, PayrollComponent } from "../../types/payroll.types";
import PayrollComponentRow from "../../Component/payroll/PayrollComponentRow";
import { downloadPdf, openPdfExternally } from "../../src/utils/pdfUtils";

const PRIMARY = "rgb(0, 41, 87)";

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const PayslipScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { payrollId, autoDownloadPdf } = route.params || {};

  const [payslip, setPayslip] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const autoDownloadRef = useRef<boolean>(!!autoDownloadPdf);

  const fetchData = useCallback(async () => {
    if (!payrollId) {
      setError("Payroll record was not found.");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getPayslipData(payrollId);
      setPayslip(data);
    } catch (err: any) {
      setError(err.message || "Unable to load payslip.");
    } finally {
      setLoading(false);
    }
  }, [payrollId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDownloadPdf = useCallback(async () => {
    if (!payrollId || pdfLoading) return;
    setPdfLoading(true);
    try {
      Toast.show({
        type: "info",
        position: "top",
        text1: "Preparing payslip…",
        visibilityTime: 2000,
        autoHide: true,
      });

      const result = await downloadPdf(
        `/api/v1/payroll/payslip/${payrollId}/pdf`,
        `payslip_${payrollId}.pdf`
      );

      Toast.show({
        type: "success",
        position: "top",
        text1: "Payslip PDF ready",
        visibilityTime: 2000,
        autoHide: true,
      });

      await openPdfExternally(result.uri);
    } catch (err: any) {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Unable to open payslip",
        text2: err.message || "Unable to download payslip. Please try again.",
        visibilityTime: 3000,
        autoHide: true,
      });
    } finally {
      setPdfLoading(false);
    }
  }, [payrollId, pdfLoading]);

  useEffect(() => {
    if (autoDownloadRef.current && payslip) {
      autoDownloadRef.current = false;
      handleDownloadPdf();
    }
  }, [payslip, handleDownloadPdf]);

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>Loading payslip…</Text>
          <View style={styles.skeletonCard} />
          <View style={[styles.skeletonCard, { height: 180 }]} />
          <View style={[styles.skeletonCard, { height: 120 }]} />
        </View>
      </View>
    );
  }

  if (error || !payslip) {
    return (
      <View style={styles.container}>
        <View style={styles.centerBox}>
          <MaterialIcons name="error-outline" size={56} color="#CED4DA" />
          <Text style={styles.errorTitle}>Unable to load payslip.</Text>
          <Text style={styles.errorSubtitle}>{error || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const employee = payslip.employee || ({} as PayslipData["employee"]);
  const empFields: InfoRowProps[] = [
    employee.employeeCode ? { label: "Employee Code", value: String(employee.employeeCode) } : null,
    employee.name ? { label: "Employee Name", value: employee.name } : null,
    employee.designation ? { label: "Designation", value: employee.designation } : null,
    employee.department ? { label: "Department", value: employee.department } : null,
    employee.location ? { label: "Location", value: employee.location } : null,
    employee.bank ? { label: "Bank", value: employee.bank } : null,
    employee.pan ? { label: "PAN", value: employee.pan } : null,
  ].filter(Boolean) as InfoRowProps[];

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.backRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <MaterialIcons name="arrow-back" size={20} color={PRIMARY} />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={[PRIMARY, "rgba(0, 41, 87, 0.85)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.slipHeader}
        >
          <Text style={styles.slipCompany}>RKT ESS</Text>
          <Text style={styles.slipTitle}>Salary Payslip</Text>
          <Text style={styles.slipMonth}>
            {payslip.month} {payslip.year}
          </Text>
          <Text style={styles.slipFY}>Financial Year {payslip.financialYear}</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Employee Details</Text>
          <View style={styles.divider} />
          {empFields.map((f) => (
            <InfoRow key={f.label} label={f.label} value={f.value} />
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Attendance</Text>
          <View style={styles.divider} />
          <InfoRow label="Calendar Days" value={String(payslip.attendance.calendarDays)} />
          <InfoRow label="Payable Days" value={String(payslip.attendance.payableDays)} />
          <InfoRow label="Paid Days" value={String(payslip.attendance.paidDays)} />
          <InfoRow label="LOP Days" value={String(payslip.attendance.lopDays)} />
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: "#155724" }]}>EARNINGS</Text>
          <View style={styles.divider} />
          {payslip.earnings.length > 0 ? (
            payslip.earnings.map((comp: PayrollComponent, idx: number) => (
              <PayrollComponentRow
                key={`${comp.code}-${idx}`}
                component={comp}
                isLast={idx === payslip.earnings.length - 1}
              />
            ))
          ) : (
            <Text style={styles.noDataText}>No earnings available.</Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={[styles.totalValue, { color: "#155724" }]}>
              {formatCurrency(payslip.grossEarnings)}
            </Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: "#C0392B" }]}>DEDUCTIONS</Text>
          <View style={styles.divider} />
          {payslip.deductions.length > 0 ? (
            payslip.deductions.map((comp: PayrollComponent, idx: number) => (
              <PayrollComponentRow
                key={`${comp.code}-${idx}`}
                component={comp}
                isLast={idx === payslip.deductions.length - 1}
              />
            ))
          ) : (
            <Text style={styles.noDataText}>No deductions available.</Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Deductions</Text>
            <Text style={[styles.totalValue, { color: "#C0392B" }]}>
              {formatCurrency(payslip.totalDeductions)}
            </Text>
          </View>
        </View>

        <LinearGradient
          colors={["#155724", "rgba(21, 87, 36, 0.85)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.netCard}
        >
          <Text style={styles.netLabel}>NET SALARY</Text>
          <Text style={styles.netValue}>{formatCurrency(payslip.netSalary)}</Text>
        </LinearGradient>

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
            {pdfLoading ? "Preparing…" : "Download Payslip PDF"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
    backgroundColor: "#EEF3FB",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  backText: {
    fontSize: 14,
    fontWeight: "600",
    color: PRIMARY,
    marginLeft: 4,
  },
  slipHeader: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  slipCompany: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  slipTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },
  slipMonth: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  slipFY: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
  },
  card: {
    backgroundColor: "#FFFFFF",
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
    color: PRIMARY,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  divider: {
    height: 1.5,
    backgroundColor: "#E9ECEF",
    marginBottom: 6,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3F5",
  },
  infoLabel: {
    fontSize: 13,
    color: "#6C757D",
    fontWeight: "500",
    flex: 1,
  },
  infoValue: {
    fontSize: 13,
    color: "#212529",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1.5,
    borderTopColor: "#DEE2E6",
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#343A40",
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
  },
  noDataText: {
    fontSize: 14,
    color: "#6C757D",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  netCard: {
    borderRadius: 16,
    padding: 22,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#155724",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  netLabel: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  netValue: {
    color: "#FFFFFF",
    fontSize: 30,
    fontWeight: "800",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PRIMARY,
    borderRadius: 12,
    paddingVertical: 15,
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
    color: "#6C757D",
    marginBottom: 24,
  },
  skeletonCard: {
    width: "100%",
    height: 120,
    backgroundColor: "#E9ECEF",
    borderRadius: 14,
    marginBottom: 14,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#343A40",
    marginTop: 16,
    marginBottom: 6,
  },
  errorSubtitle: {
    fontSize: 13,
    color: "#6C757D",
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
});

export default PayslipScreen;
