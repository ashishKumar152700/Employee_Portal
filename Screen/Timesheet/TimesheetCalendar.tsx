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

  // Calculate totals from hour count data
  const monthlyTotals = useMemo(() => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    const monthlyData = Object.values(hourCountSummary).filter(summary => {
      const summaryDate = new Date(summary.date);
      return summaryDate.getMonth() === currentMonth && summaryDate.getFullYear() === currentYear;
    });
    
    const totalHours = monthlyData.reduce((sum, day) => sum + (day.totalMinutes / 60), 0);
    const daysLogged = monthlyData.length;
    const totalTasks = monthlyData.reduce((sum, day) => sum + day.taskCount, 0);
    
    return { hours: totalHours, days: daysLogged, tasks: totalTasks };
  }, [hourCountSummary]);

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

      {/* Scrollable Calendar */}
      <CalendarList
        horizontal={true}
        pagingEnabled={true}
        scrollEnabled={true}
        showScrollIndicator={false}
        markedDates={markedDates}
        onDayPress={openTimesheetModal}
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
            <Text style={styles.legendText}>4 hours</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
            <Text style={styles.legendText}>Today</Text>
          </View>
        </View>
      </View>

      {/* Enhanced Summary Cards */}
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


// import React, { useCallback, useMemo, useState, useEffect } from "react";
// import { 
//   View, 
//   Modal, 
//   Platform, 
//   ActivityIndicator, 
//   Text, 
//   TouchableOpacity,
//   StyleSheet,
//   Dimensions,
//   Alert,
//   StatusBar 
// } from "react-native";
// import { CalendarList } from "react-native-calendars";
// import TimesheetForm from "./Timesheet";
// import { KeyboardAvoidingView } from "react-native";
// import { 
//   TimesheetTask, 
//   MonthlyTaskSummary,
//   getTasksByDate, 
//   getAllTasksForMonth,
//   processMonthlyTaskSummary 
// } from "../../Services/Timesheet/timesheetService";
// import { FontAwesome } from "@expo/vector-icons";

// const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// interface MarkedDates {
//   [date: string]: {
//     selected?: boolean;
//     selectedColor?: string;
//     marked?: boolean;
//     dotColor?: string;
//     disabled?: boolean;
//   };
// }

// const TimesheetCalendar: React.FC = () => {
//   const today = new Date().toISOString().split("T")[0];
//   const [selectedDate, setSelectedDate] = useState<string>(today);
//   const [modalVisible, setModalVisible] = useState(false);
//   const [tasksByDate, setTasksByDate] = useState<{ [date: string]: TimesheetTask[] }>({});
//   const [monthlySummary, setMonthlySummary] = useState<{ [date: string]: MonthlyTaskSummary }>({});
//   const [loading, setLoading] = useState(false);
//   const [initialLoading, setInitialLoading] = useState(true);
//   const [monthlyTasks, setMonthlyTasks] = useState<TimesheetTask[]>([]);
//   const [currentMonth, setCurrentMonth] = useState(new Date());

//   useEffect(() => {
//     console.log("📅 [Calendar] ===== COMPONENT MOUNTED =====");
//     console.log("📅 [Calendar] Today's date:", today);
//     console.log("📅 [Calendar] Current month:", currentMonth.toISOString());
//     initializeCalendar();
//   }, []);

//   const initializeCalendar = async () => {
//     console.log("📅 [Calendar] ===== INITIALIZING CALENDAR =====");
//     setInitialLoading(true);
//     try {
//       await loadMonthlyTasks(currentMonth);
//       console.log("✅ [Calendar] Initialization complete");
//     } catch (error) {
//       console.error("❌ [Calendar] Initialization failed:", error);
//     } finally {
//       setInitialLoading(false);
//     }
//   };

//   const loadMonthlyTasks = async (date: Date) => {
//     const year = date.getFullYear();
//     const month = date.getMonth() + 1;
    
//     console.log("📅 [Calendar] ===== LOADING MONTHLY TASKS =====");
//     console.log("📅 [Calendar] Loading for Year:", year, "Month:", month);
    
//     try {
//       const tasks = await getAllTasksForMonth(year, month);
//       console.log("📅 [Calendar] Raw tasks received:", tasks.length);
      
//       setMonthlyTasks(tasks);
      
//       // Process tasks into summary for calendar marking
//       const summary = processMonthlyTaskSummary(tasks);
//       setMonthlySummary(summary);
//       console.log("📅 [Calendar] Monthly summary created for", Object.keys(summary).length, "dates");
      
