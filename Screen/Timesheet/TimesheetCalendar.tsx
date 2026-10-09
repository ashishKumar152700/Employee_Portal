// Screen/Timesheet/TimesheetCalendar.tsx

import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Modal,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  RefreshControl,
  Animated,
  Easing,
  PanResponder,
  KeyboardAvoidingView,
} from "react-native";
import { Calendar } from "react-native-calendars";
import TimesheetForm from "./Timesheet";
import { dialog } from "../../Component/Feedback/AppDialog";
import { LoadingScreen } from "../../Component/Feedback/LoadingScreen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  TimesheetTask,
  MonthlyTaskSummary,
  getTasksByDate,
  getUserTaskHourCount,
  processHourCountForCalendar,
  clearCache,
} from "../../Services/Timesheet/timesheetService";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { themedStyles, C } from "../../Global/ThemeContext";

const DAILY_TARGET_HOURS = 8;
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const pad = (n: number) => String(n).padStart(2, "0");
const toISO = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKeyOf = (year: number, month: number) => `${year}-${pad(month)}-01`;

// Hours → colour band (same thresholds as before).
const hoursTone = (hours: number) =>
  hours >= 8
    ? { fg: C.successText, bg: C.successBg, solid: "#10B981" }
    : hours >= 4
      ? { fg: C.warningText, bg: C.warningBg, solid: "#F59E0B" }
      : { fg: C.dangerText, bg: C.dangerBg, solid: "#EF4444" };

const formatHours = (hours: number) =>
  hours === 0 ? "0h" : Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;

/** Mon–Fri days in the month, up to today for the current month. */
const workingDaysSoFar = (year: number, month: number) => {
  const now = new Date();
  const isCurrent = now.getFullYear() === year && now.getMonth() + 1 === month;
  const lastDay = isCurrent ? now.getDate() : new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
};

// ─── Day cell ───────────────────────────────────────────────────────────────
const DayCell = ({
  date,
  state,
  summary,
  isToday,
  isFuture,
  onPress,
}: {
  date: any;
  state?: string;
  summary?: MonthlyTaskSummary;
  isToday: boolean;
  isFuture: boolean;
  onPress: (dateString: string) => void;
}) => {
  const outside = state === "disabled" && !isFuture; // padding days of other months
  const hours = summary && summary.hasTimesheet ? summary.totalMinutes / 60 : 0;
  const tone = hours > 0 ? hoursTone(hours) : null;

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={isFuture || outside}
      onPress={() => onPress(date.dateString)}
      style={[
        styles.day,
        tone && { backgroundColor: tone.bg },
        isToday && styles.dayToday,
        (isFuture || outside) && styles.dayMuted,
      ]}
      accessibilityLabel={`${date.dateString}${hours ? `, ${formatHours(hours)} logged` : ""}`}
    >
      <Text style={[styles.dayNum, isToday && styles.dayNumToday, tone && { color: tone.fg }]}>
        {date.day}
      </Text>
      {tone ? (
        <Text style={[styles.dayHours, { color: tone.fg }]}>{formatHours(hours)}</Text>
      ) : isToday ? (
        <View style={styles.todayDot} />
      ) : (
        <View style={styles.dayHoursSpacer} />
      )}
    </TouchableOpacity>
  );
};

