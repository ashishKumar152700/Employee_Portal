// (imports untouched — only additions marked with ✦)
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
  Animated, // ✦ already imported – also used for device-icon animation
  LayoutAnimation,
  Platform,
  UIManager,
  Image, // moved here – was duplicated below
  useWindowDimensions,
} from "react-native";
import { CalendarList } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
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
import { useTabBarClearance } from "../../Component/BottomNav/TabBarTheme";
import { BRAND } from "../../Global/GlassTheme";
import { themedStyles, C } from "../../Global/ThemeContext";

if (Platform.OS === "android") {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ✦  AnimatedDeviceIcon
//    Springs in with a satisfying bounce every time the address card opens.
//    Optionally wrap with lottie-react-native for a richer animation:
//
//      import LottieView from 'lottie-react-native';
//      const mobileAnim    = require('../../assets/lottie/mobile.json');
//      const biometricAnim = require('../../assets/lottie/biometric.json');
//
//      <LottieView source={isMobile ? mobileAnim : biometricAnim}
//                  autoPlay loop={false} style={styles.deviceIconSmall} />
// ─────────────────────────────────────────────────────────────────────────────
interface AnimatedDeviceIconProps {
  source: any;
  style?: object;
}

const AnimatedDeviceIcon: React.FC<AnimatedDeviceIconProps> = ({
  source,
  style,
}) => {
  const scale = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset before each mount so it always plays when the card opens.
    scale.setValue(0);
    rotate.setValue(0);

    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        tension: 120,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(rotate, {
          toValue: -1, // slight left tilt
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(rotate, {
          toValue: 0,
          tension: 200,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const rotateInterp = rotate.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ["-12deg", "0deg", "12deg"],
  });

  return (
    <Animated.Image
      source={source}
      style={[
        style,
        {
          transform: [{ scale }, { rotate: rotateInterp }],
        },
      ]}
      resizeMode="contain"
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────

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

// ✦ Accept refreshTrigger from BottomNavForPunchScreen so we reload whenever
//   the user navigates here after punching.
interface ScheduleProps {
  refreshTrigger?: number;
}

const Schedule: React.FC<ScheduleProps> = ({ refreshTrigger }) => {
  const { contentPaddingBottom } = useTabBarClearance();
  const [items, setItems] = useState<Record<string, Item[]>>({});
  const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<string>(todayISO);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {},
  );
  const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(true);
  const [loadingRange, setLoadingRange] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const todayPunch = useSelector((state: any) => state.todayPunch);
  const dispatch = useDispatch();

  const mobileIcon = require("../../assets/device/mobile.png");
  const biometricIcon = require("../../assets/device/biometric.png");

  const lastLoadTimestamps = useRef<Record<string, number>>({}).current;

  // ─── Keep today's live punch in sync with Redux ───────────────────────────
  // AFTER — map API field names → Item field names
  useEffect(() => {
    if (todayPunch && todayPunch.punchdate) {
      const dayISO = todayPunch.punchdate.split("T")[0];
      setItems((prev) => ({
        ...prev,
        [dayISO]: [
          {
            punchInTime:
              todayPunch.punchintime ?? todayPunch.punchInTime ?? null,
            punchOutTime:
              todayPunch.punchouttime ?? todayPunch.punchOutTime ?? null,
            punchDate: todayPunch.punchdate ?? todayPunch.punchDate,
            duration: todayPunch.duration,
            inactualaddress: todayPunch.inactualaddress,
            outactualaddress: todayPunch.outactualaddress,
            outmocked: todayPunch.outmocked,
            status: todayPunch.status,
            leavestatus: todayPunch.leavestatus,
            indevice: todayPunch.indevice,
            outdevice: todayPunch.outdevice,
          },
        ],
      }));
    }
  }, [todayPunch]);

  // ✦ Auto-refresh when the parent nav tells us the user has just arrived here.
  //   We skip the very first render (refreshTrigger === 0 or undefined) to
  //   avoid a redundant double-fetch on mount.
  useEffect(() => {
    if (!refreshTrigger) return;
    const silentRefresh = async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      await fetchRangeRef.current(todayStr, todayStr);
      for (const monthKey of Array.from(loadedMonthsRef.current)) {
        const [year, month] = monthKey.split("-");
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        await loadItemsForMonthRef.current(monthDate, true);
      }
    };
    silentRefresh();
  }, [refreshTrigger]); // safe — reads always go through refs

  // ─── Helpers ──────────────────────────────────────────────────────────────
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
    outT?: string | null,
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
          dispatch,
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
    [dispatch],
  );

  const loadItemsForMonth = useCallback(
    async (monthDate: Date, force = false) => {
      const monthDateNormalized = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1,
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
        "yyyy-MM-dd",
      );
      const toISO = endOfMonthISO > todayISO ? todayISO : endOfMonthISO;

      await fetchRange(fromISO, toISO);
      setLoadedMonths((prev) => new Set(prev).add(monthKey));
      lastLoadTimestamps[monthKey] = currentTime;
    },
    [loadedMonths, fetchRange],
  );

  // Keep refs always pointing at the latest versions so the
  // refreshTrigger effect never closes over stale callbacks/state.
  const fetchRangeRef = useRef(fetchRange);
  const loadItemsForMonthRef = useRef(loadItemsForMonth);
  const loadedMonthsRef = useRef(loadedMonths);

  useEffect(() => {
    fetchRangeRef.current = fetchRange;
  }, [fetchRange]);
  useEffect(() => {
    loadItemsForMonthRef.current = loadItemsForMonth;
  }, [loadItemsForMonth]);
  useEffect(() => {
    loadedMonthsRef.current = loadedMonths;
  }, [loadedMonths]);

  // ─── Initial load ─────────────────────────────────────────────────────────
  useEffect(() => {
    const loadInitialData = async () => {
      await loadItemsForMonth(new Date(), false);
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedDate && !items[selectedDate]) {
      loadItemsForMonth(parseISO(selectedDate), false);
    }
  }, [selectedDate, items]);

  // ─── Pull-to-refresh ──────────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const todayStr = format(new Date(), "yyyy-MM-dd");
    await fetchRange(todayStr, todayStr);
    for (const monthKey of Array.from(loadedMonths)) {
      const [year, month] = monthKey.split("-");
      const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      await loadItemsForMonth(monthDate, true);
    }
    setRefreshing(false);
  }, [loadItemsForMonth, loadedMonths, fetchRange]);

  // ─── Day press ────────────────────────────────────────────────────────────
  const onDayPress = useCallback(
    async (day: { dateString: string }) => {
      const startDate = parseISO(day.dateString);
      const endDate = new Date();
      if (startDate > endDate) return;

      setLoadingRange(true);
      setSelectedDate(day.dateString);

      if (!calendarCollapsed) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setCalendarCollapsed(true);
      }

      const monthToLoad = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        1,
      );
      await loadItemsForMonth(monthToLoad, true);
      await fetchRange(
        format(startDate, "yyyy-MM-dd"),
        format(endDate, "yyyy-MM-dd"),
      );

      setLoadingRange(false);
    },
    [calendarCollapsed, loadItemsForMonth, fetchRange],
  );

  const toggleCalendar = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCalendarCollapsed(!calendarCollapsed);
  }, [calendarCollapsed]);

  const toggleExpanded = useCallback((date: string) => {
    setExpandedCards((prev) => ({ ...prev, [date]: !prev[date] }));
  }, []);

  // ─── Date range for cards ─────────────────────────────────────────────────
  const dateRange = useMemo(() => {
    if (!selectedDate) return [];
    try {
      const startDate = parseISO(selectedDate);
      const endDate = new Date();
      if (startDate > endDate) return [selectedDate];
      return eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
        format(d, "yyyy-MM-dd"),
      );
    } catch {
      return [];
    }
  }, [selectedDate]);

  // ─── Calendar marks ───────────────────────────────────────────────────────
  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    Object.keys(items).forEach((date) => {
      const dayItems = items[date];
      const hasPunchIn = dayItems.some((item) => item.punchInTime);
      const hasPunchOut = dayItems.some((item) => item.punchOutTime);
      const isLeave = dayItems.some((item) => item.leavestatus);

      let dotColor = "#F44336";
      if (isLeave) dotColor = "#9C27B0";
      else if (hasPunchIn && hasPunchOut) dotColor = "#4CAF50";
      else if (hasPunchIn || hasPunchOut) dotColor = "#FFA500";

      marks[date] = {
        selected: date === selectedDate,
        selectedColor: C.accent,
        disabled: date > todayISO,
      };
      if (dayItems.length > 0 && date <= todayISO) {
        marks[date].marked = true;
        marks[date].dotColor = dotColor;
      }
    });

    if (selectedDate && !marks[selectedDate]) {
      marks[selectedDate] = {
        selected: true,
        selectedColor: C.accent,
        disabled: selectedDate > todayISO,
      };
    }

    return marks;
  }, [items, selectedDate]);

  // ─── Insights for the visible range (UI only) ─────────────────────────────
  const stats = useMemo(() => {
    let present = 0;
    let partial = 0;
    let absent = 0;
    let leave = 0;
    let workedSec = 0;
    let workedDays = 0;
    const inTimes: number[] = [];
    const outTimes: number[] = [];

    dateRange.forEach((date) => {
      const item = items[date]?.[0];
      if (!item) return;
      if (item.leavestatus) {
        leave++;
        return;
      }
      if ((!item.punchInTime && !item.punchOutTime) || item.status === "Absent") {
        absent++;
        return;
      }
      if (item.punchInTime && item.punchOutTime) present++;
      else partial++;

      const inSec = secondsOfDay(item.punchInTime);
      const outSec = secondsOfDay(item.punchOutTime);
      if (inSec != null) inTimes.push(inSec);
      if (outSec != null) outTimes.push(outSec);
      const worked = workedSeconds(date, item.punchInTime, item.punchOutTime);
      if (worked != null) {
        workedSec += worked;
        workedDays++;
      }
    });

    const counted = present + partial + absent;
    const avg = (list: number[]) =>
      list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;

    return {
      present,
      partial,
      absent,
      leave,
      rate: counted ? Math.round(((present + partial) / counted) * 100) : 0,
      workedSec,
      avgWorkedSec: workedDays ? workedSec / workedDays : 0,
      avgIn: avg(inTimes),
      avgOut: avg(outTimes),
    };
  }, [dateRange, items]);

  const quickRanges = useMemo(() => {
    const today = new Date();
    const daysAgo = (n: number) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return format(d, "yyyy-MM-dd");
    };
    const monthStart = format(startOfMonth(today), "yyyy-MM-dd");
    return [
      { key: "today", label: "Today", start: todayISO },
      { key: "7d", label: "Last 7 days", start: daysAgo(6) },
      {
        key: "month",
        label: "This month",
        start: monthStart < minDate ? minDate : monthStart,
      },
      {
        key: "30d",
        label: "Last 30 days",
        start: daysAgo(29) < minDate ? minDate : daysAgo(29),
      },
    ];
  }, []);

  // ─── Card renderer ────────────────────────────────────────────────────────
  const renderDateCard = useCallback(
    (date: string) => {
      const dayItems = items[date] || [];
      const parsed = parseISO(date);
      const dayNum = isValid(parsed) ? format(parsed, "dd") : "--";
      const weekday = isValid(parsed) ? format(parsed, "EEE") : "";
      const monthLabel = isValid(parsed) ? format(parsed, "MMM") : "";
      const fullLabel = isValid(parsed)
        ? format(parsed, "EEEE, dd MMM yyyy")
        : isoToDisplay(date);
      const isToday = date === todayISO;

      const dateBlock = (tone: StatusTone) => (
        <View style={[styles.dateBlock, { backgroundColor: tone.soft }]}>
          <Text style={[styles.dateBlockWeek, { color: tone.color }]}>
            {weekday.toUpperCase()}
          </Text>
          <Text style={[styles.dateBlockDay, { color: tone.color }]}>
            {dayNum}
          </Text>
          <Text style={[styles.dateBlockMonth, { color: tone.color }]}>
            {monthLabel}
          </Text>
        </View>
      );

      if (dayItems.length === 0) {
        return (
          <View key={date} style={styles.dayCard}>
            {dateBlock(TONES.loading)}
            <View style={styles.dayBody}>
              <View style={styles.skeletonLine} />
              <View style={[styles.skeletonLine, { width: "45%" }]} />
            </View>
          </View>
        );
      }

      const item = dayItems[0];

      // Override address for biometric devices.
      const isInBiometric = item?.indevice?.toLowerCase?.() === "biometric";
      const isOutBiometric = item?.outdevice?.toLowerCase?.() === "biometric";
      if (isInBiometric)
        item.inactualaddress = "RishiKirti Technologies Private Limited";
      if (isOutBiometric)
        item.outactualaddress = "RishiKirti Technologies Private Limited";

      const isExpanded = expandedCards[date];
      const isLeave = item.leavestatus;

      if (isLeave) {
        return (
          <View key={date} style={[styles.dayCard, isToday && styles.todayCard]}>
            {dateBlock(TONES.leave)}
            <View style={styles.dayBody}>
              <View style={styles.dayTop}>
                <Text style={styles.dayLabel} numberOfLines={1}>
                  {fullLabel}
                </Text>
                <StatusChip tone={TONES.leave} label={`${item.leavestatus} Leave`} />
              </View>
              <View style={styles.inlineNote}>
                <Icon name="calendar-check" size={16} color={TONES.leave.color} />
                <Text style={[styles.inlineNoteText, { color: TONES.leave.color }]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </View>
        );
      }

      if (
        (!item.punchInTime && !item.punchOutTime) ||
        item.status === "Absent"
      ) {
        return (
          <View key={date} style={[styles.dayCard, isToday && styles.todayCard]}>
            {dateBlock(TONES.absent)}
            <View style={styles.dayBody}>
              <View style={styles.dayTop}>
                <Text style={styles.dayLabel} numberOfLines={1}>
                  {fullLabel}
                </Text>
                <StatusChip tone={TONES.absent} label="Absent" />
              </View>
              <View style={styles.inlineNote}>
                <Icon name="calendar-remove" size={16} color={TONES.absent.color} />
                <Text style={[styles.inlineNoteText, { color: TONES.absent.color }]}>
                  No attendance record
                </Text>
              </View>
            </View>
          </View>
        );
      }

      const isPartial = !item.punchInTime || !item.punchOutTime;
      const tone = isPartial ? TONES.partial : TONES.present;
      const worked = workedSeconds(date, item.punchInTime, item.punchOutTime);
      const fill = worked != null ? Math.min(worked / TARGET_SECONDS, 1) : 0;
      const hasAddress = !!(item.outactualaddress || item.inactualaddress);

      return (
        <View key={date} style={[styles.dayCard, isToday && styles.todayCard]}>
          {dateBlock(tone)}
          <View style={styles.dayBody}>
            <View style={styles.dayTop}>
              <Text style={styles.dayLabel} numberOfLines={1}>
                {isToday ? "Today" : fullLabel}
              </Text>
              <StatusChip
                tone={tone}
                label={isPartial ? "Partial" : item.status || "Present"}
              />
            </View>

            {/* In → Out */}
            <View style={styles.punchRow}>
              <PunchTime
                icon="login-variant"
                label="In"
                time={item.punchInTime}
                device={item.indevice}
              />
              <View style={styles.punchArrow}>
                <View style={styles.punchArrowLine} />
                <Icon name="chevron-right" size={16} color={C.primaryMuted} />
              </View>
              <PunchTime
                icon="logout-variant"
                label="Out"
                time={item.punchOutTime}
                device={item.outdevice}
                pending={!item.punchOutTime}
              />
            </View>

            {/* Hours vs 8h target */}
            <View style={styles.hoursRow}>
              <View style={styles.hoursTrack}>
                {worked != null && (
                  <LinearGradient
                    colors={fill >= 1 ? ["#047857", "#10B981"] : BRAND.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.hoursFill, { width: `${Math.max(fill * 100, 3)}%` }]}
                  />
                )}
              </View>
              <Text style={styles.hoursText}>
                {item.punchInTime && item.punchOutTime
                  ? calcDuration(date, item.punchInTime, item.punchOutTime)
                  : "In progress"}
              </Text>
            </View>

            {item.outmocked && (
              <View style={styles.mockedBadge}>
                <Icon name="alert-outline" size={13} color={C.dangerText} />
                <Text style={styles.mockedText}>
                  Punch-out location was flagged as mocked
                </Text>
              </View>
            )}

            {hasAddress && (
              <TouchableOpacity
                style={styles.locationToggle}
                onPress={() => toggleExpanded(date)}
                activeOpacity={0.7}
              >
                <Icon name="map-marker-radius-outline" size={16} color={BRAND.primaryLight} />
                <Text style={styles.locationToggleText}>
                  {isExpanded ? "Hide Punch Address" : "Show Punch Address"}
                </Text>
                <Icon
                  name={isExpanded ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={BRAND.primaryLight}
                />
              </TouchableOpacity>
            )}

            {isExpanded && hasAddress && (
              <Animated.View style={styles.locationDetails}>
                {item.inactualaddress && (
                  <AddressBlock
                    title="Punch In"
                    address={item.inactualaddress}
                    device={item.indevice}
                    iconSource={
                      item.indevice?.toLowerCase() === "mobile"
                        ? mobileIcon
                        : biometricIcon
                    }
                  />
                )}
                {item.outactualaddress && (
                  <AddressBlock
                    title="Punch Out"
                    address={item.outactualaddress}
                    device={item.outdevice}
                    iconSource={
                      item.outdevice?.toLowerCase() === "mobile"
                        ? mobileIcon
                        : biometricIcon
                    }
                  />
                )}
              </Animated.View>
            )}
          </View>
        </View>
      );
    },
    [items, expandedCards, toggleExpanded],
  );

  // CalendarList pages at full screen width unless told otherwise; inside the
  // padded card that pushes the right-hand column off-screen. Measure the card.
  const { width: windowWidth } = useWindowDimensions();
  const [calendarWidth, setCalendarWidth] = useState(windowWidth - 34);

  const rangeTitle =
    selectedDate === todayISO
      ? "Today's Attendance"
      : `Attendance from ${isoToDisplay(selectedDate)} to Today`;
  const activeQuick = quickRanges.find((r) => r.start === selectedDate)?.key;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView
        key={`scrollview-${selectedDate}`}
        style={styles.cardsContainer}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: contentPaddingBottom },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.accent]}
            tintColor={C.accent}
          />
        }
      >
        {/* ── Insights ─────────────────────────────────────────────────── */}
        <LinearGradient
          colors={C.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <View style={[styles.heroRing, { width: 260, height: 260, top: -130, right: -100 }]} />
            <View style={[styles.heroRing, { width: 160, height: 160, top: -70, right: -40 }]} />
          </View>

          <View style={styles.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroEyebrow}>ATTENDANCE HISTORY</Text>
              <Text style={styles.heroTitle} numberOfLines={2}>
                {rangeTitle}
              </Text>
              <Text style={styles.heroSub}>
                {dateRange.length} day{dateRange.length !== 1 ? "s" : ""} in view
              </Text>
            </View>
            <RateRing rate={stats.rate} />
          </View>

          <View style={styles.countRow}>
            <CountTile label="Present" value={stats.present} dot="#34D399" />
            <CountTile label="Partial" value={stats.partial} dot="#FBBF24" />
            <CountTile label="Absent" value={stats.absent} dot="#F87171" />
            <CountTile label="Leave" value={stats.leave} dot="#C4B5FD" />
          </View>

          <View style={styles.metricRow}>
            <Metric icon="timer-outline" label="Total hours" value={formatHours(stats.workedSec)} />
            <Metric icon="chart-line" label="Avg / day" value={formatHours(stats.avgWorkedSec)} />
            <Metric icon="login-variant" label="Avg in" value={formatClock(stats.avgIn)} />
            <Metric icon="logout-variant" label="Avg out" value={formatClock(stats.avgOut)} />
          </View>
        </LinearGradient>

        {/* ── Range picker ─────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickRow}
        >
          {quickRanges.map((range) => {
            const active = activeQuick === range.key;
            return (
              <TouchableOpacity
                key={range.key}
                onPress={() => onDayPress({ dateString: range.start })}
                activeOpacity={0.8}
                style={[styles.quickChip, active && styles.quickChipActive]}
              >
                <Text style={[styles.quickChipText, active && styles.quickChipTextActive]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity
            onPress={toggleCalendar}
            activeOpacity={0.8}
            style={[
              styles.quickChip,
              styles.quickChipCalendar,
              (!calendarCollapsed || (!activeQuick && selectedDate !== todayISO)) &&
                styles.quickChipActive,
            ]}
          >
            <Icon
              name="calendar-month-outline"
              size={15}
              color={
                !calendarCollapsed || (!activeQuick && selectedDate !== todayISO)
                  ? "#FFFFFF"
                  : BRAND.primary
              }
            />
            <Text
              style={[
                styles.quickChipText,
                (!calendarCollapsed || (!activeQuick && selectedDate !== todayISO)) &&
                  styles.quickChipTextActive,
              ]}
            >
              {calendarCollapsed ? "Pick date" : "Hide calendar"}
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* ── Calendar ─────────────────────────────────────────────────── */}
        {!calendarCollapsed && (
          <Animated.View
            style={styles.calendarContainer}
            onLayout={(e) => {
              // Layout width includes the card's 1px border on each side.
              const measured = Math.floor(e.nativeEvent.layout.width) - 2;
              if (measured > 0 && measured !== calendarWidth) setCalendarWidth(measured);
            }}
          >
            <CalendarList
              key={`calendar-${calendarWidth}`}
              calendarWidth={calendarWidth}
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
                const isDisabled = dateString > todayISO;
                const isTodayCell = dateString === todayISO;

                return (
                  <TouchableOpacity
                    style={[
                      styles.dayCell,
                      isSelected && styles.dayCellSelected,
                      !isSelected && isTodayCell && styles.dayCellToday,
                      { opacity: isDisabled ? 0.35 : 1 },
                    ]}
                    onPress={() => !isDisabled && onDayPress({ dateString })}
                  >
                    <Text
                      style={[
                        styles.dayCellText,
                        isSelected && styles.dayCellTextSelected,
                      ]}
                    >
                      {date.day}
                    </Text>
                    {hasDot && !isSelected && (
                      <View
                        style={[
                          styles.dayCellDot,
                          { backgroundColor: dotColor || BRAND.primary },
                        ]}
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
                calendarBackground: C.surface,
                textSectionTitleColor: BRAND.primaryMuted,
                selectedDayBackgroundColor: BRAND.primary,
                selectedDayTextColor: "#ffffff",
                todayTextColor: C.accent,
                dayTextColor: C.text,
                textDisabledColor: C.textFaint,
                dotColor: C.accent,
                selectedDotColor: "#ffffff",
                arrowColor: C.accent,
                monthTextColor: C.accent,
                textDayFontWeight: "400",
                textMonthFontWeight: "bold",
                textDayHeaderFontWeight: "600",
                textDayFontSize: 14,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 12,
              }}
            />
            <View style={styles.legendRow}>
              <LegendDot color="#4CAF50" label="Present" />
              <LegendDot color="#FFA500" label="Partial" />
              <LegendDot color="#F44336" label="Absent" />
              <LegendDot color={C.violetText} label="Leave" />
            </View>
            <Text style={styles.legendHint}>
              Tap a date to see attendance from that day to today
            </Text>
          </Animated.View>
        )}

        {/* ── Day list ─────────────────────────────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Daily log</Text>
          <Text style={styles.datesCount}>
            {dateRange.length} day{dateRange.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {loadingRange ? (
          <View style={styles.stateBox}>
            <Icon name="progress-clock" size={28} color={BRAND.primaryMuted} />
            <Text style={styles.stateText}>Loading attendance...</Text>
          </View>
        ) : dateRange.length === 0 ? (
          <View style={styles.stateBox}>
            <Icon name="calendar-blank-outline" size={28} color={BRAND.primaryMuted} />
            <Text style={styles.stateText}>No dates to display</Text>
          </View>
        ) : (
          // Selected date first, today last.
          dateRange.map((date) => renderDateCard(date))
        )}
      </ScrollView>
    </View>
  );
};

// ─── Presentational helpers (module level) ─────────────────────────────────

type StatusTone = { color: string; soft: string; chipBg: string };

// Getters so tones resolve against the active light / dark theme on each read.
const TONES: Record<"present" | "partial" | "absent" | "leave" | "loading", StatusTone> = {
  get present() {
    return { color: C.successText, soft: C.successBg, chipBg: C.successBg };
  },
  get partial() {
    return { color: C.warningText, soft: C.warningBg, chipBg: C.warningBg };
  },
  get absent() {
    return { color: C.dangerText, soft: C.dangerBg, chipBg: C.dangerBg };
  },
  get leave() {
    return { color: C.violetText, soft: C.violetBg, chipBg: C.violetBg };
  },
  get loading() {
    return { color: C.textFaint, soft: C.skeleton, chipBg: C.skeleton };
  },
};

const TARGET_SECONDS = 8 * 3600;

function secondsOfDay(time?: string | null): number | null {
  if (!time) return null;
  const match = /^(\d{1,2}):(\d{2})(?::(\d{2}))?/.exec(time);
  if (!match) return null;
  return +match[1] * 3600 + +match[2] * 60 + (match[3] ? +match[3] : 0);
}

// Same parsing rule as calcDuration, but returns seconds for bars/totals.
function workedSeconds(
  dateISO: string,
  inT?: string | null,
  outT?: string | null,
): number | null {
  if (!inT || !outT) return null;
  const into = parseISO(`${dateISO}T${inT}`);
  const outo = parseISO(`${dateISO}T${outT}`);
  if (!isValid(into) || !isValid(outo)) return null;
  const sec = differenceInSeconds(outo, into);
  return sec < 0 ? null : sec;
}

function formatHours(totalSec: number): string {
  if (!totalSec) return "0h";
  const h = Math.floor(totalSec / 3600);
  const m = Math.round((totalSec % 3600) / 60);
  return m ? `${h}h ${m}m` : `${h}h`;
}

function formatClock(sec: number | null): string {
  if (sec == null) return "--:--";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m === 60 ? 59 : m).padStart(2, "0")}`;
}

const shortTime = (time?: string | null) =>
  time && /^\d{1,2}:\d{2}/.test(time) ? time.slice(0, time.indexOf(":") + 3) : time || "--:--";

const deviceIcon = (device?: any) =>
  device?.toLowerCase?.() === "biometric"
    ? "fingerprint"
    : device?.toLowerCase?.() === "mobile"
      ? "cellphone"
      : null;

const StatusChip = ({ tone, label }: { tone: StatusTone; label: string }) => (
  <View style={[styles.statusChip, { backgroundColor: tone.chipBg }]}>
    <View style={[styles.statusChipDot, { backgroundColor: tone.color }]} />
    <Text style={[styles.statusChipText, { color: tone.color }]} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const PunchTime = ({
  icon,
  label,
  time,
  device,
  pending,
}: {
  icon: string;
  label: string;
  time?: string | null;
  device?: any;
  pending?: boolean;
}) => {
  const dIcon = deviceIcon(device);
  return (
    <View style={styles.punchTime}>
      <View style={styles.punchLabelRow}>
        <Icon name={icon} size={13} color={BRAND.primaryMuted} />
        <Text style={styles.punchLabel}>{label}</Text>
        {dIcon && <Icon name={dIcon} size={12} color={BRAND.primaryMuted} />}
      </View>
      <Text style={[styles.punchValue, pending && styles.partialText]}>
        {pending ? "--:--" : shortTime(time)}
      </Text>
    </View>
  );
};

const AddressBlock = ({
  title,
  address,
  device,
  iconSource,
}: {
  title: string;
  address: string;
  device?: any;
  iconSource: any;
}) => (
  <View style={styles.addressBlock}>
    <View style={styles.addressText}>
      <View style={styles.locationHeader}>
        <Icon name="map-marker" size={15} color={C.accent} />
        <Text style={styles.locationTitle}>{title}</Text>
        {device && (
          <View style={styles.devicePill}>
            <Text style={styles.devicePillText}>{String(device)}</Text>
          </View>
        )}
      </View>
      <Text style={styles.locationText}>{address}</Text>
    </View>
    {device && <AnimatedDeviceIcon source={iconSource} style={styles.deviceIconSmall} />}
  </View>
);

const RateRing = ({ rate }: { rate: number }) => (
  <View style={styles.rateRing}>
    <View style={styles.rateInner}>
      <Text style={styles.rateValue}>{rate}%</Text>
      <Text style={styles.rateLabel}>attendance</Text>
    </View>
  </View>
);

const CountTile = ({ label, value, dot }: { label: string; value: number; dot: string }) => (
  <View style={styles.countTile}>
    <Text style={styles.countValue}>{value}</Text>
    <View style={styles.countLabelRow}>
      <View style={[styles.countDot, { backgroundColor: dot }]} />
      <Text style={styles.countLabel}>{label}</Text>
    </View>
  </View>
);

const Metric = ({ icon, label, value }: { icon: string; label: string; value: string }) => (
  <View style={styles.metric}>
    <Icon name={icon} size={14} color="#7DD3FC" />
    <Text style={styles.metricValue} numberOfLines={1}>
      {value}
    </Text>
    <Text style={styles.metricLabel} numberOfLines={1}>
      {label}
    </Text>
  </View>
);

const LegendDot = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendDot, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

/* ---------- Styles ---------- */
const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  cardsContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },

  // Hero / insights
  hero: {
    borderRadius: 24,
    padding: 16,
    overflow: "hidden",
    elevation: 6,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 18,
  },
  heroRing: {
    position: "absolute",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.14)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#7DD3FC",
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 4,
  },
  heroSub: {
    fontSize: 12,
    color: "rgba(255,255,255,0.7)",
    marginTop: 3,
  },
  rateRing: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 4,
    borderColor: "#7DD3FC",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    backgroundColor: "rgba(125, 211, 252, 0.08)",
  },
  rateInner: {
    alignItems: "center",
  },
  rateValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  rateLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.7)",
    letterSpacing: 0.4,
  },
  countRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  countTile: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  countValue: {
    fontSize: 19,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  countLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  countDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  countLabel: {
    fontSize: 10.5,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  metricRow: {
    flexDirection: "row",
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(125, 211, 252, 0.25)",
  },
  metric: {
    flex: 1,
    alignItems: "center",
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 3,
    fontVariant: ["tabular-nums"],
  },
  metricLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    marginTop: 1,
  },

  // Quick ranges
  quickRow: {
    gap: 8,
    paddingVertical: 14,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  quickChipCalendar: {
    borderStyle: "dashed",
    borderColor: c.borderStrong,
  },
  quickChipActive: {
    backgroundColor: BRAND.primary,
    borderColor: c.accent,
    borderStyle: "solid",
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: c.accent,
  },
  quickChipTextActive: {
    color: "#FFFFFF",
  },

  // Calendar
  calendarContainer: {
    backgroundColor: c.surface,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    paddingBottom: 12,
  },
  dayCell: {
    width: 34,
    height: 34,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  dayCellSelected: {
    backgroundColor: BRAND.primary,
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: BRAND.primaryLight,
  },
  dayCellText: {
    color: c.text,
    fontSize: 14,
  },
  dayCellTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayCellDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 1,
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    gap: 14,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11.5,
    color: BRAND.inkSoft,
    fontWeight: "600",
  },
  legendHint: {
    fontSize: 11,
    color: BRAND.inkSoft,
    textAlign: "center",
    marginTop: 8,
  },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.ink,
    flex: 1,
  },
  datesCount: {
    fontSize: 12,
    fontWeight: "700",
    color: c.accent,
    backgroundColor: BRAND.primaryFaint,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: "hidden",
  },
  stateBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  stateText: {
    fontSize: 14,
    color: BRAND.inkSoft,
  },

  // Day card
  dayCard: {
    flexDirection: "row",
    backgroundColor: c.surface,
    borderRadius: 18,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 1,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  todayCard: {
    borderWidth: 1.5,
    borderColor: "rgba(0, 86, 160, 0.5)",
  },
  dateBlock: {
    width: 56,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  dateBlockWeek: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  dateBlockDay: {
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 26,
  },
  dateBlockMonth: {
    fontSize: 10.5,
    fontWeight: "600",
  },
  dayBody: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  dayTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dayLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.ink,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    maxWidth: 130,
  },
  statusChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusChipText: {
    fontSize: 11,
    fontWeight: "700",
    flexShrink: 1,
  },
  inlineNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  inlineNoteText: {
    fontSize: 13,
    fontWeight: "600",
  },
  skeletonLine: {
    height: 10,
    width: "70%",
    borderRadius: 5,
    backgroundColor: c.surfaceAlt,
    marginVertical: 5,
  },
  punchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  punchTime: {
    flex: 1,
  },
  punchLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  punchLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: BRAND.inkSoft,
  },
  punchValue: {
    fontSize: 17,
    fontWeight: "800",
    color: BRAND.ink,
    marginTop: 1,
    fontVariant: ["tabular-nums"],
  },
  partialText: {
    color: c.warningText,
  },
  punchArrow: {
    flexDirection: "row",
    alignItems: "center",
    width: 44,
    marginHorizontal: 4,
  },
  punchArrowLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: c.primaryFaint,
  },
  hoursRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  hoursTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: c.primaryFaint,
    overflow: "hidden",
  },
  hoursFill: {
    height: "100%",
    borderRadius: 3,
  },
  hoursText: {
    fontSize: 11.5,
    fontWeight: "700",
    color: c.accent,
    fontVariant: ["tabular-nums"],
  },
  mockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: c.dangerBg,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: 8,
  },
  mockedText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: c.dangerText,
  },
  locationToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    marginTop: 8,
    paddingVertical: 4,
  },
  locationToggleText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: BRAND.primaryLight,
  },
  locationDetails: {
    marginTop: 4,
    gap: 8,
  },
  addressBlock: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    backgroundColor: c.surfaceAlt,
  },
  addressText: {
    flex: 1,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: c.accent,
  },
  devicePill: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    backgroundColor: BRAND.primaryFaint,
  },
  devicePillText: {
    fontSize: 10,
    fontWeight: "700",
    color: c.accent,
    textTransform: "capitalize",
  },
  locationText: {
    fontSize: 12.5,
    color: c.textSoft,
    lineHeight: 18,
    marginTop: 4,
  },
  deviceIconSmall: {
    width: 52,
    height: 52,
    marginLeft: 8,
  },
}));