//       // Group tasks by date for detailed view
//       const groupedTasks: { [date: string]: TimesheetTask[] } = {};
//       tasks.forEach(task => {
//         const taskDate = task.taskDate.split('T')[0];
//         if (!groupedTasks[taskDate]) {
//           groupedTasks[taskDate] = [];
//         }
//         groupedTasks[taskDate].push(task);
//       });
      
//       setTasksByDate(prev => ({ ...prev, ...groupedTasks }));
//       console.log("✅ [Calendar] Tasks grouped by date for", Object.keys(groupedTasks).length, "dates");
      
//       // Log detailed breakdown
//       Object.keys(groupedTasks).forEach(date => {
//         const dayTasks = groupedTasks[date];
//         const totalMinutes = dayTasks.reduce((sum, task) => sum + (task.minutes || 0), 0);
//         console.log(`📅 [Calendar] Date ${date}: ${dayTasks.length} tasks, ${totalMinutes} minutes (${(totalMinutes/60).toFixed(1)}h)`);
//       });
      
//     } catch (error) {
//       console.error("❌ [Calendar] Error loading monthly tasks:", error);
//     }
//   };

//   const openTimesheetModal = useCallback(
//     async (day: { dateString: string }) => {
//       if (day.dateString > today) {
//         console.log("🚫 [Calendar] Cannot select future date:", day.dateString);
//         Alert.alert("Invalid Date", "Cannot select future dates for timesheet entry.");
//         return;
//       }

//       console.log("📅 [Calendar] ===== OPENING MODAL =====");
//       console.log("📅 [Calendar] Selected date:", day.dateString);
      
//       setSelectedDate(day.dateString);
//       setModalVisible(true);
//       setLoading(true);

//       try {
//         // Check if we already have tasks for this date
//         const existingTasks = tasksByDate[day.dateString];
//         if (existingTasks && existingTasks.length > 0) {
//           console.log("📅 [Calendar] Using cached tasks:", existingTasks.length);
//           setLoading(false);
//           return;
//         }
        
//         // Fetch fresh tasks for selected date
//         const tasks = await getTasksByDate(day.dateString);
//         console.log("✅ [Calendar] Fresh tasks fetched for date:", tasks.length);
//         setTasksByDate((prev) => ({ ...prev, [day.dateString]: tasks }));
//       } catch (error) {
//         console.error("❌ [Calendar] Error fetching tasks:", error);
//         setTasksByDate((prev) => ({ ...prev, [day.dateString]: [] }));
//       } finally {
//         setLoading(false);
//       }
//     },
//     [today, tasksByDate]
//   );

//   const refreshDateTasks = useCallback(async () => {
//     if (!selectedDate) return;
//     console.log("🔁 [Calendar] ===== REFRESHING TASKS =====");
//     console.log("🔁 [Calendar] Refreshing for date:", selectedDate);
    
//     try {
//       const tasks = await getTasksByDate(selectedDate);
//       setTasksByDate((prev) => ({ ...prev, [selectedDate]: tasks }));
      
//       // Also refresh the current month to update calendar markers
//       await loadMonthlyTasks(currentMonth);
//     } catch (error) {
//       console.error("❌ [Calendar] Error refreshing tasks:", error);
//     }
//   }, [selectedDate, currentMonth]);

//   const handleMonthChange = (month: any) => {
//     console.log("📅 [Calendar] ===== MONTH CHANGED =====");
//     console.log("📅 [Calendar] New month:", month.year, month.month);
    
//     const newDate = new Date(month.year, month.month - 1);
//     setCurrentMonth(newDate);
//     loadMonthlyTasks(newDate);
//   };

//   const getTaskHoursForDate = (date: string): number => {
//     const summary = monthlySummary[date];
//     if (summary) {
//       return summary.totalMinutes / 60;
//     }
    
//     // Fallback to direct calculation
//     const dateTasks = tasksByDate[date] || [];
//     return dateTasks.reduce((total, task) => total + (task.minutes / 60), 0);
//   };

//   // Build marked dates with enhanced task information
//   const markedDates: MarkedDates = useMemo(() => {
//     console.log("📅 [Calendar] ===== BUILDING MARKED DATES =====");
    
//     const base: MarkedDates = {};
    
//     // Mark selected date
//     if (selectedDate) {
//       base[selectedDate] = { 
//         selected: true, 
//         selectedColor: "rgb(0, 41, 87)" 
//       };
//       console.log("📅 [Calendar] Marked selected date:", selectedDate);
//     }

