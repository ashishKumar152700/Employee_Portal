import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { LinearGradient } from "expo-linear-gradient";
import RNPickerSelect from "react-native-picker-select";
import { MaterialIcons } from "@expo/vector-icons";
import {
  getEmployeePayrollHistory,
  getPayrollEmployeeId,
} from "../../Services/Payroll/payroll.service";
import { PayrollHistoryItem } from "../../types/payroll.types";
import PayrollSummaryCard from "../../Component/payroll/PayrollSummaryCard";
import PayrollStatusBadge from "../../Component/payroll/PayrollStatusBadge";
import { themedStyles, C } from "../../Global/ThemeContext";

const PRIMARY = "rgb(0, 41, 87)";

const formatCurrency = (value: number) =>
  `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function getCurrentFinancialYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

function buildFinancialYearOptions(): { label: string; value: string }[] {
  const current = getCurrentFinancialYear();
  const startYear = parseInt(current.split("-")[0], 10);
  const options: { label: string; value: string }[] = [];
  for (let i = 0; i < 5; i++) {
    const y = startYear - i;
    options.push({ label: `${y}-${String(y + 1).slice(2)}`, value: `${y}-${String(y + 1).slice(2)}` });
  }
  return options;
}

const PayrollScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const userDetails = useSelector((state: any) => state.userDetails);
  const userId: number | undefined = userDetails?.user?.id;
  const employeeCode: string | undefined =
    userDetails?.user?.employeecode !== undefined &&
    userDetails?.user?.employeecode !== null
      ? String(userDetails.user.employeecode)
      : undefined;

  const [history, setHistory] = useState<PayrollHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFY, setSelectedFY] = useState<string>(getCurrentFinancialYear());

  const fyOptions = buildFinancialYearOptions();

  const fetchHistory = useCallback(async () => {
    try {
      setError(null);

      const payrollEmployeeId = await getPayrollEmployeeId();
      if (!payrollEmployeeId) {
        throw new Error("Unable to identify your employee record.");
      }

      console.log("[Payroll] Loading payroll history", {
        userId,
        payrollEmployeeId,
        employeeCode,
      });

      const data = await getEmployeePayrollHistory(payrollEmployeeId);
      setHistory(data);
    } catch (err: any) {
      setError(err.message || "Unable to load payroll.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, employeeCode]);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHistory();
  }, [fetchHistory]);

  const filteredHistory = history
    .filter((item) => item.financialYear === selectedFY)
    .sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      const months = [
        "January","February","March","April","May","June",
        "July","August","September","October","November","December",
      ];
      return months.indexOf(b.month) - months.indexOf(a.month);
    });

  const latestPayroll = filteredHistory[0];

  const openDetail = (payrollId: number) => {
    navigation.navigate("PayrollDetail", { payrollId });
  };

  const openTaxReport = () => {
    navigation.navigate("TaxReport");
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <HeaderSection onTaxPress={openTaxReport} />
        <View style={styles.loadingContainer}>
          <View style={styles.skeletonCard}>
            <ActivityIndicator size="large" color={C.accent} />
            <Text style={styles.loadingText}>Loading payroll…</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <HeaderSection onTaxPress={openTaxReport} />
        <View style={styles.errorContainer}>
          <MaterialIcons name="cloud-off" size={56} color={C.textFaint} />
          <Text style={styles.errorTitle}>Unable to load payroll.</Text>
          <Text style={styles.errorSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchHistory}>
            <MaterialIcons name="refresh" size={18} color="#fff" />
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <HeaderSection onTaxPress={openTaxReport} />

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => String(item.payrollId)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} />
        }
        ListHeaderComponent={
          <View>
            {latestPayroll && (
              <View style={styles.latestWrapper}>
                <PayrollSummaryCard
                  item={latestPayroll}
                  onPress={() => openDetail(latestPayroll.payrollId)}
                />
              </View>
            )}

            <Text style={styles.sectionLabel}>Financial Year</Text>
            <View style={styles.pickerWrapper}>
              <RNPickerSelect
                onValueChange={(value) => value && setSelectedFY(value)}
                items={fyOptions}
                value={selectedFY}
                style={{
                  inputIOS: styles.pickerInputIOS,
                  inputAndroid: styles.pickerInputAndroid,
                  iconContainer: styles.pickerIcon,
                }}
                Icon={() => (
                  <MaterialIcons name="keyboard-arrow-down" size={22} color={C.accent} />
                )}
              />
            </View>

            <Text style={styles.sectionLabel}>Payroll History</Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={56} color={C.textFaint} />
            <Text style={styles.emptyTitle}>No Payroll Available</Text>
            <Text style={styles.emptySubtitle}>
              There is no payroll record available for the selected financial year.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.historyCard}
            activeOpacity={0.7}
            onPress={() => openDetail(item.payrollId)}
          >
            <View style={styles.historyHeader}>
              <Text style={styles.historyMonth}>
                {item.month} {item.year}
              </Text>
              <PayrollStatusBadge status={item.status} />
            </View>

            <View style={styles.historyRow}>
              <View style={styles.historyStat}>
                <Text style={styles.historyStatLabel}>Net Salary</Text>
                <Text style={styles.historyNetValue}>{formatCurrency(item.netSalary)}</Text>
              </View>
            </View>

            <View style={styles.historySubRow}>
              <View style={styles.historySubStat}>
                <Text style={styles.historySubLabel}>Gross</Text>
                <Text style={styles.historySubValue}>{formatCurrency(item.grossSalary)}</Text>
              </View>
              <View style={styles.historySubStat}>
                <Text style={styles.historySubLabel}>Deductions</Text>
                <Text style={styles.historySubValue}>{formatCurrency(item.totalDeductions)}</Text>
              </View>
            </View>

            <View style={styles.viewDetailsRow}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <MaterialIcons name="chevron-right" size={18} color={C.accent} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const HeaderSection: React.FC<{ onTaxPress: () => void }> = ({ onTaxPress }) => (
  <LinearGradient
    colors={[PRIMARY, "rgba(0, 41, 87, 0.85)"]}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 1 }}
    style={styles.header}
  >
    <View style={styles.headerContent}>
      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>Payroll</Text>
        <Text style={styles.headerSubtitle}>Your salary & payroll history</Text>
      </View>
      <TouchableOpacity style={styles.taxButton} onPress={onTaxPress} activeOpacity={0.7}>
        <MaterialIcons name="account-balance" size={18} color="#fff" />
        <Text style={styles.taxButtonText}>Tax Report</Text>
      </TouchableOpacity>
    </View>
  </LinearGradient>
);

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  header: {
    paddingTop: 18,
    paddingBottom: 22,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTextWrap: {
    flex: 1,
    marginRight: 10,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  headerSubtitle: {
    color: "rgba(255,255,255,0.75)",
    fontSize: 13,
    fontWeight: "400",
  },
  taxButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  taxButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  latestWrapper: {
    marginTop: 16,
    marginBottom: 4,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
    marginTop: 18,
    marginBottom: 10,
  },
  pickerWrapper: {
    backgroundColor: c.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pickerInputIOS: {
    fontSize: 15,
    fontWeight: "600",
    color: c.accent,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerInputAndroid: {
    fontSize: 15,
    fontWeight: "600",
    color: c.accent,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  pickerIcon: {
    top: 14,
    right: 12,
  },
  historyCard: {
    backgroundColor: c.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  historyMonth: {
    fontSize: 16,
    fontWeight: "700",
    color: c.text,
    flex: 1,
    marginRight: 8,
  },
  historyRow: {
    marginBottom: 10,
  },
  historyStat: {},
  historyStatLabel: {
    fontSize: 12,
    color: c.textSoft,
    fontWeight: "500",
    marginBottom: 2,
  },
  historyNetValue: {
    fontSize: 22,
    fontWeight: "800",
    color: c.accent,
  },
  historySubRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: c.border,
    paddingTop: 10,
    marginBottom: 8,
  },
  historySubStat: {
    flex: 1,
  },
  historySubLabel: {
    fontSize: 11,
    color: c.textFaint,
    fontWeight: "500",
    marginBottom: 2,
  },
  historySubValue: {
    fontSize: 14,
    fontWeight: "600",
    color: c.textSoft,
  },
  viewDetailsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primaryFaint,
    borderRadius: 8,
    paddingVertical: 9,
  },
  viewDetailsText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.accent,
    marginRight: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  skeletonCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 40,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: c.textSoft,
    fontWeight: "500",
  },
  errorContainer: {
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
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: c.textSoft,
    marginTop: 14,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: c.textFaint,
    textAlign: "center",
    lineHeight: 20,
  },
}));

export default PayrollScreen;