export default Schedule;

// // (imports untouched)
// import React, {
//   useState,
//   useEffect,
//   useCallback,
//   useMemo,
//   useRef,
// } from "react";
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

// // ─────────────────────────────────────────────────────────────────────────────
// // ✦  AnimatedDeviceIcon
// //    Springs in with a satisfying bounce every time the address card opens.
// //    Optionally wrap with lottie-react-native for a richer animation:
// //
// //      import LottieView from 'lottie-react-native';
// //      const mobileAnim    = require('../../assets/lottie/mobile.json');
// //      const biometricAnim = require('../../assets/lottie/biometric.json');
// //
// //      <LottieView source={isMobile ? mobileAnim : biometricAnim}
// //                  autoPlay loop={false} style={styles.deviceIconSmall} />
// // ─────────────────────────────────────────────────────────────────────────────
// interface AnimatedDeviceIconProps {
//   source: any;
//   style?: object;
// }

// const AnimatedDeviceIcon: React.FC<AnimatedDeviceIconProps> = ({
//   source,
//   style,
// }) => {
//   const scale = useRef(new Animated.Value(0)).current;
//   const rotate = useRef(new Animated.Value(0)).current;

//   useEffect(() => {
//     // Reset before each mount so it always plays when the card opens.
//     scale.setValue(0);
//     rotate.setValue(0);