//     // Mark dates with tasks using summary data
//     let markedDatesCount = 0;
//     Object.keys(monthlySummary).forEach((date) => {
//       const summary = monthlySummary[date];
//       if (summary && summary.hasTimesheet) {
//         const hours = summary.totalMinutes / 60;
//         let dotColor = "#EF4444"; // Red for < 4 hours
        
//         if (hours >= 8) {
//           dotColor = "#10B981"; // Green for 8+ hours
//         } else if (hours >= 4) {
//           dotColor = "#F59E0B"; // Yellow for 4-8 hours
//         }
        
//         base[date] = { 
//           ...(base[date] || {}), 
//           marked: true, 
//           dotColor: dotColor,
//         };
        
//         markedDatesCount++;
//         console.log(`📅 [Calendar] Marked date ${date}: ${hours.toFixed(1)}h, color: ${dotColor}`);
//       }
//     });
    
//     console.log("📅 [Calendar] Total marked dates:", markedDatesCount);

//     // Mark today with orange dot
//     base[today] = { 
//       ...(base[today] || {}), 
//       dotColor: "orange" 
//     };
//     console.log("📅 [Calendar] Marked today:", today);

//     // Disable future dates
//     const futureDate = new Date();
//     let disabledCount = 0;
//     for (let i = 1; i <= 365; i++) {
//       const nextDate = new Date(futureDate);
//       nextDate.setDate(futureDate.getDate() + i);
//       const futureDateString = nextDate.toISOString().split("T")[0];
//       if (futureDateString > today) {
//         base[futureDateString] = { 
//           disabled: true,
//         };
//         disabledCount++;
//       }
//     }
    
//     console.log("📅 [Calendar] Disabled future dates count:", disabledCount);
//     console.log("📅 [Calendar] Total base object keys:", Object.keys(base).length);

//     return base;
//   }, [selectedDate, monthlySummary, today]);

//   // Calculate monthly totals
//   const monthlyTotals = useMemo(() => {
//     const totalHours = Object.values(monthlySummary)
//       .reduce((sum, day) => sum + (day.totalMinutes / 60), 0);
//     const daysLogged = Object.keys(monthlySummary).length;
//     const totalTasks = Object.values(monthlySummary)
//       .reduce((sum, day) => sum + day.taskCount, 0);
    
//     console.log("📊 [Calendar] Monthly totals - Hours:", totalHours.toFixed(1), "Days:", daysLogged, "Tasks:", totalTasks);
    
//     return {
//       hours: totalHours,
//       days: daysLogged,
//       tasks: totalTasks
//     };
//   }, [monthlySummary]);

//   if (initialLoading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
//         <Text style={styles.loadingText}>Loading Calendar...</Text>
//         <Text style={styles.loadingSubText}>Fetching timesheet data...</Text>
//       </View>
//     );
//   }

//   return (
//     <View style={styles.container}>
//       <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      
//       {/* Calendar Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Timesheet Calendar</Text>
//         <Text style={styles.headerSubtitle}>
//           Tap any date to add/view tasks • Dots show hours logged
//         </Text>
//       </View>

//       {/* Scrollable Calendar */}
//       <CalendarList
//         horizontal={true}
//         pagingEnabled={true}
//         scrollEnabled={true}
//         showScrollIndicator={false}
//         markedDates={markedDates}
//         onDayPress={openTimesheetModal}
//         onMonthChange={handleMonthChange}
//         markingType="dot"
//         maxDate={today}
//         theme={{
//           calendarBackground: '#ffffff',
//           textSectionTitleColor: 'rgb(0, 41, 87)',
//           selectedDayBackgroundColor: 'rgb(0, 41, 87)',
//           selectedDayTextColor: '#ffffff',
//           todayTextColor: '#FF6B35',
//           dayTextColor: '#2d4150',
//           textDisabledColor: '#9CA3AF',
//           dotColor: 'rgb(0, 41, 87)',
//           selectedDotColor: '#ffffff',
//           arrowColor: 'rgb(0, 41, 87)',
//           monthTextColor: 'rgb(0, 41, 87)',
//           textDayFontFamily: 'System',
//           textMonthFontFamily: 'System',
//           textDayHeaderFontFamily: 'System',
//           textDayFontWeight: '500',
//           textMonthFontWeight: 'bold',
//           textDayHeaderFontWeight: '600',
//           textDayFontSize: 16,
//           textMonthFontSize: 18,
//           textDayHeaderFontSize: 14,
//         }}
//         style={styles.calendar}
//         calendarHeight={350}
//       />

