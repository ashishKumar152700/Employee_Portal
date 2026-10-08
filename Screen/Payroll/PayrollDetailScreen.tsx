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
import { useRoute, useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getPayrollDetail,
  getPayrollTaxDetail,
} from "../../Services/Payroll/payroll.service";
import { PayrollDetail, PayrollTaxDetail, PayrollComponent } from "../../types/payroll.types";
import PayrollStatusBadge from "../../Component/payroll/PayrollStatusBadge";
import AttendanceSummary from "../../Component/payroll/AttendanceSummary";
import TaxSummaryCard from "../../Component/payroll/TaxSummaryCard";
import PayrollComponentRow from "../../Component/payroll/PayrollComponentRow";
import { themedStyles, C } from "../../Global/ThemeContext";

const PRIMARY = "rgb(0, 41, 87)";

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const PayrollDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { payrollId } = route.params || {};

  const [detail, setDetail] = useState<PayrollDetail | null>(null);
  const [taxDetail, setTaxDetail] = useState<PayrollTaxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!payrollId) {
      setError("Payroll record was not found.");
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const data = await getPayrollDetail(payrollId);
      setDetail(data);

      try {
        const tax = await getPayrollTaxDetail(payrollId);
        setTaxDetail(tax);
      } catch {
        setTaxDetail(null);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load payroll details.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [payrollId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const earnings: PayrollComponent[] = (detail?.components || []).filter(
    (c) => c.category === "earning"
  );
  const deductions: PayrollComponent[] = (detail?.components || []).filter(
    (c) => c.category === "deduction"
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color={C.accent} />
          <Text style={styles.loadingText}>Loading payroll details…</Text>

          <View style={styles.skeletonCard} />
          <View style={[styles.skeletonCard, { height: 80 }]} />
          <View style={[styles.skeletonCard, { height: 140 }]} />
        </View>
      </View>
    );
  }

  if (error || !detail) {
    return (
      <View style={styles.container}>
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={56} color={C.textFaint} />
          <Text style={styles.errorTitle}>Unable to load payroll.</Text>
          <Text style={styles.errorSubtitle}>{error || "Something went wrong."}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
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

        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Payroll Details</Text>
          <Text style={styles.pageSubtitle}>
            {detail.month} {detail.year} · Financial Year {detail.financialYear}
          </Text>
          <View style={styles.badgeRow}>
            <PayrollStatusBadge status={detail.status} />
          </View>
        </View>

        <LinearGradient
          colors={[PRIMARY, "rgba(0, 41, 87, 0.85)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>Net Salary</Text>
          <Text style={styles.summaryNet}>{formatCurrency(detail.netSalary)}</Text>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Gross Earnings</Text>
              <Text style={styles.summaryStatValue}>
                {formatCurrency(detail.grossSalary)}
              </Text>
            </View>
            <View style={styles.summaryStat}>
              <Text style={styles.summaryStatLabel}>Total Deductions</Text>
              <Text style={styles.summaryStatValue}>
                {formatCurrency(detail.totalDeductions)}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <Text style={styles.sectionTitle}>Attendance</Text>
        <View style={styles.sectionCard}>
          <AttendanceSummary attendance={detail.attendance} />
        </View>

        <Text style={styles.sectionTitle}>Earnings</Text>
        <View style={styles.sectionCard}>
          {earnings.length > 0 ? (
            earnings.map((comp, index) => (
              <PayrollComponentRow
                key={`${comp.code}-${index}`}
                component={comp}
                isLast={index === earnings.length - 1}
              />
            ))
          ) : (
            <Text style={styles.noDataText}>No earnings data available.</Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalValue}>{formatCurrency(detail.grossSalary)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Deductions</Text>
        <View style={styles.sectionCard}>
          {deductions.length > 0 ? (
            deductions.map((comp, index) => (
              <PayrollComponentRow
                key={`${comp.code}-${index}`}
                component={comp}
                isLast={index === deductions.length - 1}
              />
            ))
          ) : (
            <Text style={styles.noDataText}>No deductions data available.</Text>
          )}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Deductions</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(detail.totalDeductions)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Tax Details</Text>
        {taxDetail ? (
          <TaxSummaryCard tax={taxDetail} />
        ) : (
          <View style={styles.sectionCard}>
            <Text style={styles.noDataText}>
              Tax information is not available for this payroll.
            </Text>
          </View>
        )}

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("Payslip", { payrollId: detail.payrollId })
            }
          >
            <LinearGradient
              colors={[PRIMARY, "rgba(0, 41, 87, 0.85)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryButtonGradient}
            >
              <MaterialIcons name="description" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>View Payslip</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("Payslip", {
                payrollId: detail.payrollId,
                autoDownloadPdf: true,
              })
            }
          >
            <MaterialIcons name="file-download" size={18} color={C.accent} />
            <Text style={styles.secondaryButtonText}>Download Payslip PDF</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  backRow: {
    marginBottom: 10,
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
  pageHeader: {
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: c.text,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: c.textSoft,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: "row",
  },
  summaryCard: {
    borderRadius: 16,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
    marginBottom: 20,
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 4,
  },
  summaryNet: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "800",
    marginBottom: 16,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryStat: {
    flex: 1,
  },
  summaryStatLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 3,
  },
  summaryStatValue: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
    marginBottom: 10,
    marginTop: 6,
  },
  sectionCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1.5,
    borderTopColor: c.border,
    paddingTop: 12,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: c.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: c.accent,
  },
  noDataText: {
    fontSize: 14,
    color: c.textSoft,
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 10,
  },
  actionsContainer: {
    marginTop: 8,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  primaryButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surface,
    borderWidth: 1.5,
    borderColor: c.accent,
    borderRadius: 12,
    paddingVertical: 14,
  },
  secondaryButtonText: {
    color: c.accent,
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 16,
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
  errorBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
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

export default PayrollDetailScreen;