//     Animated.parallel([
//       Animated.spring(scale, {
//         toValue: 1,
//         tension: 120,
//         friction: 7,
//         useNativeDriver: true,
//       }),
//       Animated.sequence([
//         Animated.timing(rotate, {
//           toValue: -1, // slight left tilt
//           duration: 120,
//           useNativeDriver: true,
//         }),
//         Animated.spring(rotate, {
//           toValue: 0,
//           tension: 200,
//           friction: 10,
//           useNativeDriver: true,
//         }),
//       ]),
//     ]).start();
//   }, []);

//   const rotateInterp = rotate.interpolate({
//     inputRange: [-1, 0, 1],
//     outputRange: ["-12deg", "0deg", "12deg"],
//   });

//   return (
//     <Animated.Image
//       source={source}
//       style={[
//         style,
//         {
//           transform: [{ scale }, { rotate: rotateInterp }],
//         },
//       ]}
//       resizeMode="contain"
//     />
//   );
// };

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

// // ✦ Accept refreshTrigger from BottomNavForPunchScreen so we reload whenever
// //   the user navigates here after punching.
// interface ScheduleProps {
//   refreshTrigger?: number;
// }

// const Schedule: React.FC<ScheduleProps> = ({ refreshTrigger }) => {
//   const [items, setItems] = useState<Record<string, Item[]>>({});
//   const [loadedMonths, setLoadedMonths] = useState<Set<string>>(new Set());
//   const [selectedDate, setSelectedDate] = useState<string>(todayISO);

