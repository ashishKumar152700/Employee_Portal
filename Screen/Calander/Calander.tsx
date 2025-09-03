import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { CalendarList } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Card, Badge, Divider } from "react-native-paper";
import { calendarservice } from "../../Services/Calendar/Calendar.service";
import { useDispatch } from "react-redux";
import {
  differenceInSeconds,
  format,
  parseISO,
  isValid,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { RefreshControl } from "react-native";
import { useSelector } from "react-redux";
import { Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

type Item = {
  punchInTime?: string | null;
  punchOutTime?: string | null;
  punchDate?: string;
  duration?: number;
  outactualaddress?: string;
  inactualaddress?: string;
  outmocked?: boolean;
  status?: string;
  leavestatus?: string;
  indevice?: any;
  outdevice?: any;
};

const todayISO = new Date().toISOString().split("T")[0];
const currentYear = new Date().getFullYear();
const minDate = `${currentYear}-01-01`;

const Schedule: React.FC = () => {
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );
  const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState(false);
  const todayPunch = useSelector((state: any) => state.todayPunch);
  const dispatch = useDispatch();

  const mobileIcon = require("../../assets/device/mobile.png");
  const biometricIcon = require("../../assets/device/biometric.png");

  useEffect(() => {
    if (todayPunch && todayPunch.punchdate) {
      const dayISO = todayPunch.punchdate.split("T")[0];
      setItems((prev) => ({
        ...prev,
        [dayISO]: [todayPunch],
      }));
    }
  }, [todayPunch]);

   


  /* ---------- Helper functions ---------- */
  const isoToDisplay = (iso: string) => {
    try {
      const date = parseISO(iso);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
    } catch {
      return "Invalid Date";
    }
  };

  const calcDuration = (
    dateISO: string,
    inT?: string | null,
    outT?: string | null
  ) => {
    if (!inT || !outT) return "--h --m --s";
    const base = dateISO;
    const into = parseISO(`${base}T${inT}`);
    const outo = parseISO(`${base}T${outT}`);
    if (!isValid(into) || !isValid(outo)) return "--h --m --s";

    const sec = differenceInSeconds(outo, into);
    if (sec < 0) return "--h --m --s";

    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h}h ${m}m ${s}s`;
  };

  /* ---------- Core data fetch ---------- */
  // Update the fetchRange function to handle errors more gracefully
  const fetchRange = useCallback(
    async (fromISO: string, toISO: string) => {
      try {
        const data = await calendarservice.CalendarGet(
          fromISO,
          toISO,
          dispatch
        );
        const grouped: Record<string, Item[]> = {};

        (data?.data ?? data).forEach((row: any) => {
          const dayISO = row.punchdate
            ? row.punchdate.split("T")[0]
            : new Date().toISOString().split("T")[0];
          if (!grouped[dayISO]) grouped[dayISO] = [];

          grouped[dayISO].push({
            punchInTime: row.punchintime || "",
            punchOutTime: row.punchouttime || "",
            punchDate: row.punchdate,
            duration: row.duration,
            outactualaddress: row.outactualaddress,
            inactualaddress: row.inactualaddress,
            outmocked: row.outmocked,
            status: row.status,
            leavestatus: row.leavestatus,
            indevice: row.indevice, 
            outdevice: row.outdevice,
          });
        });

        const start = parseISO(fromISO);
        const end = parseISO(toISO);
        for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
          const iso = d.toISOString().split("T")[0];
          if (!grouped[iso]) {
            grouped[iso] = [
              {
                punchInTime: null,
                punchOutTime: null,
                punchDate: iso,
                status: "Absent",
              },
            ];
          }
        }
        setItems((prev) => ({ ...prev, ...grouped }));
      } catch (e) {
        console.error("fetchRange error:", e);
      }
    },
    [dispatch]
  );

  /* ---------- Load data for month ---------- */
  const loadItemsForMonth = useCallback(
    async (monthDate: Date, force = false) => {
      const monthKey = format(monthDate, "yyyy-MM");
      if (!force && loadedMonths.has(monthKey)) return;

      const fromISO = startOfMonth(monthDate).toISOString().split("T")[0];
      const endOfMonthISO = endOfMonth(monthDate).toISOString().split("T")[0];
      const toISO = endOfMonthISO > todayISO ? todayISO : endOfMonthISO;

      await fetchRange(fromISO, toISO);
      setLoadedMonths((prev) => new Set(prev).add(monthKey));
    },
    [loadedMonths, fetchRange]
  );

  useFocusEffect(
    useCallback(() => {
      const today = new Date();
      loadItemsForMonth(today, true);
    }, [loadItemsForMonth])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    // Force reload current month and today's data
    const today = new Date();
    const todayISO = format(today, 'yyyy-MM-dd');
    
    // Fetch today's data specifically
    await fetchRange(todayISO, todayISO);
    
    // Also refresh any other loaded months
    const monthsToRefresh = Array.from(loadedMonths);
    for (const monthKey of monthsToRefresh) {
      const [year, month] = monthKey.split('-');
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      await loadItemsForMonth(monthDate, true); // Add force parameter
    }

    setRefreshing(false);
  }, [loadItemsForMonth, loadedMonths, fetchRange]);

  /* ---------- Handle day press ---------- */
  const onDayPress = useCallback(
    async (day: { dateString: string }) => {
      setSelectedDate(day.dateString);

      // Collapse calendar after selection
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCalendarCollapsed(true);

      // Fetch data for the range from selected date to today if not already loaded
      const datesToLoad = eachDayOfInterval({
        start: parseISO(day.dateString),
        end: new Date(),
      }).map((date) => format(date, "yyyy-MM-dd"));

      const missingDates = datesToLoad.filter((date) => !items[date]);

      if (missingDates.length > 0) {
        await fetchRange(
          missingDates[0],
          missingDates[missingDates.length - 1]
        );
      }
    },
    [items, fetchRange]
  );

  /* ---------- Toggle calendar visibility ---------- */
  const toggleCalendar = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarCollapsed(!calendarCollapsed);
  }, [calendarCollapsed]);

  /* ---------- Toggle location visibility ---------- */
  const toggleExpanded = useCallback((date: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  }, []);

  /* ---------- Get dates from selected date to today ---------- */
  const dateRange = useMemo(() => {
    if (!selectedDate) return [];

    const startDate = parseISO(selectedDate);
    const endDate = new Date();

    return eachDayOfInterval({ start: startDate, end: endDate })
      .map((date) => format(date, "yyyy-MM-dd"))
      .reverse(); // Show most recent first
  }, [selectedDate]);

  /* ---------- Marked dates for calendar ---------- */
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(items).forEach((date) => {
      const dayItems = items[date];
      const hasPunch = dayItems.some((item) => item.punchInTime);
      const isLeave = dayItems.some((item) => item.leavestatus);
      const isPartial = dayItems.some(
        (item) => item.punchInTime && !item.punchOutTime
      );

      marks[date] = {
        selected: date === selectedDate,
        selectedColor: "#002957",
        disabled: date > todayISO,
      };

      if (hasPunch) {
        marks[date].marked = true;
        marks[date].dotColor = isPartial ? "#FFA500" : "#4CAF50";
      } else if (isLeave) {
        marks[date].marked = true;
        marks[date].dotColor = "#9C27B0";
      } else if (date <= todayISO) {
        marks[date].marked = true;
        marks[date].dotColor = "#F44336";
      }
    });

    return marks;
  }, [items, selectedDate]);

  /* ---------- Render card for a specific date ---------- */
  const renderDateCard = useCallback(
    (date: string) => {
      const dayItems = items[date] || [];
      if (dayItems.length === 0) return null;

      const item = dayItems[0];
      const disp = isoToDisplay(date);
      const isExpanded = expandedCards[date];
      const isToday = date === todayISO;
      const isLeave = item.leavestatus;

      if (isLeave) {
        return (
          <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{disp}</Text>
                <Badge style={styles.leaveBadge}>
                  {item.leavestatus} Leave
                </Badge>
              </View>
              <View style={styles.leaveContainer}>
                <Icon name="calendar-check" size={24} color="#9C27B0" />
                <Text style={styles.leaveText}>{item.status}</Text>
              </View>
            </Card.Content>
          </Card>
        );
      }

      if (!item.punchInTime) {
        return (
          <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{disp}</Text>
                <Badge style={styles.absentBadge}>Absent</Badge>
              </View>
              <View style={styles.absentContainer}>
                <Icon name="calendar-remove" size={24} color="#FF9800" />
                <Text style={styles.absentText}>No attendance record</Text>
              </View>
            </Card.Content>
          </Card>
        );
      }

      const isPartial = !item.punchOutTime;
      return (
        <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
          <Card.Content style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.date}>{disp}</Text>
              <Badge
                style={isPartial ? styles.partialBadge : styles.presentBadge}
              >
                {isPartial ? "Partial" : item.status || "Present"}
              </Badge>
            </View>

            <View style={styles.timesContainer}>
              <View style={styles.timeBlock}>
                <View style={styles.timeHeader}>
                  <Icon name="clock-in" size={20} color="#002957" />
                  <Text style={styles.timeLabel}>Punch In</Text>
                </View>
                <Text style={styles.timeValue}>{item.punchInTime}</Text>
              </View>

              <View style={styles.timeSeparator}>
                <View style={styles.timeLine} />
              </View>

              <View style={styles.timeBlock}>
                <View style={styles.timeHeader}>
                  <Icon name="clock-out" size={20} color="#002957" />
                  <Text style={styles.timeLabel}>Punch Out</Text>
                </View>
                <Text
                  style={[styles.timeValue, isPartial && styles.partialText]}
                >
                  {item.punchOutTime}
                </Text>
              </View>
            </View>

            <View style={styles.durationContainer}>
              <Icon name="timer" size={20} color="#002957" />
              <Text style={styles.durationText}>
                {isPartial
                  ? ""
                  : calcDuration(date, item.punchInTime, item.punchOutTime)}
              </Text>
            </View>

            {/* Location Toggle */}
            {item.outactualaddress && (
              <TouchableOpacity
                style={styles.locationToggle}
                onPress={() => toggleExpanded(date)}
                activeOpacity={0.7}
              >
                <Text style={styles.locationToggleText}>
                  {isExpanded ? "Hide Punch Address" : "Show Punch Address"}
                </Text>
                <Icon
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={22}
                  color="#002957"
                />
              </TouchableOpacity>
            )}

            {isExpanded && (
              <Animated.View style={styles.locationDetails}>
                <Divider style={styles.divider} />

                {/* Punch In */}
                <View style={styles.locationSection}>
                  <View style={styles.locationHeader}>
                    <Icon name="map-marker" size={18} color="#002957" />
                    <Text style={styles.locationTitle}>Punch In</Text>
                   
                  </View>
                  <View style={styles.addressWithDevice}>
                  <Text style={styles.locationText}>
                    {item.inactualaddress || "No address available"}
                  </Text>
                   <Image
                      source={
                        item.indevice?.toLowerCase() === "mobile"
                          ? mobileIcon
                          : biometricIcon
                      }
                      style={styles.deviceIconSmall}
                      resizeMode="contain"
                    />
                  </View>
                </View>

                <Divider style={styles.divider} />

                {/* Punch Out */}
                <View style={styles.locationSection}>
                  <View style={styles.locationHeader}>
                    <Icon name="map-marker" size={18} color="#002957" />
                    <Text style={styles.locationTitle}>Punch Out</Text>
                  
                  </View>
                  <View style={styles.addressWithDevice}>
                  <Text style={styles.locationText}>
                    {item.outactualaddress || "No address available"}
                  </Text>
                    <Image
                      source={
                        item.outdevice?.toLowerCase() === "mobile"
                          ? mobileIcon
                          : biometricIcon
                      }
                      style={styles.deviceIconSmall}
                      resizeMode="contain"
                    />
                  </View>
                </View>
              </Animated.View>
            )}
          </Card.Content>
        </Card>
      );
    },
    [items, expandedCards, toggleExpanded]
  );

  /* ---------- Initial load ---------- */
  useEffect(() => {
    // Load current month initially
    loadItemsForMonth(new Date());
  }, []);

  /* ---------- Component ---------- */
  return (
    <View style={styles.container}>
      {/* Calendar Header with Toggle */}
      <TouchableOpacity
        style={styles.calendarHeader}
        onPress={toggleCalendar}
        activeOpacity={0.7}
      >
        <Text style={styles.calendarHeaderText}>Calendar</Text>
        <Icon
          name={calendarCollapsed ? "chevron-down" : "chevron-up"}
          size={24}
          color="#002957"
        />
      </TouchableOpacity>

      {/* Collapsible Calendar */}
      {!calendarCollapsed && (
        <Animated.View style={styles.calendarContainer}>
          <CalendarList
            current={todayISO}
            minDate={minDate}
            maxDate={todayISO}
            onDayPress={onDayPress}
            markedDates={markedDates}
            onVisibleMonthsChange={(months) => {
              months.forEach((month) =>
                loadItemsForMonth(new Date(month.dateString))
              );
            }}
            horizontal
            pagingEnabled
            theme={{
              calendarBackground: "#ffffff",
              textSectionTitleColor: "#002957",
              selectedDayBackgroundColor: "#002957",
              selectedDayTextColor: "#ffffff",
              todayTextColor: "#002957",
              dayTextColor: "#2d4150",
              textDisabledColor: "#d9e1e8",
              dotColor: "#002957",
              selectedDotColor: "#ffffff",
              arrowColor: "#002957",
              monthTextColor: "#002957",
              textDayFontWeight: "300",
              textMonthFontWeight: "bold",
              textDayHeaderFontWeight: "500",
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 14,
            }}
          />
        </Animated.View>
      )}

      <View style={styles.detailsContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Attendance from {isoToDisplay(selectedDate)} to Today
          </Text>
          <Text style={styles.datesCount}>
            {dateRange.length} day{dateRange.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <ScrollView
          style={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {dateRange.map((date) => renderDateCard(date))}
        </ScrollView>
      </View>
    </View>
  );
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f7fa",
    marginBottom: 55,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  calendarHeaderText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#002957",
  },
  calendarContainer: {
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailsContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f5f7fa",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
    flex: 1,
  },
  datesCount: {
    fontSize: 16,
    fontWeight: "500",
    color: "#607D8B",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    borderRadius: 12,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    marginBottom: 12,
  },
  todayCard: {
    borderWidth: 1,
    borderColor: "#002957",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f6",
  },
  date: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
  },
  absentBadge: {
    backgroundColor: "#FFF3E0",
    color: "#FF9800",
  },
  presentBadge: {
    backgroundColor: "#E8F5E9",
    color: "#4CAF50",
  },
  partialBadge: {
    backgroundColor: "#FFF8E1",
    color: "#FFC107",
  },
  leaveBadge: {
    backgroundColor: "#F3E5F5",
    color: "#9C27B0",
  },
  absentContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  absentText: {
    fontSize: 16,
    color: "#FF9800",
    marginLeft: 10,
  },
  leaveContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  leaveText: {
    fontSize: 16,
    color: "#9C27B0",
    marginLeft: 10,
  },
  timesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeBlock: {
    alignItems: "center",
    flex: 1,
  },
  timeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: "#002957",
    marginLeft: 6,
    fontWeight: "500",
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
  },
  timeSeparator: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  timeLine: {
    height: 2,
    width: 20,
    backgroundColor: "#002957",
    borderRadius: 1,
  },
  durationContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#f0f5ff",
    borderRadius: 8,
    marginBottom: 12,
  },
  durationText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
    marginLeft: 10,
  },
  partialText: {
    color: "#FFC107",
  },
  locationToggle: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  locationToggleText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#002957",
  },
  locationDetails: {
    // marginTop: 8,
  },
  divider: {
    marginVertical: 8,
    backgroundColor: "#e0e0e0",
  },
  locationSection: {
    marginBottom: 6,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 4,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
    marginLeft: 6,
  },
  locationText: {
    fontSize: 14,
    color: "#546E7A",
    marginLeft: 24,
     width: 200,
    height: 90,
  },
  mockedBadge: {
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginLeft: 24,
  },
  mockedText: {
    fontSize: 12,
    color: "#F44336",
  },
  deviceIconSmall: {
    width: 120,
    height: 120,
    // marginLeft: 8,
  },
  addressWithDevice: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

export default Schedule;
// import React, { useState, useEffect, useCallback, useMemo } from "react";
// import {
//   View,
//   StyleSheet,
//   Text,
//   TouchableOpacity,
//   ScrollView,
//   Animated,
//   LayoutAnimation,
//   Platform,
//   UIManager,
// } from "react-native";
// import { CalendarList } from "react-native-calendars";
// import Icon from "react-native-vector-icons/MaterialCommunityIcons";
// import { Card, Badge, Divider } from "react-native-paper";
// import { calendarservice } from "../../Services/Calendar/Calendar.service";
// import { useDispatch } from "react-redux";
// import {
//   differenceInSeconds,
//   format,
//   parseISO,
//   isValid,
//   startOfMonth,
//   endOfMonth,
//   eachDayOfInterval,
// } from "date-fns";
// import { RefreshControl } from "react-native";
// import { useSelector } from "react-redux";
// import { Image } from "react-native";

// if (Platform.OS === "android") {
//   if (UIManager.setLayoutAnimationEnabledExperimental) {
//     UIManager.setLayoutAnimationEnabledExperimental(true);
//   }
// }

// type Item = {
//   punchInTime?: string | null;
//   punchOutTime?: string | null;
//   punchDate?: string;
//   duration?: number;
//   outactualaddress?: string;
//   inactualaddress?: string;
//   outmocked?: boolean;
//   status?: string;
//   leavestatus?: string;
//   indevice?: any;
//   outdevice?: any;
// };

// const todayISO = new Date().toISOString().split("T")[0];
// const currentYear = new Date().getFullYear();
// const minDate = `${currentYear}-01-01`;

// const Schedule: React.FC = () => {
//   const [items, setItems] = useState<Record<string, Item[]>>({});
//   const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
//   const [selectedDate, setSelectedDate] = useState<string>(todayISO);
//   const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
//     {}
//   );
//   const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const todayPunch = useSelector((state: any) => state.todayPunch);
//   const dispatch = useDispatch();

//   const mobileIcon = require("../../assets/device/mobile.png");
//   const biometricIcon = require("../../assets/device/biometric.png");

//   useEffect(() => {
//     if (todayPunch && todayPunch.punchdate) {
//       const dayISO = todayPunch.punchdate.split("T")[0];
//       setItems((prev) => ({
//         ...prev,
//         [dayISO]: [todayPunch],
//       }));
//     }
//   }, [todayPunch]);

//   /* ---------- Helper functions ---------- */
//   const isoToDisplay = (iso: string) => {
//     try {
//       const date = parseISO(iso);
//       return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid Date";
//     } catch {
//       return "Invalid Date";
//     }
//   };

//   const calcDuration = (
//     dateISO: string,
//     inT?: string | null,
//     outT?: string | null
//   ) => {
//     if (!inT || !outT) return "--h --m --s";
//     const base = dateISO;
//     const into = parseISO(`${base}T${inT}`);
//     const outo = parseISO(`${base}T${outT}`);
//     if (!isValid(into) || !isValid(outo)) return "--h --m --s";

//     const sec = differenceInSeconds(outo, into);
//     if (sec < 0) return "--h --m --s";

//     const h = Math.floor(sec / 3600);
//     const m = Math.floor((sec % 3600) / 60);
//     const s = sec % 60;
//     return `${h}h ${m}m ${s}s`;
//   };

//   /* ---------- Core data fetch ---------- */
//   // Update the fetchRange function to handle errors more gracefully
//   const fetchRange = useCallback(
//     async (fromISO: string, toISO: string) => {
//       try {
//         const data = await calendarservice.CalendarGet(
//           fromISO,
//           toISO,
//           dispatch
//         );
//         const grouped: Record<string, Item[]> = {};

//         (data?.data ?? data).forEach((row: any) => {
//           const dayISO = row.punchdate
//             ? row.punchdate.split("T")[0]
//             : new Date().toISOString().split("T")[0];
//           if (!grouped[dayISO]) grouped[dayISO] = [];

//           grouped[dayISO].push({
//             punchInTime: row.punchintime || "",
//             punchOutTime: row.punchouttime || "",
//             punchDate: row.punchdate,
//             duration: row.duration,
//             outactualaddress: row.outactualaddress,
//             inactualaddress: row.inactualaddress,
//             outmocked: row.outmocked,
//             status: row.status,
//             leavestatus: row.leavestatus,
//             indevice: row.indevice, 
//             outdevice: row.outdevice,
//           });
//         });

//         const start = parseISO(fromISO);
//         const end = parseISO(toISO);
//         for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
//           const iso = d.toISOString().split("T")[0];
//           if (!grouped[iso]) {
//             grouped[iso] = [
//               {
//                 punchInTime: null,
//                 punchOutTime: null,
//                 punchDate: iso,
//                 status: "Absent",
//               },
//             ];
//           }
//         }
//         setItems((prev) => ({ ...prev, ...grouped }));
//       } catch (e) {
//         console.error("fetchRange error:", e);
//       }
//     },
//     [dispatch]
//   );

//   /* ---------- Load data for month ---------- */
//   const loadItemsForMonth = useCallback(
//     async (monthDate: Date) => {
//       const monthKey = format(monthDate, "yyyy-MM");
//       if (loadedMonths.has(monthKey)) return;

//       const fromISO = startOfMonth(monthDate).toISOString().split("T")[0];
//       const endOfMonthISO = endOfMonth(monthDate).toISOString().split("T")[0];
//       const toISO = endOfMonthISO > todayISO ? todayISO : endOfMonthISO;

//       await fetchRange(fromISO, toISO);
//       setLoadedMonths((prev) => new Set(prev).add(monthKey));
//     },
//     [loadedMonths, fetchRange]
//   );

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);


//     // Refresh data for all loaded months
//     const monthsToRefresh = Array.from(loadedMonths).map((monthKey) => {
//       const [year, month] = monthKey.split("-");
//       return new Date(parseInt(year), parseInt(month) - 1, 1);
//     });

//     // Also refresh the current month if not already loaded
//     const currentMonth = new Date();
//     const currentMonthKey = format(currentMonth, "yyyy-MM");
//     if (!loadedMonths.has(currentMonthKey)) {
//       monthsToRefresh.push(currentMonth);
//     }

//     // Refresh each month
//     for (const month of monthsToRefresh) {
//       await loadItemsForMonth(month);
//     }

//     setRefreshing(false);
//   }, [loadItemsForMonth, loadedMonths,todayPunch]);

//   /* ---------- Handle day press ---------- */
//   const onDayPress = useCallback(
//     async (day: { dateString: string }) => {
//       setSelectedDate(day.dateString);

//       // Collapse calendar after selection
//       LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//       setCalendarCollapsed(true);

//       // Fetch data for the range from selected date to today if not already loaded
//       const datesToLoad = eachDayOfInterval({
//         start: parseISO(day.dateString),
//         end: new Date(),
//       }).map((date) => format(date, "yyyy-MM-dd"));

//       const missingDates = datesToLoad.filter((date) => !items[date]);

//       if (missingDates.length > 0) {
//         await fetchRange(
//           missingDates[0],
//           missingDates[missingDates.length - 1]
//         );
//       }
//     },
//     [items, fetchRange]
//   );

//   /* ---------- Toggle calendar visibility ---------- */
//   const toggleCalendar = useCallback(() => {
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setCalendarCollapsed(!calendarCollapsed);
//   }, [calendarCollapsed]);

//   /* ---------- Toggle location visibility ---------- */
//   const toggleExpanded = useCallback((date: string) => {
//     setExpandedCards((prev) => ({
//       ...prev,
//       [date]: !prev[date],
//     }));
//   }, []);

//   /* ---------- Get dates from selected date to today ---------- */
//   const dateRange = useMemo(() => {
//     if (!selectedDate) return [];

//     const startDate = parseISO(selectedDate);
//     const endDate = new Date();

//     return eachDayOfInterval({ start: startDate, end: endDate })
//       .map((date) => format(date, "yyyy-MM-dd"))
//       .reverse(); // Show most recent first
//   }, [selectedDate]);

//   /* ---------- Marked dates for calendar ---------- */
//   const markedDates = useMemo(() => {
//     const marks: Record<string, any> = {};

//     Object.keys(items).forEach((date) => {
//       const dayItems = items[date];
//       const hasPunch = dayItems.some((item) => item.punchInTime);
//       const isLeave = dayItems.some((item) => item.leavestatus);
//       const isPartial = dayItems.some(
//         (item) => item.punchInTime && !item.punchOutTime
//       );

//       marks[date] = {
//         selected: date === selectedDate,
//         selectedColor: "#002957",
//         disabled: date > todayISO,
//       };

//       if (hasPunch) {
//         marks[date].marked = true;
//         marks[date].dotColor = isPartial ? "#FFA500" : "#4CAF50";
//       } else if (isLeave) {
//         marks[date].marked = true;
//         marks[date].dotColor = "#9C27B0";
//       } else if (date <= todayISO) {
//         marks[date].marked = true;
//         marks[date].dotColor = "#F44336";
//       }
//     });

//     return marks;
//   }, [items, selectedDate]);

//   /* ---------- Render card for a specific date ---------- */
//   const renderDateCard = useCallback(
//     (date: string) => {
//       const dayItems = items[date] || [];
//       if (dayItems.length === 0) return null;

//       const item = dayItems[0];
//       const disp = isoToDisplay(date);
//       const isExpanded = expandedCards[date];
//       const isToday = date === todayISO;
//       const isLeave = item.leavestatus;

//       if (isLeave) {
//         return (
//           <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
//             <Card.Content style={styles.cardContent}>
//               <View style={styles.cardHeader}>
//                 <Text style={styles.date}>{disp}</Text>
//                 <Badge style={styles.leaveBadge}>
//                   {item.leavestatus} Leave
//                 </Badge>
//               </View>
//               <View style={styles.leaveContainer}>
//                 <Icon name="calendar-check" size={24} color="#9C27B0" />
//                 <Text style={styles.leaveText}>{item.status}</Text>
//               </View>
//             </Card.Content>
//           </Card>
//         );
//       }

//       if (!item.punchInTime) {
//         return (
//           <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
//             <Card.Content style={styles.cardContent}>
//               <View style={styles.cardHeader}>
//                 <Text style={styles.date}>{disp}</Text>
//                 <Badge style={styles.absentBadge}>Absent</Badge>
//               </View>
//               <View style={styles.absentContainer}>
//                 <Icon name="calendar-remove" size={24} color="#FF9800" />
//                 <Text style={styles.absentText}>No attendance record</Text>
//               </View>
//             </Card.Content>
//           </Card>
//         );
//       }

//       const isPartial = !item.punchOutTime;
//       return (
//         <Card key={date} style={[styles.card, isToday && styles.todayCard]}>
//           <Card.Content style={styles.cardContent}>
//             <View style={styles.cardHeader}>
//               <Text style={styles.date}>{disp}</Text>
//               <Badge
//                 style={isPartial ? styles.partialBadge : styles.presentBadge}
//               >
//                 {isPartial ? "Partial" : item.status || "Present"}
//               </Badge>
//             </View>

//             <View style={styles.timesContainer}>
//               <View style={styles.timeBlock}>
//                 <View style={styles.timeHeader}>
//                   <Icon name="clock-in" size={20} color="#002957" />
//                   <Text style={styles.timeLabel}>Punch In</Text>
//                 </View>
//                 <Text style={styles.timeValue}>{item.punchInTime}</Text>
//               </View>

//               <View style={styles.timeSeparator}>
//                 <View style={styles.timeLine} />
//               </View>

//               <View style={styles.timeBlock}>
//                 <View style={styles.timeHeader}>
//                   <Icon name="clock-out" size={20} color="#002957" />
//                   <Text style={styles.timeLabel}>Punch Out</Text>
//                 </View>
//                 <Text
//                   style={[styles.timeValue, isPartial && styles.partialText]}
//                 >
//                   {item.punchOutTime}
//                 </Text>
//               </View>
//             </View>

//             <View style={styles.durationContainer}>
//               <Icon name="timer" size={20} color="#002957" />
//               <Text style={styles.durationText}>
//                 {isPartial
//                   ? ""
//                   : calcDuration(date, item.punchInTime, item.punchOutTime)}
//               </Text>
//             </View>

//             {/* Location Toggle */}
//             {item.outactualaddress && (
//               <TouchableOpacity
//                 style={styles.locationToggle}
//                 onPress={() => toggleExpanded(date)}
//                 activeOpacity={0.7}
//               >
//                 <Text style={styles.locationToggleText}>
//                   {isExpanded ? "Hide Punch Address" : "Show Punch Address"}
//                 </Text>
//                 <Icon
//                   name={isExpanded ? "chevron-up" : "chevron-down"}
//                   size={22}
//                   color="#002957"
//                 />
//               </TouchableOpacity>
//             )}

//             {isExpanded && (
//               <Animated.View style={styles.locationDetails}>
//                 <Divider style={styles.divider} />

//                 {/* Punch In */}
//                 <View style={styles.locationSection}>
//                   <View style={styles.locationHeader}>
//                     <Icon name="map-marker" size={18} color="#002957" />
//                     <Text style={styles.locationTitle}>Punch In</Text>
                   
//                   </View>
//                   <View style={styles.addressWithDevice}>
//                   <Text style={styles.locationText}>
//                     {item.inactualaddress || "No address available"}
//                   </Text>
//                    <Image
//                       source={
//                         item.indevice?.toLowerCase() === "mobile"
//                           ? mobileIcon
//                           : biometricIcon
//                       }
//                       style={styles.deviceIconSmall}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </View>

//                 <Divider style={styles.divider} />

//                 {/* Punch Out */}
//                 <View style={styles.locationSection}>
//                   <View style={styles.locationHeader}>
//                     <Icon name="map-marker" size={18} color="#002957" />
//                     <Text style={styles.locationTitle}>Punch Out</Text>
                  
//                   </View>
//                   <View style={styles.addressWithDevice}>
//                   <Text style={styles.locationText}>
//                     {item.outactualaddress || "No address available"}
//                   </Text>
//                     <Image
//                       source={
//                         item.outdevice?.toLowerCase() === "mobile"
//                           ? mobileIcon
//                           : biometricIcon
//                       }
//                       style={styles.deviceIconSmall}
//                       resizeMode="contain"
//                     />
//                   </View>
//                 </View>
//               </Animated.View>
//             )}
//           </Card.Content>
//         </Card>
//       );
//     },
//     [items, expandedCards, toggleExpanded]
//   );

//   /* ---------- Initial load ---------- */
//   useEffect(() => {
//     // Load current month initially
//     loadItemsForMonth(new Date());
//   }, []);

//   /* ---------- Component ---------- */
//   return (
//     <View style={styles.container}>
//       {/* Calendar Header with Toggle */}
//       <TouchableOpacity
//         style={styles.calendarHeader}
//         onPress={toggleCalendar}
//         activeOpacity={0.7}
//       >
//         <Text style={styles.calendarHeaderText}>Calendar</Text>
//         <Icon
//           name={calendarCollapsed ? "chevron-down" : "chevron-up"}
//           size={24}
//           color="#002957"
//         />
//       </TouchableOpacity>

//       {/* Collapsible Calendar */}
//       {!calendarCollapsed && (
//         <Animated.View style={styles.calendarContainer}>
//           <CalendarList
//             current={todayISO}
//             minDate={minDate}
//             maxDate={todayISO}
//             onDayPress={onDayPress}
//             markedDates={markedDates}
//             onVisibleMonthsChange={(months) => {
//               months.forEach((month) =>
//                 loadItemsForMonth(new Date(month.dateString))
//               );
//             }}
//             horizontal
//             pagingEnabled
//             theme={{
//               calendarBackground: "#ffffff",
//               textSectionTitleColor: "#002957",
//               selectedDayBackgroundColor: "#002957",
//               selectedDayTextColor: "#ffffff",
//               todayTextColor: "#002957",
//               dayTextColor: "#2d4150",
//               textDisabledColor: "#d9e1e8",
//               dotColor: "#002957",
//               selectedDotColor: "#ffffff",
//               arrowColor: "#002957",
//               monthTextColor: "#002957",
//               textDayFontWeight: "300",
//               textMonthFontWeight: "bold",
//               textDayHeaderFontWeight: "500",
//               textDayFontSize: 14,
//               textMonthFontSize: 16,
//               textDayHeaderFontSize: 14,
//             }}
//           />
//         </Animated.View>
//       )}

//       <View style={styles.detailsContainer}>
//         <View style={styles.sectionHeader}>
//           <Text style={styles.sectionTitle}>
//             Attendance from {isoToDisplay(selectedDate)} to Today
//           </Text>
//           <Text style={styles.datesCount}>
//             {dateRange.length} day{dateRange.length !== 1 ? "s" : ""}
//           </Text>
//         </View>

//         <ScrollView
//           style={styles.cardsContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//         >
//           {dateRange.map((date) => renderDateCard(date))}
//         </ScrollView>
//       </View>
//     </View>
//   );
// };

// /* ---------- Styles ---------- */
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f5f7fa",
//     marginBottom: 55,
//   },
//   calendarHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     padding: 16,
//     backgroundColor: "#fff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e0e0e0",
//   },
//   calendarHeaderText: {
//     fontSize: 18,
//     fontWeight: "600",
//     color: "#002957",
//   },
//   calendarContainer: {
//     backgroundColor: "#fff",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//   },
//   detailsContainer: {
//     flex: 1,
//     padding: 16,
//     backgroundColor: "#f5f7fa",
//   },
//   sectionHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   sectionTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//     flex: 1,
//   },
//   datesCount: {
//     fontSize: 16,
//     fontWeight: "500",
//     color: "#607D8B",
//     backgroundColor: "#E3F2FD",
//     paddingHorizontal: 10,
//     paddingVertical: 4,
//     borderRadius: 12,
//   },
//   cardsContainer: {
//     flex: 1,
//   },
//   card: {
//     borderRadius: 12,
//     backgroundColor: "#fff",
//     elevation: 2,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 3,
//     marginBottom: 12,
//   },
//   todayCard: {
//     borderWidth: 1,
//     borderColor: "#002957",
//   },
//   cardContent: {
//     padding: 16,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//     paddingBottom: 12,
//     borderBottomWidth: 1,
//     borderBottomColor: "#eef2f6",
//   },
//   date: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//   },
//   absentBadge: {
//     backgroundColor: "#FFF3E0",
//     color: "#FF9800",
//   },
//   presentBadge: {
//     backgroundColor: "#E8F5E9",
//     color: "#4CAF50",
//   },
//   partialBadge: {
//     backgroundColor: "#FFF8E1",
//     color: "#FFC107",
//   },
//   leaveBadge: {
//     backgroundColor: "#F3E5F5",
//     color: "#9C27B0",
//   },
//   absentContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 20,
//   },
//   absentText: {
//     fontSize: 16,
//     color: "#FF9800",
//     marginLeft: 10,
//   },
//   leaveContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     paddingVertical: 20,
//   },
//   leaveText: {
//     fontSize: 16,
//     color: "#9C27B0",
//     marginLeft: 10,
//   },
//   timesContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 16,
//   },
//   timeBlock: {
//     alignItems: "center",
//     flex: 1,
//   },
//   timeHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 8,
//   },
//   timeLabel: {
//     fontSize: 14,
//     color: "#002957",
//     marginLeft: 6,
//     fontWeight: "500",
//   },
//   timeValue: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//   },
//   timeSeparator: {
//     width: 40,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   timeLine: {
//     height: 2,
//     width: 20,
//     backgroundColor: "#002957",
//     borderRadius: 1,
//   },
//   durationContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 12,
//     backgroundColor: "#f0f5ff",
//     borderRadius: 8,
//     marginBottom: 12,
//   },
//   durationText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//     marginLeft: 10,
//   },
//   partialText: {
//     color: "#FFC107",
//   },
//   locationToggle: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingVertical: 8,
//   },
//   locationToggleText: {
//     fontSize: 14,
//     fontWeight: "500",
//     color: "#002957",
//   },
//   locationDetails: {
//     // marginTop: 8,
//   },
//   divider: {
//     marginVertical: 8,
//     backgroundColor: "#e0e0e0",
//   },
//   locationSection: {
//     marginBottom: 6,
//   },
//   locationHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     // marginBottom: 4,
//   },
//   locationTitle: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//     marginLeft: 6,
//   },
//   locationText: {
//     fontSize: 14,
//     color: "#546E7A",
//     marginLeft: 24,
//      width: 200,
//     height: 90,
//   },
//   mockedBadge: {
//     backgroundColor: "#FFEBEE",
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     alignSelf: "flex-start",
//     marginLeft: 24,
//   },
//   mockedText: {
//     fontSize: 12,
//     color: "#F44336",
//   },
//   deviceIconSmall: {
//     width: 120,
//     height: 120,
//     // marginLeft: 8,
//   },
//   addressWithDevice: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//   },
// });

// export default Schedule;