//       {/* Legend */}
//       <View style={styles.legend}>
//         <View style={styles.legendItem}>
//           <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
//           <Text style={styles.legendText}>8+ hours</Text>
//         </View>
//         <View style={styles.legendItem}>
//           <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
//           <Text style={styles.legendText}>4-8 hours</Text>
//         </View>
//         <View style={styles.legendItem}>
//           <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
//           <Text style={styles.legendText}> 4 hours</Text>
//         </View>
//         <View style={styles.legendItem}>
//           <View style={[styles.legendDot, { backgroundColor: 'orange' }]} />
//           <Text style={styles.legendText}>Today</Text>
//         </View>
//       </View>

//       {/* Enhanced Summary Bar */}
//       <View style={styles.summaryBar}>
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Month Hours</Text>
//           <Text style={styles.summaryValue}>{monthlyTotals.hours.toFixed(1)}h</Text>
//         </View>
//         <View style={styles.summaryDivider} />
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Days Logged</Text>
//           <Text style={styles.summaryValue}>{monthlyTotals.days}</Text>
//         </View>
//         <View style={styles.summaryDivider} />
//         <View style={styles.summaryItem}>
//           <Text style={styles.summaryLabel}>Total Tasks</Text>
//           <Text style={styles.summaryValue}>{monthlyTotals.tasks}</Text>
//         </View>
//       </View>

//       {/* Modal for timesheet form */}
//       <Modal
//         animationType="slide"
//         transparent={false}
//         visible={modalVisible}
//         onRequestClose={() => setModalVisible(false)}
//       >
//         <KeyboardAvoidingView 
//           style={styles.modalContainer}
//           behavior={Platform.OS === "ios" ? "padding" : "height"}
//         >
//           <View style={styles.modalHeader}>
//             <View style={styles.modalHeaderLeft}>
//               <Text style={styles.modalTitle}>
//                 {new Date(selectedDate).toLocaleDateString('en-US', {
//                   weekday: 'short',
//                   month: 'short', 
//                   day: 'numeric',
//                   year: 'numeric'
//                 })}
//               </Text>
//               {monthlySummary[selectedDate] && (
//                 <Text style={styles.modalSubtitle}>
//                   {(monthlySummary[selectedDate].totalMinutes / 60).toFixed(1)}h logged
//                 </Text>
//               )}
//             </View>
//             <TouchableOpacity
//               onPress={() => {
//                 console.log("❌ [Calendar] Closing modal for:", selectedDate);
//                 setModalVisible(false);
//               }}
//               style={styles.closeButton}
//             >
//               <FontAwesome name="times" size={24} color="#EF4444" />
//             </TouchableOpacity>
//           </View>

//           {loading ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
//               <Text style={styles.loadingText}>Loading tasks...</Text>
//             </View>
//           ) : (
//             <TimesheetForm
//               selectedDate={selectedDate}
//               onTasksUpdated={refreshDateTasks}
//               closeModal={() => setModalVisible(false)}
//             />
//           )}
//         </KeyboardAvoidingView>
//       </Modal>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   header: {
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     backgroundColor: '#ffffff',
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   headerTitle: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: 'rgb(0, 41, 87)',
//     marginBottom: 4,
//   },
//   headerSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//   },
//   calendar: {
//     height: 350,
//   },
//   legend: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     backgroundColor: '#ffffff',
//     borderTopWidth: 1,
//     borderTopColor: '#e5e7eb',
//     gap: 15,
//   },
//   legendItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 4,
//   },
//   legendDot: {
//     width: 10,
//     height: 10,
//     borderRadius: 5,
//   },
//   legendText: {
//     fontSize: 11,
//     color: '#6B7280',
//   },
//   summaryBar: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 20,
//     backgroundColor: 'rgb(0, 41, 87)',
//   },
//   summaryItem: {
//     alignItems: 'center',
//     flex: 1,
//   },
//   summaryLabel: {
//     color: '#ffffff',
//     fontSize: 12,
//     opacity: 0.8,
//     marginBottom: 4,
//   },
//   summaryValue: {
//     color: '#ffffff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   summaryDivider: {
//     width: 1,
//     height: 30,
//     backgroundColor: 'rgba(255, 255, 255, 0.2)',
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//     backgroundColor: '#f8fafc',
//   },
//   modalHeaderLeft: {
//     flex: 1,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'rgb(0, 41, 87)',
//   },
//   modalSubtitle: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginTop: 2,
//   },
//   closeButton: {
//     padding: 8,
//     backgroundColor: '#fee2e2',
//     borderRadius: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8fafc',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: 'rgb(0, 41, 87)',
//     fontWeight: '600',
//   },
//   loadingSubText: {
//     marginTop: 5,
//     fontSize: 14,
//     color: '#6B7280',
//   },
// });

// export default TimesheetCalendar;