//   const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
//     {},
//   );
//   const [calendarCollapsed, setCalendarCollapsed] = useState<boolean>(true);

//   const [loadingRange, setLoadingRange] = useState(false);

//   const [refreshing, setRefreshing] = useState(false);
//   const todayPunch = useSelector((state: any) => state.todayPunch);
//   const dispatch = useDispatch();

//   const mobileIcon = require("../../assets/device/mobile.png");
//   const biometricIcon = require("../../assets/device/biometric.png");

//   // ✦ Auto-refresh when the parent nav tells us the user has just arrived here.
//   //   We skip the very first render (refreshTrigger === 0 or undefined) to
//   //   avoid a redundant double-fetch on mount.
//   const isFirstTrigger = useRef(true);
//   useEffect(() => {
//     if (!refreshTrigger) return; // 0 or undefined → ignore
//     if (isFirstTrigger.current) {
//       isFirstTrigger.current = false;
//       return;
//     }
//     // Refresh today + all previously loaded months silently.
//     const silentRefresh = async () => {
//       const todayStr = format(new Date(), "yyyy-MM-dd");
//       await fetchRange(todayStr, todayStr);

//       for (const monthKey of Array.from(loadedMonths)) {
//         const [year, month] = monthKey.split("-");
//         const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
//         await loadItemsForMonth(monthDate, true);
//       }
//     };
//     silentRefresh();
//   }, [refreshTrigger]); // eslint-disable-line react-hooks/exhaustive-deps
//   // (fetchRange / loadItemsForMonth are stable callbacks defined below)