const LegendChip = ({ color, label, outline }: { color: string; label: string; outline?: boolean }) => (
  <View style={styles.legendChip}>
    <View
      style={[
        styles.legendSwatch,
        outline ? { borderWidth: 2, borderColor: color } : { backgroundColor: color },
      ]}
    />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

const TimesheetCalendar: React.FC = () => {
  // The modal draws edge-to-edge (RN 0.81), so pad for the status bar here.
  const insets = useSafeAreaInsets();
  const today = toISO(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [modalVisible, setModalVisible] = useState(false);
  const [tasksByDate, setTasksByDate] = useState<{ [date: string]: TimesheetTask[] }>({});
  const [hourCountSummary, setHourCountSummary] = useState<{ [date: string]: MonthlyTaskSummary }>({});
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [currentVisibleMonth, setCurrentVisibleMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
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

  const showErrorAlert = (title: string, message: string) => {
    dialog.alert(title, message, "error");
  };

  const showWarningAlert = (title: string, message: string) => {
    dialog.alert(title, message, "warning");
  };

  // ─── Month paging: one month rendered at a time = instant dates ─────────
  const monthKey = monthKeyOf(currentVisibleMonth.year, currentVisibleMonth.month);
  const now = new Date();
  const isCurrentMonth =
    currentVisibleMonth.year === now.getFullYear() && currentVisibleMonth.month === now.getMonth() + 1;

  const slide = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  const calendarWidth = useRef(360);
  const animating = useRef(false);

  const shiftMonth = useCallback(
    (delta: number) => {
      if (animating.current) return;
      const target = new Date(currentVisibleMonth.year, currentVisibleMonth.month - 1 + delta, 1);
      if (delta > 0 && target > new Date(now.getFullYear(), now.getMonth(), 1)) return; // no future months
      animating.current = true;
      const w = calendarWidth.current;
      Animated.parallel([
        Animated.timing(slide, { toValue: -delta * w * 0.35, duration: 130, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(fade, { toValue: 0, duration: 130, useNativeDriver: true }),
      ]).start(() => {
        setCurrentVisibleMonth({ year: target.getFullYear(), month: target.getMonth() + 1 });
        slide.setValue(delta * w * 0.35);
        Animated.parallel([
          Animated.spring(slide, { toValue: 0, friction: 9, tension: 90, useNativeDriver: true }),
          Animated.timing(fade, { toValue: 1, duration: 180, useNativeDriver: true }),
        ]).start(() => {
          animating.current = false;
        });
      });
    },
    [currentVisibleMonth, now]
  );

  const goToToday = () => {
    if (isCurrentMonth) return;
    setCurrentVisibleMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
  };

  // Horizontal swipe on the calendar body changes month.
  const shiftRef = useRef(shiftMonth);
  shiftRef.current = shiftMonth;
  const pan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 14 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderMove: (_e, g) => slide.setValue(g.dx * 0.35),
        onPanResponderRelease: (_e, g) => {
          if (g.dx < -50) shiftRef.current(1);
          else if (g.dx > 50) shiftRef.current(-1);
          else Animated.spring(slide, { toValue: 0, useNativeDriver: true }).start();
        },
        onPanResponderTerminate: () => Animated.spring(slide, { toValue: 0, useNativeDriver: true }).start(),
      }),
    []
  );

  // Built once — rebuilding it each render forces the library to restyle.
  const calendarTheme = useMemo(
    () => ({
      calendarBackground: "transparent",
      textDayFontWeight: "600" as const,
    }),
    []
  );

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

  const workingDays = workingDaysSoFar(currentVisibleMonth.year, currentVisibleMonth.month);
  const targetHours = workingDays * DAILY_TARGET_HOURS;
  const progress = targetHours ? Math.min(monthlyTotals.hours / targetHours, 1) : 0;

  const motivation =
    monthlyTotals.days === 0
      ? "Tap any date above to log your work."
      : progress >= 1
        ? "Target reached for this month — great work!"
        : `${monthlyTotals.days} of ${workingDays} working days logged${isCurrentMonth ? " so far" : ""}.`;

  // ─── Form modal header data ─────────────────────────────────────────────
  const daySummary = hourCountSummary[selectedDate];
  const dayMinutes = daySummary?.totalMinutes ?? 0;
  const dayTasks = daySummary?.taskCount ?? 0;
  const dayProgress = Math.min(dayMinutes / (DAILY_TARGET_HOURS * 60), 1);
  const shiftDay = (delta: number) => {
    const d = new Date(`${selectedDate}T00:00:00`);
    d.setDate(d.getDate() + delta);
    const iso = toISO(d);
    if (iso > today) return;
    setSelectedDate(iso); // the form reloads itself for the new date
  };

  if (initialLoading) {
    return (
      <LoadingScreen
        message="Loading your timesheet"
        submessage="Fetching logged hours for this month"
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshData}
            colors={[C.accent]}
            tintColor={C.accent}
          />
        }
      >
        {/* ── Calendar card ───────────────────────────────────────── */}
        <View
          style={styles.calendarCard}
          onLayout={(e) => (calendarWidth.current = e.nativeEvent.layout.width)}
        >
          <View style={styles.calHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.calMonth}>
                {MONTH_NAMES[currentVisibleMonth.month - 1]}{" "}
                <Text style={styles.calYear}>{currentVisibleMonth.year}</Text>
              </Text>
              <Text style={styles.calHint}>Tap a date to log time · swipe to change month</Text>
            </View>
            {!isCurrentMonth && (
              <TouchableOpacity onPress={goToToday} style={styles.todayChip} activeOpacity={0.8}>
                <Text style={styles.todayChipText}>Today</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => shiftMonth(-1)}
              style={styles.navButton}
              accessibilityLabel="Previous month"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons name="chevron-left" size={22} color={C.accent} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => shiftMonth(1)}
              disabled={isCurrentMonth}
              style={[styles.navButton, isCurrentMonth && styles.navButtonDisabled]}
              accessibilityLabel="Next month"
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
            >
              <MaterialCommunityIcons name="chevron-right" size={22} color={C.accent} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={i} style={[styles.weekDay, (i === 0 || i === 6) && styles.weekEnd]}>
                {d}
              </Text>
            ))}
          </View>

          <Animated.View
            {...pan.panHandlers}
            style={{ opacity: fade, transform: [{ translateX: slide }] }}
          >
            <Calendar
              key={monthKey}
              current={monthKey}
              maxDate={today}
              hideArrows
              hideDayNames
              disableMonthChange
              customHeader={() => null}
              theme={calendarTheme}
              dayComponent={({ date, state }: any) => (
                <DayCell
                  date={date}
                  state={state}
                  summary={hourCountSummary[date.dateString]}
                  isToday={date.dateString === today}
                  isFuture={date.dateString > today}
                  onPress={(dateString) => openTimesheetModal({ dateString })}
                />
              )}
            />
          </Animated.View>
        </View>

        {/* ── Legend ──────────────────────────────────────────────── */}
        <View style={styles.legendRow}>
          <LegendChip color="#10B981" label="8h+" />
          <LegendChip color="#F59E0B" label="4–8h" />
          <LegendChip color="#EF4444" label="Under 4h" />
          <LegendChip color={C.accent} label="Today" outline />
        </View>

        {/* ── Month data strip ────────────────────────────────────── */}
        <LinearGradient
          colors={C.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.strip}
        >
          <View style={styles.stripRing} />
          <View style={styles.stripStats}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#7DD3FC" />
              <Text style={styles.statValue}>{formatHours(Number(monthlyTotals.hours.toFixed(1)))}</Text>
              <Text style={styles.statLabel}>Month hours</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="calendar-check-outline" size={16} color="#7DD3FC" />
              <Text style={styles.statValue}>{monthlyTotals.days}</Text>
              <Text style={styles.statLabel}>Days logged</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <MaterialCommunityIcons name="format-list-checks" size={16} color="#7DD3FC" />
              <Text style={styles.statValue}>{monthlyTotals.tasks}</Text>
              <Text style={styles.statLabel}>Total tasks</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.max(progress * 100, 2)}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {Math.round(progress * 100)}% of {targetHours}h
            </Text>
          </View>
        </LinearGradient>

        {/* ── Illustration ────────────────────────────────────────── */}
        <View style={styles.illustrationCard}>
          <LottieView
            source={require("../../assets/animations/workPeople.json")}
            autoPlay
            loop
            resizeMode="contain"
            style={styles.illustration}
          />
          <Text style={styles.illustrationText}>{motivation}</Text>
        </View>
      </ScrollView>

      {/* Full-screen form modal */}
      <Modal
        animationType="slide"
        transparent={false}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
        // Draw under both system bars; the header / action bar pad for them
        // exactly once (non-translucent + insets padding = an extra strip).
        statusBarTranslucent
        navigationBarTranslucent
      >
        <View style={[styles.modalSafeArea, { paddingTop: insets.top }]}>
          <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />

          {/* Compact header: date + day progress + day navigation */}
          <LinearGradient
            colors={C.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <View style={styles.modalTopRow}>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.headerButton}
                accessibilityLabel="Close"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="chevron-down" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => shiftDay(-1)}
                style={styles.dayNav}
                accessibilityLabel="Previous day"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="chevron-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.modalTitleBlock}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {selectedDate === today
                    ? "Today"
                    : new Date(`${selectedDate}T00:00:00`).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  {formatHours(Number((dayMinutes / 60).toFixed(1)))} logged · {dayTasks} task
                  {dayTasks === 1 ? "" : "s"}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => shiftDay(1)}
                disabled={selectedDate >= today}
                style={[styles.dayNav, selectedDate >= today && styles.dayNavDisabled]}
                accessibilityLabel="Next day"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="chevron-right" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <View style={styles.headerButtonSpacer} />
            </View>

            <View style={styles.dayTrack}>
              <View style={[styles.dayFill, { width: `${Math.max(dayProgress * 100, dayMinutes ? 3 : 0)}%` }]} />
            </View>
          </LinearGradient>

          {/* Form Content */}
          <KeyboardAvoidingView
            style={styles.modalContent}
            // Edge-to-edge: Android no longer resizes the window for the
            // keyboard, so pad on both platforms.
            behavior="padding"
          >
            {loading ? (
              <LoadingScreen message="Loading tasks" submessage="Getting your entries for this day" showLogo={false} />
            ) : (
              <TimesheetForm
                selectedDate={selectedDate}
                onTasksUpdated={handleTasksUpdated}
                closeModal={() => setModalVisible(false)}
              />
            )}
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
};

