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
  StatusBar
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
  
  // Track the currently visible month on calendar
  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(() => {
    const now = new Date();
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1, // Calendar uses 1-based months
    };
  });

  useEffect(() => {
    console.log("📅 [Calendar] Component mounted, loading hour count data");
    initializeCalendar();
  }, []);

  const initializeCalendar = async () => {
    console.log("📅 [Calendar] ===== INITIALIZING CALENDAR =====");
    setInitialLoading(true);
    try {
      await loadHourCountData();
      console.log("✅ [Calendar] Initialization complete");
    } catch (error) {
      console.error("❌ [Calendar] Initialization failed:", error);
      showErrorAlert("Failed to load timesheet data", "Please check your connection and try again.");
    } finally {
      setInitialLoading(false);
    }
  };

  const loadHourCountData = async () => {
    try {
      console.log("📊 [Calendar] Loading hour count data...");
      const hourCounts = await getUserTaskHourCount();
      const summary = processHourCountForCalendar(hourCounts);
      setHourCountSummary(summary);
      
      console.log("✅ [Calendar] Hour count data loaded:", Object.keys(summary).length, "dates");
      
      // Log cache stats
      const cacheStats = getCacheStats();
      console.log("📋 [Calendar] Cache stats:", cacheStats);
      
    } catch (error) {
      console.error("❌ [Calendar] Error loading hour count data:", error);
    }
  };

  // Handle month change when user swipes calendar
  const handleMonthChange = useCallback((month: any) => {
    console.log("📅 [Calendar] ===== MONTH CHANGED =====");
    console.log("📅 [Calendar] New visible month:", month.year, month.month);
    
    setCurrentVisibleMonth({
      year: month.year,
      month: month.month,
    });
  }, []);

  const openTimesheetModal = useCallback(
    async (day: { dateString: string }) => {
      if (day.dateString > today) {
        console.log("🚫 [Calendar] Cannot select future date:", day.dateString);
        showWarningAlert("Invalid Date", "Cannot select future dates for timesheet entry.");
        return;
      }

      console.log("📅 [Calendar] Opening modal for:", day.dateString);
      setSelectedDate(day.dateString);
      setModalVisible(true);
      setLoading(true);

      try {
        const tasks = await getTasksByDate(day.dateString);
        setTasksByDate((prev) => ({ ...prev, [day.dateString]: tasks }));
      } catch (error) {
        console.error("❌ [Calendar] Error fetching tasks:", error);
        setTasksByDate((prev) => ({ ...prev, [day.dateString]: [] }));
      } finally {
        setLoading(false);
      }
    },
    [today]
  );

  const refreshData = useCallback(async () => {
    console.log("🔁 [Calendar] Refreshing all data");
    setRefreshing(true);
    
    try {
      // Clear cache and reload
      clearCache();
      await loadHourCountData();
      
      // Refresh current date tasks if modal is open
      if (modalVisible && selectedDate) {
        const tasks = await getTasksByDate(selectedDate);
        setTasksByDate((prev) => ({ ...prev, [selectedDate]: tasks }));
      }
      
      showSuccessAlert("Data Refreshed", "Timesheet data has been updated.");
    } catch (error) {
      console.error("❌ [Calendar] Error refreshing data:", error);
      showErrorAlert("Refresh Failed", "Could not refresh data. Please try again.");
    } finally {
      setRefreshing(false);
    }
  }, [modalVisible, selectedDate]);

  const handleTasksUpdated = useCallback(async () => {
    console.log("🔁 [Calendar] Tasks updated, refreshing data");
    await Promise.all([
      loadHourCountData(), // Refresh calendar dots
      selectedDate ? getTasksByDate(selectedDate).then(tasks => 
        setTasksByDate(prev => ({ ...prev, [selectedDate]: tasks }))
      ) : Promise.resolve()
    ]);
  }, [selectedDate]);

  // Build marked dates using hour count data
  const markedDates: MarkedDates = useMemo(() => {
    console.log("📅 [Calendar] Building marked dates from hour count data");
    
    const base: MarkedDates = {};
    
    // Mark selected date
    if (selectedDate) {
      base[selectedDate] = { 
        selected: true, 
        selectedColor: "rgb(0, 41, 87)" 
      };
    }

    // Mark dates with tasks using hour count data
    let markedDatesCount = 0;
    Object.keys(hourCountSummary).forEach((date) => {
      const summary = hourCountSummary[date];
      if (summary && summary.hasTimesheet && summary.totalMinutes > 0) {
        const hours = summary.totalMinutes / 60;
        let dotColor = "#EF4444"; // Red for < 4 hours
        
        if (hours >= 8) {
          dotColor = "#10B981"; // Green for 8+ hours
        } else if (hours >= 4) {
          dotColor = "#F59E0B"; // Yellow for 4-8 hours
        }
        
        base[date] = { 
          ...(base[date] || {}), 
          marked: true, 
          dotColor: dotColor,
        };
        
        markedDatesCount++;
      }
    });
    
    console.log("📅 [Calendar] Total marked dates:", markedDatesCount);

    // Mark today with orange dot if no tasks
    if (!base[today]?.marked) {
      base[today] = { 
        ...(base[today] || {}), 
        dotColor: "orange" 
      };
    }

    return base;
  }, [selectedDate, hourCountSummary, today]);

  // Calculate totals for the currently visible month
  const monthlyTotals = useMemo(() => {
    console.log("📊 [Calendar] Calculating totals for visible month:", currentVisibleMonth.year, currentVisibleMonth.month);
    
    // Filter data for the currently visible month
    const monthlyData = Object.values(hourCountSummary).filter(summary => {
      const summaryDate = new Date(summary.date);
      const summaryYear = summaryDate.getFullYear();
      const summaryMonth = summaryDate.getMonth() + 1; // Convert to 1-based
      
      return summaryYear === currentVisibleMonth.year && 
             summaryMonth === currentVisibleMonth.month;
    });
    
    const totalHours = monthlyData.reduce((sum, day) => sum + (day.totalMinutes / 60), 0);
    const daysLogged = monthlyData.length;
    const totalTasks = monthlyData.reduce((sum, day) => sum + day.taskCount, 0);
    
    console.log(`📊 [Calendar] Month ${currentVisibleMonth.month}/${currentVisibleMonth.year} totals:`, {
      hours: totalHours.toFixed(1),
      days: daysLogged,
      tasks: totalTasks,
      dataPoints: monthlyData.length
    });
    
    return { hours: totalHours, days: daysLogged, tasks: totalTasks };
  }, [hourCountSummary, currentVisibleMonth]);

  // Professional Alert Functions
  const showSuccessAlert = (title: string, message: string) => {
    Alert.alert(
      `✅ ${title}`,
      message,
      [{ text: "OK", style: "default" }],
      { cancelable: true }
    );
  };

  const showErrorAlert = (title: string, message: string) => {
    Alert.alert(
      `❌ ${title}`,
      message,
      [{ text: "OK", style: "default" }],
      { cancelable: true }
    );
  };

  const showWarningAlert = (title: string, message: string) => {
    Alert.alert(
      `⚠️ ${title}`,
      message,
      [{ text: "OK", style: "default" }],
      { cancelable: true }
    );
  };

  // Professional Loading Component
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
      
      {/* Enhanced Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Timesheet Calendar</Text>
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

      {/* Scrollable Calendar with month change handler */}
      <CalendarList
        horizontal={true}
        pagingEnabled={true}
        scrollEnabled={true}
        showScrollIndicator={false}
        markedDates={markedDates}
        onDayPress={openTimesheetModal}
        onMonthChange={handleMonthChange} // Add this handler
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
          textDayFontFamily: 'System',
          textMonthFontFamily: 'System',
          textDayHeaderFontFamily: 'System',
          textDayFontWeight: '600',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '600',
          textDayFontSize: 16,
          textMonthFontSize: 20,
          textDayHeaderFontSize: 14,
        }}
        style={styles.calendar}
        calendarHeight={380}
      />

      {/* Enhanced Legend */}
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
            <Text style={styles.legendText}> 4 hours</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Summary Cards - Now shows visible month data */}
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

      {/* Enhanced Modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderContent}>
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
                  {(hourCountSummary[selectedDate].totalMinutes / 60).toFixed(1)} hours logged
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
            >
              <FontAwesome name="times" size={20} color="white" />
            </TouchableOpacity>
          </View>

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
    paddingVertical: 20,
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  refreshButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 12,
    marginLeft: 16,
  },
  calendar: {
    height: 380,
    marginTop: 10,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
    gap: 4,
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
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: 'rgb(0, 41, 87)',
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  closeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 10,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 200,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    gap: 10,
  },
  refreshingText: {
    fontSize: 14,
    color: 'rgb(0, 41, 87)',
    fontWeight: '600',
  },
});

export default TimesheetCalendar;