//   useEffect(() => {
//     if (todayPunch && todayPunch.punchdate) {
//       const dayISO = todayPunch.punchdate.split("T")[0];
//       setItems((prev) => ({
//         ...prev,
//         [dayISO]: [todayPunch],
//       }));
//     }
//   }, [todayPunch]);

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
//     outT?: string | null,
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

//   const fetchRange = useCallback(
//     async (fromISO: string, toISO: string) => {
//       try {
//         const data = await calendarservice.CalendarGet(
//           fromISO,
//           toISO,
//           dispatch,
//         );

//         const grouped: Record<string, Item[]> = {};

//         (data?.data ?? data).forEach((row: any) => {
//           const dayISO = row.punchdate
//             ? format(parseISO(row.punchdate), "yyyy-MM-dd")
//             : todayISO;

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
//           const iso = format(d, "yyyy-MM-dd");
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
//     [dispatch],
//   );

//   const loadItemsForMonth = useCallback(
//     async (monthDate: Date, force = false) => {
//       const monthDateNormalized = new Date(
//         monthDate.getFullYear(),
//         monthDate.getMonth(),
//         1,
//       );
//       const monthKey = format(monthDateNormalized, "yyyy-MM");

//       const currentTime = Date.now();
//       if (
//         !force &&
//         loadedMonths.has(monthKey) &&
//         currentTime - (lastLoadTimestamps[monthKey] || 0) < 5000
//       ) {
//         return;
//       }

