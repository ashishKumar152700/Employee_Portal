// (imports untouched)
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
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

  // ✔ OPTION C here (as requested)
  const [loadingRange, setLoadingRange] = useState(false);

  const [refreshing, setRefreshing] = useState(false);
  const todayPunch = useSelector((state: any) => state.todayPunch);
  const dispatch = useDispatch();

  const mobileIcon = require("../../assets/device/mobile.png");
  const biometricIcon = require("../../assets/device/biometric.png");

  const lastLoadTimestamps = useRef<Record<string, number>>({}).current;

  useEffect(() => {
    if (todayPunch && todayPunch.punchdate) {
      const dayISO = todayPunch.punchdate.split("T")[0];
      setItems((prev) => ({
        ...prev,
        [dayISO]: [todayPunch],
      }));
    }
  }, [todayPunch]);

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
            ? format(parseISO(row.punchdate), "yyyy-MM-dd")
            : todayISO;

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
          const iso = format(d, "yyyy-MM-dd");
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

  const loadItemsForMonth = useCallback(
    async (monthDate: Date, force = false) => {
      const monthDateNormalized = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      );
      const monthKey = format(monthDateNormalized, "yyyy-MM");

      const currentTime = Date.now();
      if (
        !force &&
        loadedMonths.has(monthKey) &&
        currentTime - (lastLoadTimestamps[monthKey] || 0) < 5000
      ) {
        return;
      }

      const fromISO = format(startOfMonth(monthDateNormalized), "yyyy-MM-dd");
      const endOfMonthISO = format(
        endOfMonth(monthDateNormalized),
        "yyyy-MM-dd"
      );
      const toISO = endOfMonthISO > todayISO ? todayISO : endOfMonthISO;

      await fetchRange(fromISO, toISO);
      setLoadedMonths((prev) => new Set(prev).add(monthKey));
      lastLoadTimestamps[monthKey] = currentTime;
    },
    [loadedMonths, fetchRange]
  );

  useEffect(() => {
    const loadInitialData = async () => {
      const today = new Date();
      await loadItemsForMonth(today, false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate && !items[selectedDate]) {
      const monthDate = parseISO(selectedDate);
      loadItemsForMonth(monthDate, false);
    }
  }, [selectedDate, items]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    const today = new Date();
    const todayISO = format(today, "yyyy-MM-dd");

    await fetchRange(todayISO, todayISO);

    const monthsToRefresh = Array.from(loadedMonths);
    for (const monthKey of monthsToRefresh) {
      const [year, month] = monthKey.split("-");
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      await loadItemsForMonth(monthDate, true);
    }

    setRefreshing(false);
  }, [loadItemsForMonth, loadedMonths, fetchRange]);

  const onDayPress = useCallback(
    async (day: { dateString: string }) => {
      console.log("DAY PRESSED:", day.dateString);

      const startDate = parseISO(day.dateString);

      const endDate = new Date();
      if (startDate > endDate) return;

      setLoadingRange(true); // ⬅ start loading
      setSelectedDate(day.dateString);

      if (!calendarCollapsed) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCalendarCollapsed(true);
      }

      const monthToLoad = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1
      );

      await loadItemsForMonth(monthToLoad, true);

      await fetchRange(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd")
      );

      setLoadingRange(false); // ⬅ finish loading
    },
    [calendarCollapsed, loadItemsForMonth, fetchRange]
  );

  const toggleCalendar = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarCollapsed(!calendarCollapsed);
  }, [calendarCollapsed]);

  const toggleExpanded = useCallback((date: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  }, []);

  const dateRange = useMemo(() => {
    if (!selectedDate) return [];

    try {
      const startDate = parseISO(selectedDate);
      const endDate = new Date();
      if (startDate > endDate) return [selectedDate];

      return eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
        format(d, "yyyy-MM-dd")
      );
      // .reverse();
    } catch {
      return [];
    }
  }, [selectedDate]); // ⬅ removed items dependency

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

      if (dayItems.length > 0 && date <= todayISO) {
        if (hasPunch) {
          marks[date].marked = true;
          marks[date].dotColor = isPartial ? "#FFA500" : "#4CAF50";
        } else if (isLeave) {
          marks[date].marked = true;
          marks[date].dotColor = "#9C27B0";
        } else {
          marks[date].marked = true;
          marks[date].dotColor = "#F44336";
        }
      }
    });

    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: "#002957",
        disabled: selectedDate > todayISO,
      };
    }

    return marks;
  }, [items, selectedDate]);

  const renderDateCard = useCallback(
    (date: string) => {
      const dayItems = items[date] || [];
      if (dayItems.length === 0) {
        return (
          <Card key={date} style={[styles.card]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.cardHeader}>
                <Text style={styles.date}>{isoToDisplay(date)}</Text>
                <Badge style={styles.absentBadge}>Loading...</Badge>
              </View>
              <View style={styles.absentContainer}>
                <Icon name="loading" size={24} color="#999" />
                <Text style={styles.absentText}>Loading data...</Text>
              </View>
            </Card.Content>
          </Card>
        );
      }

      const item = dayItems[0];
      // 🔹 Override punch addresses if device is biometric
      const isInBiometric = item?.indevice?.toLowerCase?.() === "biometric";
      const isOutBiometric = item?.outdevice?.toLowerCase?.() === "biometric";

      if (isInBiometric) {
        item.inactualaddress = "RishiKirti Technologies Private Limited";
      }

      if (isOutBiometric) {
        item.outactualaddress = "RishiKirti Technologies Private Limited";
      }

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

      if (!item.punchInTime || item.status === "Absent") {
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
                <Text style={styles.timeValue}>
                  {item.punchInTime || "--:--"}
                </Text>
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
                  {item.punchOutTime || "--:--"}
                </Text>
              </View>
            </View>

            {!isPartial && (
              <View style={styles.durationContainer}>
                <Icon name="timer" size={20} color="#002957" />
                <Text style={styles.durationText}>
                  {calcDuration(date, item.punchInTime, item.punchOutTime)}
                </Text>
              </View>
            )}

            {(item.outactualaddress || item.inactualaddress) && (
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

            {isExpanded && (item.outactualaddress || item.inactualaddress) && (
              <Animated.View style={styles.locationDetails}>
                <Divider style={styles.divider} />

                {item.inactualaddress && (
                  <>
                    <View style={styles.locationSection}>
                      <View style={styles.locationHeader}>
                        <Icon name="map-marker" size={18} color="#002957" />
                        <Text style={styles.locationTitle}>Punch In</Text>
                      </View>
                      <View style={styles.addressWithDevice}>
                        <Text style={styles.locationText}>
                          {item.inactualaddress}
                        </Text>
                        {item.indevice && (
                          <Image
                            source={
                              item.indevice?.toLowerCase() === "mobile"
                                ? mobileIcon
                                : biometricIcon
                            }
                            style={styles.deviceIconSmall}
                            resizeMode="contain"
                          />
                        )}
                      </View>
                    </View>
                    <Divider style={styles.divider} />
                  </>
                )}

                {item.outactualaddress && (
                  <View style={styles.locationSection}>
                    <View style={styles.locationHeader}>
                      <Icon name="map-marker" size={18} color="#002957" />
                      <Text style={styles.locationTitle}>Punch Out</Text>
                    </View>
                    <View style={styles.addressWithDevice}>
                      <Text style={styles.locationText}>
                        {item.outactualaddress}
                      </Text>
                      {item.outdevice && (
                        <Image
                          source={
                            item.outdevice?.toLowerCase() === "mobile"
                              ? mobileIcon
                              : biometricIcon
                          }
                          style={styles.deviceIconSmall}
                          resizeMode="contain"
                        />
                      )}
                    </View>
                  </View>
                )}
              </Animated.View>
            )}
          </Card.Content>
        </Card>
      );
    },
    [items, expandedCards, toggleExpanded]
  );

  return (
    <View style={styles.container}>
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

      {!calendarCollapsed && (
        <Animated.View style={styles.calendarContainer}>
          <CalendarList
            // key={`calendar-${selectedDate}`}
            current={selectedDate}
            minDate={minDate}
            maxDate={todayISO}
            onDayPress={onDayPress}
            markedDates={markedDates}
            dayComponent={({ date, state }) => {
              const dateString = date.dateString;
              const mark = markedDates[dateString];

              const isSelected = mark?.selected;
              const hasDot = mark?.marked;
              const dotColor = mark?.dotColor;

              // const isDisabled = state === "disabled" || dateString > todayISO;
              const isDisabled = dateString > todayISO;

              return (
                <TouchableOpacity
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: isSelected ? "#002957" : "transparent",
                    justifyContent: "center",
                    alignItems: "center",
                    opacity: isDisabled ? 0.4 : 1,
                  }}
                  onPress={() => !isDisabled && onDayPress({ dateString })}
                >
                  <Text
                    style={{
                      color: isSelected ? "#fff" : "#2d4150",
                      fontSize: 14,
                    }}
                  >
                    {date.day}
                  </Text>

                  {hasDot && !isSelected && (
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: dotColor || "#002957",
                        marginTop: 1,
                      }}
                    />
                  )}
                </TouchableOpacity>
              );
            }}
            onVisibleMonthsChange={(months) => {
              const currentTime = Date.now();
              months.forEach((month) => {
                const monthDate = new Date(month.dateString);
                const monthKey = format(monthDate, "yyyy-MM");
                if (
                  loadedMonths.has(monthKey) &&
                  currentTime - (lastLoadTimestamps[monthKey] || 0) < 5000
                ) {
                  return;
                }
                lastLoadTimestamps[monthKey] = currentTime;
                loadItemsForMonth(monthDate);
              });
            }}
            horizontal
            pagingEnabled
            pastScrollRange={24}
            futureScrollRange={12}
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
            {selectedDate === todayISO
              ? "Today's Attendance"
              : `Attendance from ${isoToDisplay(selectedDate)} to Today`}
          </Text>
          <Text style={styles.datesCount}>
            {dateRange.length} day{dateRange.length !== 1 ? "s" : ""}
          </Text>
        </View>

        <ScrollView
          key={`scrollview-${selectedDate}`}
          style={styles.cardsContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {loadingRange ? (
            <Text style={{ textAlign: "center", padding: 20, color: "#666" }}>
              Loading attendance...
            </Text>
          ) : dateRange.length === 0 ? (
            <Text style={{ textAlign: "center", padding: 20, color: "#666" }}>
              No dates to display
            </Text>
          ) : (
            dateRange.map((date) => renderDateCard(date))
          )}
        </ScrollView>
      </View>
    </View>
  );
};

/* ---------- Styles (UNCHANGED) ---------- */
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
  locationDetails: {},
  divider: {
    marginVertical: 8,
    backgroundColor: "#e0e0e0",
  },
  locationSection: {
    marginBottom: 2,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    height: 80,
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
  },
  addressWithDevice: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
});

export default Schedule;
