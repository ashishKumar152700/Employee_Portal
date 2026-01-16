// Screen/Timesheet/TimesheetCalendar.tsx

import React, { useCallback, useMemo, useState, useEffect } from "react";
import {
  View,
  Modal,
  Platform,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  StatusBar,
  SafeAreaView
} from "react-native";
import { CalendarList } from "react-native-calendars";
import TimesheetForm from "./Timesheet";
import { KeyboardAvoidingView } from "react-native";
import {
  TimesheetTask,
  TaskHourCount,
  MonthlyTaskSummary,
  getTasksByDate,
  getUserTaskHourCount,
  processHourCountForCalendar,
  clearCache,
  getCacheStats
} from "../../Services/Timesheet/timesheetService";
import { FontAwesome } from "@expo/vector-icons";
import { useSelector, useDispatch } from 'react-redux';
import LottieView from 'lottie-react-native';


const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface MarkedDates {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    marked?: boolean;
    dotColor?: string;
    disabled?: boolean;
  };
}

const TimesheetCalendar: React.FC = () => {
  const today = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [tasksByDate, setTasksByDate] = useState<{ [date: string]: TimesheetTask[] }>({});
  const [hourCountSummary, setHourCountSummary] = useState<{ [date: string]: MonthlyTaskSummary }>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    };
  });

  useEffect(() => {
    initializeCalendar();
  }, []);

  const initializeCalendar = async () => {
    setInitialLoading(true);
    try {
      await loadHourCountData();
    } catch (error) {
      showErrorAlert("Failed to load timesheet data", "Please check your connection and try again.");
    } finally {
      setInitialLoading(false);
    }
  };

  const loadHourCountData = async () => {
    try {
      const hourCounts = await getUserTaskHourCount();
      const summary = processHourCountForCalendar(hourCounts);
      setHourCountSummary(summary);
    } catch (error) {}
  };

  const handleMonthChange = useCallback((month: any) => {
    setCurrentVisibleMonth({
      year: month.year,
      month: month.month,
    });
  }, []);

  const openTimesheetModal = useCallback(
    async (day: { dateString: string }) => {
      if (day.dateString > today) {
        showWarningAlert("Invalid Date", "Cannot select future dates.");
        return;
      }

      setSelectedDate(day.dateString);
      setModalVisible(true);
      setLoading(true);

      try {
        const tasks = await getTasksByDate(day.dateString);
        setTasksByDate((prev) => ({ ...prev, [day.dateString]: tasks }));
      } catch (error) {
        setTasksByDate((prev) => ({ ...prev, [day.dateString]: [] }));
      } finally {
        setLoading(false);
      }
    },
    [today]
  );

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    
    try {
      clearCache();
      await loadHourCountData();

      if (modalVisible && selectedDate) {
        const tasks = await getTasksByDate(selectedDate);
        setTasksByDate((prev) => ({ ...prev, [selectedDate]: tasks }));
      }
    } finally {
      setRefreshing(false);
    }
  }, [modalVisible, selectedDate]);

  const handleTasksUpdated = useCallback(async () => {
    await Promise.all([
      loadHourCountData(),
      selectedDate ? getTasksByDate(selectedDate).then(tasks => 
        setTasksByDate(prev => ({ ...prev, [selectedDate]: tasks }))
      ) : Promise.resolve()
    ]);
  }, [selectedDate]);

  const markedDates: MarkedDates = useMemo(() => {
    const base: MarkedDates = {};

    if (selectedDate) {
      base[selectedDate] = { selected: true, selectedColor: "rgb(0, 41, 87)" };
    }

    Object.keys(hourCountSummary).forEach((date) => {
      const summary = hourCountSummary[date];
      if (summary && summary.hasTimesheet && summary.totalMinutes > 0) {
        const hours = summary.totalMinutes / 60;
        let dotColor = "#EF4444";

        if (hours >= 8) dotColor = "#10B981";
        else if (hours >= 4) dotColor = "#F59E0B";

        base[date] = { ...(base[date] || {}), marked: true, dotColor };
      }
    });

    if (!base[today]?.marked) {
      base[today] = { ...(base[today] || {}), dotColor: "orange" };
    }

    return base;
  }, [selectedDate, hourCountSummary, today]);

  const monthlyTotals = useMemo(() => {
    const monthlyData = Object.values(hourCountSummary).filter(summary => {
      const summaryDate = new Date(summary.date);
      return (
        summaryDate.getFullYear() === currentVisibleMonth.year &&
        summaryDate.getMonth() + 1 === currentVisibleMonth.month
      );
    });

    const totalHours = monthlyData.reduce((sum, day) => sum + (day.totalMinutes / 60), 0);
    const daysLogged = monthlyData.length;
    const totalTasks = monthlyData.reduce((sum, day) => sum + day.taskCount, 0);
    
    return { hours: totalHours, days: daysLogged, tasks: totalTasks };
  }, [hourCountSummary, currentVisibleMonth]);

  const showSuccessAlert = (title: string, message: string) => {
    Alert.alert(`✅ ${title}`, message, [{ text: "OK" }]);
  };

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(`❌ ${title}`, message, [{ text: "OK" }]);
  };

  const showWarningAlert = (title: string, message: string) => {
    Alert.alert(`⚠️ ${title}`, message, [{ text: "OK" }]);
  };

  const LoadingOverlay = ({ message }: { message: string }) => (
    <View style={styles.loadingOverlay}>
      <View style={styles.loadingCard}>
        <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );

  if (initialLoading) {
    return <LoadingOverlay message="Loading Calendar..." />;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerSubtitle}>
            Track your daily work hours • Tap dates to manage tasks
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={refreshData}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size={16} color="white" />
          ) : (
            <FontAwesome name="refresh" size={16} color="white" />
          )}
        </TouchableOpacity>
      </View>

      {/* Calendar */}
      <CalendarList
        horizontal
        pagingEnabled
        scrollEnabled
        markedDates={markedDates}
        onDayPress={openTimesheetModal}
        onMonthChange={handleMonthChange}
        markingType="dot"
        maxDate={today}
        theme={{
          calendarBackground: '#ffffff',
          textSectionTitleColor: 'rgb(0, 41, 87)',
          selectedDayBackgroundColor: 'rgb(0, 41, 87)',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#FF6B35',
          dayTextColor: '#2d4150',
          textDisabledColor: '#9CA3AF',
          dotColor: 'rgb(0, 41, 87)',
          selectedDotColor: '#ffffff',
          arrowColor: 'rgb(0, 41, 87)',
          monthTextColor: 'rgb(0, 41, 87)',
          textDayFontWeight: '600',
          textMonthFontWeight: 'bold',
        }}
        style={styles.calendar}
        calendarHeight={380}
      />

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>8+ hours</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
            <Text style={styles.legendText}>4-8 hours</Text>
          </View>
        </View>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Under 4 hours</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <FontAwesome name="clock-o" size={20} color="rgb(0, 41, 87)" />
          <Text style={styles.summaryValue}>{monthlyTotals.hours.toFixed(1)}h</Text>
          <Text style={styles.summaryLabel}>Month Hours</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCard}>
          <FontAwesome name="calendar-check-o" size={20} color="rgb(0, 41, 87)" />
          <Text style={styles.summaryValue}>{monthlyTotals.days}</Text>
          <Text style={styles.summaryLabel}>Days Logged</Text>
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCard}>
          <FontAwesome name="tasks" size={20} color="rgb(0, 41, 87)" />
          <Text style={styles.summaryValue}>{monthlyTotals.tasks}</Text>
          <Text style={styles.summaryLabel}>Total Tasks</Text>
        </View>
      </View>

      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <LottieView
          source={require("../../assets/animations/workPeople.json")}
          autoPlay
          loop
          style={styles.illustration}
        />
      </View>

      {/* Modal with SafeAreaView for proper header display */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        statusBarTranslucent={false}
      >
        <SafeAreaView style={styles.modalSafeArea}>
          <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
          
          {/* Modal Header - Now clearly visible */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}>
              <FontAwesome name="calendar" size={20} color="white" />
              <View style={styles.modalHeaderTextContainer}>
                <Text style={styles.modalTitle}>
                  {new Date(selectedDate).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </Text>

                {hourCountSummary[selectedDate] && (
                  <Text style={styles.modalSubtitle}>
                    Total: {(hourCountSummary[selectedDate].totalMinutes / 60).toFixed(1)} hours logged
                  </Text>
                )}
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <FontAwesome name="times" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <KeyboardAvoidingView 
            style={styles.modalContent}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            {loading ? (
              <LoadingOverlay message="Loading tasks..." />
            ) : (
              <TimesheetForm
                selectedDate={selectedDate}
                onTasksUpdated={handleTasksUpdated}
                closeModal={() => setModalVisible(false)}
              />
            )}
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>

      {refreshing && (
        <View style={styles.refreshingOverlay}>
          <View style={styles.refreshingCard}>
            <ActivityIndicator size="small" color="rgb(0, 41, 87)" />
            <Text style={styles.refreshingText}>Refreshing...</Text>
          </View>
        </View>
      )}
    </View>
  );
};

/* ------------------------------- STYLES ------------------------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgb(0, 41, 87)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
    marginLeft: 16,
  },
  calendar: {
    height: 360,
  },
  legend: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(0, 41, 87)',
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  illustrationContainer: {
    width: "100%",
    height: 160,
    justifyContent: "center",
    alignItems: "center",
  },
  illustration: {
    width: "90%",
    height: "100%",
  },
  
  // ===== FIXED MODAL STYLES =====
  modalSafeArea: {
    flex: 1,
    backgroundColor: 'rgb(0, 41, 87)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 16 : 12,
    paddingBottom: 16,
    backgroundColor: 'rgb(0, 41, 87)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  modalHeaderTextContainer: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 20,
    padding: 10,
    marginLeft: 12,
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  
  // Loading & Refreshing Overlays
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgb(0, 41, 87)',
    fontWeight: '600',
  },
  refreshingOverlay: {
    position: 'absolute',
    top: 100,
    alignSelf: 'center',
    zIndex: 1000,
  },
  refreshingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    elevation: 8,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  refreshingText: {
    fontSize: 14,
    color: 'rgb(0, 41, 87)',
    fontWeight: '600',
  },
});

export default TimesheetCalendar;