//       const fromISO = format(startOfMonth(monthDateNormalized), "yyyy-MM-dd");
//       const endOfMonthISO = format(
//         endOfMonth(monthDateNormalized),
//         "yyyy-MM-dd",
//       );
//       const toISO = endOfMonthISO > todayISO ? todayISO : endOfMonthISO;

//       await fetchRange(fromISO, toISO);
//       setLoadedMonths((prev) => new Set(prev).add(monthKey));
//       lastLoadTimestamps[monthKey] = currentTime;
//     },
//     [loadedMonths, fetchRange],
//   );

//   useEffect(() => {
//     const loadInitialData = async () => {
//       const today = new Date();
//       await loadItemsForMonth(today, false);
//     };
//     loadInitialData();
//   }, []);

//   useEffect(() => {
//     if (selectedDate && !items[selectedDate]) {
//       const monthDate = parseISO(selectedDate);
//       loadItemsForMonth(monthDate, false);
//     }
//   }, [selectedDate, items]);

//   const onRefresh = useCallback(async () => {
//     setRefreshing(true);

//     const today = new Date();
//     const todayISO = format(today, "yyyy-MM-dd");

//     await fetchRange(todayISO, todayISO);

//     const monthsToRefresh = Array.from(loadedMonths);
//     for (const monthKey of monthsToRefresh) {
//       const [year, month] = monthKey.split("-");
//       const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
//       await loadItemsForMonth(monthDate, true);
//     }