/* ------------------------------- STYLES ------------------------------- */

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scroll: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 16,
  },

  // Calendar card
  calendarCard: {
    backgroundColor: c.surface,
    borderRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: c.border,
    overflow: "hidden",
    elevation: 3,
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  calMonth: {
    fontSize: 20,
    fontWeight: "800",
    color: c.text,
  },
  calYear: {
    fontWeight: "600",
    color: c.textSoft,
  },
  calHint: {
    fontSize: 11.5,
    color: c.textSoft,
    marginTop: 2,
  },
  todayChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: c.primaryFaint,
    borderWidth: 1,
    borderColor: c.border,
  },
  todayChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: c.accent,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.surfaceAlt,
    borderWidth: 1,
    borderColor: c.border,
  },
  navButtonDisabled: {
    opacity: 0.35,
  },
  weekRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 11.5,
    fontWeight: "700",
    color: c.textSoft,
    letterSpacing: 0.5,
  },
  weekEnd: {
    color: c.textFaint,
  },

  // Day cell
  day: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  dayToday: {
    borderWidth: 2,
    borderColor: c.accent,
  },
  dayMuted: {
    opacity: 0.3,
  },
  dayNum: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
  },
  dayNumToday: {
    color: c.accent,
    fontWeight: "800",
  },
  dayHours: {
    fontSize: 9.5,
    fontWeight: "800",
    marginTop: 1,
  },
  dayHoursSpacer: {
    height: 13,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 4,
    marginBottom: 4,
    backgroundColor: c.accent,
  },

  // Legend
  legendRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginTop: 10,
  },
  legendChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSoft,
  },

  // Data strip
  strip: {
    marginTop: 10,
    borderRadius: 22,
    paddingVertical: 16,
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  stripRing: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    top: -90,
    right: -50,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.16)",
  },
  stripStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  stat: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "rgba(255, 255, 255, 0.72)",
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255, 255, 255, 0.16)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: "#7DD3FC",
  },
  progressText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "rgba(255, 255, 255, 0.85)",
  },

  // Illustration
  illustrationCard: {
    flex: 1,
    minHeight: 120,
    marginTop: 10,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 4,
    paddingBottom: 12,
    overflow: "hidden",
    borderRadius: 22,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  illustration: {
    flex: 1,
    width: "100%",
    maxHeight: 220,
  },
  illustrationText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: c.textSoft,
    textAlign: "center",
    paddingHorizontal: 20,
  },

  // Form modal
  modalSafeArea: {
    flex: 1,
    backgroundColor: c.primary,
  },
  modalHeader: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
  },
  modalTopRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  headerButtonSpacer: {
    width: 36,
  },
  dayNav: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  dayNavDisabled: {
    opacity: 0.3,
  },
  modalTitleBlock: {
    flex: 1,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  modalSubtitle: {
    fontSize: 12.5,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 1,
  },
  dayTrack: {
    height: 4,
    borderRadius: 2,
    marginTop: 10,
    marginHorizontal: 4,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    overflow: "hidden",
  },
  dayFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#7DD3FC",
  },
  modalContent: {
    flex: 1,
    backgroundColor: c.background,
  },
}));

export default TimesheetCalendar;