//     setRefreshing(false);
//   }, [loadItemsForMonth, loadedMonths, fetchRange]);

//   const onDayPress = useCallback(
//     async (day: { dateString: string }) => {
//       console.log("DAY PRESSED:", day.dateString);

//       const startDate = parseISO(day.dateString);

//       const endDate = new Date();
//       if (startDate > endDate) return;

//       setLoadingRange(true); // ⬅ start loading
//       setSelectedDate(day.dateString);

//       if (!calendarCollapsed) {
//         LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//         setCalendarCollapsed(true);
//       }

//       const monthToLoad = new Date(
//         startDate.getFullYear(),
//         startDate.getMonth(),
//         1,
//       );

//       await loadItemsForMonth(monthToLoad, true);

//       await fetchRange(
//         format(startDate, "yyyy-MM-dd"),
//         format(endDate, "yyyy-MM-dd"),
//       );

//       setLoadingRange(false); // ⬅ finish loading
//     },
//     [calendarCollapsed, loadItemsForMonth, fetchRange],
//   );

//   const toggleCalendar = useCallback(() => {
//     LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
//     setCalendarCollapsed(!calendarCollapsed);
//   }, [calendarCollapsed]);

//   const toggleExpanded = useCallback((date: string) => {
//     setExpandedCards((prev) => ({
//       ...prev,
//       [date]: !prev[date],
//     }));
//   }, []);

//   const dateRange = useMemo(() => {
//     if (!selectedDate) return [];

//     try {
//       const startDate = parseISO(selectedDate);
//       const endDate = new Date();
//       if (startDate > endDate) return [selectedDate];

//       return eachDayOfInterval({ start: startDate, end: endDate }).map((d) =>
//         format(d, "yyyy-MM-dd"),
//       );
//       // .reverse();
//     } catch {
//       return [];
//     }
//   }, [selectedDate]); // ⬅ removed items dependency

//   const markedDates = useMemo(() => {
//     const marks: Record<string, any> = {};

//     Object.keys(items).forEach((date) => {
//       const dayItems = items[date];
//       const hasPunchIn = dayItems.some((item) => item.punchInTime);
//       const hasPunchOut = dayItems.some((item) => item.punchOutTime);
//       const isLeave = dayItems.some((item) => item.leavestatus);

//       // Determine status
//       let dotColor = "#F44336"; // Default red (absent)

//       if (isLeave) {
//         dotColor = "#9C27B0";
//       } else if (hasPunchIn && hasPunchOut) {
//         dotColor = "#4CAF50";
//       } else if (hasPunchIn || hasPunchOut) {
//         dotColor = "#FFA500";
//       }

//       marks[date] = {
//         selected: date === selectedDate,
//         selectedColor: "#002957",
//         disabled: date > todayISO,
//       };

//       if (dayItems.length > 0 && date <= todayISO) {
//         marks[date].marked = true;
//         marks[date].dotColor = dotColor;
//       }
//     });

//     if (selectedDate && !marks[selectedDate]) {
//       marks[selectedDate] = {
//         selected: true,
//         selectedColor: "#002957",
//         disabled: selectedDate > todayISO,
//       };
//     }

//     return marks;
//   }, [items, selectedDate]);

//   const renderDateCard = useCallback(
//     (date: string) => {
//       const dayItems = items[date] || [];
//       if (dayItems.length === 0) {
//         return (
//           <Card key={date} style={[styles.card]}>
//             <Card.Content style={styles.cardContent}>
//               <View style={styles.cardHeader}>
//                 <Text style={styles.date}>{isoToDisplay(date)}</Text>
//                 <Badge style={styles.absentBadge}>Loading...</Badge>
//               </View>
//               <View style={styles.absentContainer}>
//                 <Icon name="loading" size={24} color="#999" />
//                 <Text style={styles.absentText}>Loading data...</Text>
//               </View>
//             </Card.Content>
//           </Card>
//         );
//       }

//       const item = dayItems[0];
//       // 🔹 Override punch addresses if device is biometric
//       const isInBiometric = item?.indevice?.toLowerCase?.() === "biometric";
//       const isOutBiometric = item?.outdevice?.toLowerCase?.() === "biometric";

//       if (isInBiometric) {
//         item.inactualaddress = "RishiKirti Technologies Private Limited";
//       }

//       if (isOutBiometric) {
//         item.outactualaddress = "RishiKirti Technologies Private Limited";
//       }

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

//       // Updated: Only show absent when both punch in and punch out are missing
//       if (
//         (!item.punchInTime && !item.punchOutTime) ||
//         item.status === "Absent"
//       ) {
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

//       // Updated: Show as partial if either punch in OR punch out is missing
//       const isPartial = !item.punchInTime || !item.punchOutTime;

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
//                 <Text style={styles.timeValue}>
//                   {item.punchInTime || "--:--"}
//                 </Text>
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
//                   {item.punchOutTime || "--:--"}
//                 </Text>
//               </View>
//             </View>

//             {/* Show duration only when both punch in and punch out exist */}
//             {item.punchInTime && item.punchOutTime && (
//               <View style={styles.durationContainer}>
//                 <Icon name="timer" size={20} color="#002957" />
//                 <Text style={styles.durationText}>
//                   {calcDuration(date, item.punchInTime, item.punchOutTime)}
//                 </Text>
//               </View>
//             )}

//             {(item.outactualaddress || item.inactualaddress) && (
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

//             {isExpanded && (item.outactualaddress || item.inactualaddress) && (
//               <Animated.View style={styles.locationDetails}>
//                 <Divider style={styles.divider} />

//                 {item.inactualaddress && (
//                   <>
//                     <View style={styles.locationSection}>
//                       <View style={styles.locationHeader}>
//                         <Icon name="map-marker" size={18} color="#002957" />
//                         <Text style={styles.locationTitle}>Punch In</Text>
//                       </View>
//                       <View style={styles.addressWithDevice}>
//                         <Text style={styles.locationText}>
//                           {item.inactualaddress}
//                         </Text>
//                         {item.indevice && (
//                           <Image
//                             source={
//                               item.indevice?.toLowerCase() === "mobile"
//                                 ? mobileIcon
//                                 : biometricIcon
//                             }
//                             style={styles.deviceIconSmall}
//                             resizeMode="contain"
//                           />
//                         )}
//                       </View>
//                     </View>
//                     <Divider style={styles.divider} />
//                   </>
//                 )}

//                 {item.outactualaddress && (
//                   <View style={styles.locationSection}>
//                     <View style={styles.locationHeader}>
//                       <Icon name="map-marker" size={18} color="#002957" />
//                       <Text style={styles.locationTitle}>Punch Out</Text>
//                     </View>
//                     <View style={styles.addressWithDevice}>
//                       <Text style={styles.locationText}>
//                         {item.outactualaddress}
//                       </Text>
//                       {item.outdevice && (
//                         <Image
//                           source={
//                             item.outdevice?.toLowerCase() === "mobile"
//                               ? mobileIcon
//                               : biometricIcon
//                           }
//                           style={styles.deviceIconSmall}
//                           resizeMode="contain"
//                         />
//                       )}
//                     </View>
//                   </View>
//                 )}
//               </Animated.View>
//             )}
//           </Card.Content>
//         </Card>
//       );
//     },
//     [items, expandedCards, toggleExpanded],
//   );

//   return (
//     <View style={styles.container}>
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

//       {!calendarCollapsed && (
//         <Animated.View style={styles.calendarContainer}>
//           <CalendarList
//             // key={`calendar-${selectedDate}`}
//             current={selectedDate}
//             minDate={minDate}
//             maxDate={todayISO}
//             onDayPress={onDayPress}
//             markedDates={markedDates}
//             dayComponent={({ date, state }) => {
//               const dateString = date.dateString;
//               const mark = markedDates[dateString];

//               const isSelected = mark?.selected;
//               const hasDot = mark?.marked;
//               const dotColor = mark?.dotColor;

//               // const isDisabled = state === "disabled" || dateString > todayISO;
//               const isDisabled = dateString > todayISO;

//               return (
//                 <TouchableOpacity
//                   style={{
//                     width: 32,
//                     height: 32,
//                     borderRadius: 16,
//                     backgroundColor: isSelected ? "#002957" : "transparent",
//                     justifyContent: "center",
//                     alignItems: "center",
//                     opacity: isDisabled ? 0.4 : 1,
//                   }}
//                   onPress={() => !isDisabled && onDayPress({ dateString })}
//                 >
//                   <Text
//                     style={{
//                       color: isSelected ? "#fff" : "#2d4150",
//                       fontSize: 14,
//                     }}
//                   >
//                     {date.day}
//                   </Text>

//                   {hasDot && !isSelected && (
//                     <View
//                       style={{
//                         width: 6,
//                         height: 6,
//                         borderRadius: 3,
//                         backgroundColor: dotColor || "#002957",
//                         marginTop: 1,
//                       }}
//                     />
//                   )}
//                 </TouchableOpacity>
//               );
//             }}
//             onVisibleMonthsChange={(months) => {
//               const currentTime = Date.now();
//               months.forEach((month) => {
//                 const monthDate = new Date(month.dateString);
//                 const monthKey = format(monthDate, "yyyy-MM");
//                 if (
//                   loadedMonths.has(monthKey) &&
//                   currentTime - (lastLoadTimestamps[monthKey] || 0) < 5000
//                 ) {
//                   return;
//                 }
//                 lastLoadTimestamps[monthKey] = currentTime;
//                 loadItemsForMonth(monthDate);
//               });
//             }}
//             horizontal
//             pagingEnabled
//             pastScrollRange={24}
//             futureScrollRange={12}
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
//             {selectedDate === todayISO
//               ? "Today's Attendance"
//               : `Attendance from ${isoToDisplay(selectedDate)} to Today`}
//           </Text>
//           <Text style={styles.datesCount}>
//             {dateRange.length} day{dateRange.length !== 1 ? "s" : ""}
//           </Text>
//         </View>

//         <ScrollView
//           key={`scrollview-${selectedDate}`}
//           style={styles.cardsContainer}
//           showsVerticalScrollIndicator={false}
//           refreshControl={
//             <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
//           }
//         >
//           {loadingRange ? (
//             <Text style={{ textAlign: "center", padding: 20, color: "#666" }}>
//               Loading attendance...
//             </Text>
//           ) : dateRange.length === 0 ? (
//             <Text style={{ textAlign: "center", padding: 20, color: "#666" }}>
//               No dates to display
//             </Text>
//           ) : (
//             dateRange.map((date) => renderDateCard(date))
//           )}
//         </ScrollView>
//       </View>
//     </View>
//   );
// };

// /* ---------- Styles (UNCHANGED) ---------- */
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
//   locationDetails: {},
//   divider: {
//     marginVertical: 8,
//     backgroundColor: "#e0e0e0",
//   },
//   locationSection: {
//     marginBottom: 2,
//   },
//   locationHeader: {
//     flexDirection: "row",
//     alignItems: "center",
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
//     width: 200,
//     height: 80,
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
//   },
//   addressWithDevice: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//   },
// });

// export default Schedule;
