import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  submitLeaveApplication,
  getLeaves,
} from "../../Services/Leave/Leave.service";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../Global/Types";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ActivityIndicator } from "react-native";
import { useTabBarClearance } from "../../Component/BottomNav/TabBarTheme";
import { AppDialog, DialogVariant } from "../../Component/Feedback/AppDialog";
import { themedStyles, C } from "../../Global/ThemeContext";

const LeaveApplicationScreen: React.FC = () => {
  const { contentPaddingBottom } = useTabBarClearance();
  const [leaveType, setLeaveType] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("full-day");
  const [reason, setReason] = useState<string>("");
  const [approverId, setApproverId] = useState<number>(0);
  const [applicationDate] = useState<string>(new Date().toISOString());
  const [totalDays, setTotalDays] = useState<number>(1);
  const [isCalendarModalVisible, setIsCalendarModalVisible] =
    useState<boolean>(false);

  const [userDOJ, setUserDOJ] = useState<Date | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation<LoginScreenNavigationProp>();
  type LoginScreenNavigationProp = NativeStackNavigationProp<
    RootStackParamList,
    "MyLeaveScreen"
  >;
  const [selectedStartDate, setSelectedStartDate] = useState<string | null>(
    null,
  );
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null);
  const [markedDates, setMarkedDates] = useState({});

  const leave_Details = useSelector((state: any) => state.leaveDetails);
  const managerDetailsSelector = useSelector((state: any) => state.managerInfo);

  const availableLeaveTypes = leave_Details?.leaveTypes || [];

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "info", // 'success', 'error', 'warning', 'info'
    buttons: null as any,
  });

  const insets = useSafeAreaInsets();
  const [reasonFocused, setReasonFocused] = useState(false);
  const calendarTheme = useMemo(
    () => ({
      calendarBackground: "transparent",
      todayTextColor: C.accent,
      dayTextColor: C.text,
      textDisabledColor: C.textFaint,
      monthTextColor: C.text,
      textMonthFontWeight: "800" as const,
      textDayFontWeight: "600" as const,
      textSectionTitleColor: C.textSoft,
      arrowColor: C.accent,
    }),
    []
  );

  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");
  const dispatch = useDispatch();

  const selectedLeave = availableLeaveTypes.find(
    (item: any) => item.leaveCode === leaveType,
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    console.log("leave_Details updated", leave_Details);
  }, [leave_Details]);

  //   useEffect(() => {
  //     if (availableLeaveTypes.length > 0 && !leaveType) {
  //       setLeaveType(availableLeaveTypes[0].leaveCode);
  //     }
  //   }, [availableLeaveTypes]);
  useEffect(() => {
    if (availableLeaveTypes.length > 0 && !leaveType) {
      const firstEligible = availableLeaveTypes.find(
        (item: any) => item.eligible,
      );

      setLeaveType(
        firstEligible
          ? firstEligible.leaveCode
          : availableLeaveTypes[0].leaveCode,
      );
    }
  }, [availableLeaveTypes]);

  const resetForm = () => {
    // setLeaveType(availableLeaveTypes[0].leaveCode);
    setLeaveType(
      availableLeaveTypes.length > 0 ? availableLeaveTypes[0].leaveCode : "",
    );
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setReason("");
    setApproverId(0);
    setTotalDays(0);
    setSelectedOption("full-day");

    setAlertVisible(false);
  };

  useEffect(() => {
    getUserDetails();
  }, []);

  const isLeaveTypeAvailable = (leaveCode: string) => {
    const leave = availableLeaveTypes.find(
      (item: any) => item.leaveCode === leaveCode,
    );

    return (leave?.remaining || 0) > 0;
  };

  async function getUserDetails() {
    try {
      const userDetailsString = await AsyncStorage.getItem("user");
      if (userDetailsString) {
        const userDetails = JSON.parse(userDetailsString);
        const joiningDate = new Date(userDetails.joiningdate);
        setUserDOJ(joiningDate);
      }
    } catch (error) {
      console.error("Error retrieving user details:", error);
    }
  }

  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, []),
  );

  const todayISO = new Date().toISOString().split("T")[0];

  const onDayPress = (day: any) => {
    const date = day.dateString;

    if (!selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      setMarkedDates({
        [date]: {
          startingDay: true,
          endingDay: true,
          color: C.accent,
          textColor: "#FFFFFF",
        },
      });
      return;
    }

    if (selectedStartDate && !selectedEndDate) {
      const range = createMarkedRange(selectedStartDate, date);
      setSelectedEndDate(date);
      setMarkedDates(range);
      return;
    }

    // reset if both already picked
    setSelectedStartDate(date);
    setSelectedEndDate(null);
    setMarkedDates({
      [date]: {
        startingDay: true,
        endingDay: true,
        color: C.accent,
        textColor: "#FFFFFF",
      },
    });
  };

  const createMarkedRange = (start: string, end: string) => {
    let range: any = {};
    let startTime = new Date(start).getTime();
    let endTime = new Date(end).getTime();

    if (startTime > endTime) {
      [startTime, endTime] = [endTime, startTime];
      [start, end] = [end, start];
    }

    let current = startTime;
    while (current <= endTime) {
      const date = new Date(current).toISOString().split("T")[0];
      range[date] = {
        color:
          current === startTime || current === endTime ? C.primary : C.primaryLight,
        textColor: "#FFFFFF",
        startingDay: date === start,
        endingDay: date === end,
      };
      current += 86400000;
    }
    return range;
  };

  const validateLeaveApplication = () => {
    if (!selectedStartDate) {
      return {
        valid: false,
        title: "Missing Information",
        message: "Please select a start date.",
      };
    }

    if (!reason.trim()) {
      return {
        valid: false,
        title: "Missing Information",
        message: "Reason for leave is required.",
      };
    }

    if (!isLeaveTypeAvailable(leaveType)) {
      return {
        valid: false,
        title: "No Leaves Available",
        // message: `You have no ${leaveType} leaves remaining. Please select another leave type.`,
        message: `You have no ${
          selectedLeave?.title ?? "selected"
        } leave balance remaining.`,
      };
    }

    if (selectedLeave && !selectedLeave.eligible) {
      return {
        valid: false,
        title: "Leave Not Available",
        message: `This leave will be available after ${selectedLeave.daysRemainingForEligibility} day(s).`,
      };
    }

    return {
      valid: true,
    };
  };

  const handleApplyLeave = async () => {
    const validation = validateLeaveApplication();

    if (!validation.valid) {
      setAlertConfig({
        title: validation.title!,
        message: validation.message!,
        type: "warning",
        buttons: null,
      });

      setAlertVisible(true);
      return;
    }

    console.log("leaveType State =>", leaveType);
    console.log("selectedLeave =>", selectedLeave);
    const leaveApplication = {
      leavetype: leaveType,
      leavestart: selectedStartDate
        ? format(selectedStartDate, "dd/MM/yyyy")
        : "",
      leaveend: selectedEndDate
        ? format(selectedEndDate, "dd/MM/yyyy")
        : selectedStartDate
          ? format(selectedStartDate, "dd/MM/yyyy")
          : "",
      leavepart: selectedOption,
      reason: reason.trim(),
      approver: managerDetailsSelector.id,
    };

    console.log("Leave Application:", leaveApplication);

    setLoaderMessage("Submitting your leave application...");
    setLoaderVisible(true);

    try {
      const response = await submitLeaveApplication(leaveApplication);

      if (response.status === 200) {
        await getLeaves(dispatch);
        setAlertConfig({
          title: "Success!",
          message:
            response.message || "Leave application submitted successfully!",
          type: "success",
          buttons: [
            {
              text: "OK",
              onPress: () => {
                resetForm();
              },
            },
          ],
        });
      } else {
        setAlertConfig({
          title: "Submission Failed",
          message: response.message || "Failed to submit leave application.",
          type: "error",
          buttons: null,
        });
      }

      setAlertVisible(true);
    } catch (error: any) {
      console.error("Leave Apply Error:", error);

      setAlertConfig({
        title: "Error",
        message:
          error?.response?.data?.message ||
          error?.message ||
          "An error occurred while submitting the leave application.",
        type: "error",
        buttons: null,
      });

      setAlertVisible(true);
    } finally {
      setLoaderVisible(false);
    }
  };

  const calculateTotalDays = () => {
    if (selectedStartDate && !selectedEndDate) {
      const leavepart = selectedOption === "full-day" ? 1 : 0.5;
      setTotalDays(leavepart);
    } else if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      const difference =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      setTotalDays(difference < 0 ? 0 : difference);
    } else {
      setTotalDays(0);
    }
  };

  React.useEffect(() => {
    calculateTotalDays();
  }, [selectedStartDate, selectedEndDate, leaveType, selectedOption]);

  const handleConfirmDates = () => {
    setIsCalendarModalVisible(false);
  };

  const showDateRange = () => {
    if (!selectedStartDate) return "Select Dates";

    if (selectedEndDate) {
      return `${format(selectedStartDate, "dd-MM-yyyy")} to ${format(
        selectedEndDate,
        "dd-MM-yyyy",
      )}`;
    } else {
      return format(selectedStartDate, "dd-MM-yyyy");
    }
  };

  const singleDay = !!selectedStartDate && !selectedEndDate;
  const dayOptions = [
    { label: "Full day", value: "full-day", icon: "brightness-7" },
    ...(selectedLeave?.halfDayAllowed
      ? [
          { label: "First half", value: "first-half", icon: "brightness-5" },
          { label: "Second half", value: "second-half", icon: "brightness-4" },
        ]
      : []),
  ];
  const approverName = managerDetailsSelector?.name || "Not assigned";
  const approverInitials =
    approverName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: contentPaddingBottom }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Hero ──────────────────────────────────────────────── */}
        <LinearGradient
          colors={C.heroGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.hero}
        >
          <View pointerEvents="none" style={styles.heroRing} />
          <Text style={styles.heroEyebrow}>NEW REQUEST</Text>
          <Text style={styles.heroTitle}>Apply for leave</Text>
          <View style={styles.heroRow}>
            <View style={styles.heroChip}>
              <View style={styles.approverAvatar}>
                <Text style={styles.approverInitials}>{approverInitials}</Text>
              </View>
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.heroChipLabel}>Approver</Text>
                <Text style={styles.heroChipValue} numberOfLines={1}>
                  {approverName}
                </Text>
              </View>
            </View>
            <View style={styles.heroChip}>
              <Icon name="today" size={18} color="#7DD3FC" />
              <View>
                <Text style={styles.heroChipLabel}>Applied on</Text>
                <Text style={styles.heroChipValue}>
                  {format(new Date(applicationDate), "dd MMM yyyy")}
                </Text>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* ── Leave type ────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Leave type</Text>
          {selectedLeave && (
            <Text style={styles.sectionHint}>
              {selectedLeave.remaining} day{selectedLeave.remaining === 1 ? "" : "s"} available
            </Text>
          )}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.typeRow}
        >
          {availableLeaveTypes.map((item: any) => {
            const selected = leaveType === item.leaveCode;
            const empty = (item.remaining || 0) <= 0;
            const locked = !item.eligible;
            const card = (
              <>
                <View style={[styles.typeIcon, selected && styles.typeIconSelected]}>
                  <Icon
                    name={locked ? "lock-outline" : getLeaveIcon(item.leaveCode)}
                    size={20}
                    color={selected ? "#FFFFFF" : locked ? C.textFaint : C.accent}
                  />
                </View>
                <Text
                  style={[styles.typeTitle, selected && styles.typeTitleSelected]}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <View style={styles.typeBalanceRow}>
                  <Text
                    style={[
                      styles.typeBalance,
                      selected && styles.typeTextOnFill,
                      empty && !selected && styles.typeBalanceEmpty,
                    ]}
                  >
                    {item.remaining}
                  </Text>
                  <Text style={[styles.typeBalanceLabel, selected && styles.typeSubOnFill]}>
                    {" "}left
                  </Text>
                </View>
                {locked ? (
                  <Text style={styles.typeNote} numberOfLines={2}>
                    Available in {item.daysRemainingForEligibility} day(s)
                  </Text>
                ) : empty ? (
                  <Text style={[styles.typeNote, styles.typeNoteWarn, selected && styles.typeSubOnFill]}>
                    No balance
                  </Text>
                ) : (
                  <Text style={[styles.typeNote, selected && styles.typeSubOnFill]}>
                    {item.leaveCode}
                  </Text>
                )}
              </>
            );
            return (
              <TouchableOpacity
                key={item.leaveCode}
                disabled={locked}
                activeOpacity={0.85}
                onPress={() => {
                  if (!item.eligible) return;

                  setLeaveType(item.leaveCode);
                  setSelectedOption("full-day");
                }}
                style={[styles.typeCard, locked && styles.typeCardLocked, empty && !selected && styles.typeCardEmpty]}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: locked }}
              >
                {selected ? (
                  <LinearGradient
                    colors={C.primaryGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.typeCardInner}
                  >
                    {card}
                  </LinearGradient>
                ) : (
                  <View style={styles.typeCardInner}>{card}</View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Dates ─────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Dates</Text>
          {totalDays > 0 && (
            <View style={styles.daysPill}>
              <Icon name="event-available" size={14} color={C.accent} />
              <Text style={styles.daysPillText}>
                {totalDays} day{totalDays !== 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          onPress={() => setIsCalendarModalVisible(true)}
          activeOpacity={0.85}
          style={styles.dateCard}
        >
          <DateTile label="From" iso={selectedStartDate} />
          <View style={styles.dateArrow}>
            <Icon name="arrow-forward" size={18} color={C.textFaint} />
          </View>
          <DateTile
            label="To"
            iso={selectedEndDate || selectedStartDate}
            muted={!selectedEndDate}
          />
          <View style={styles.dateEdit}>
            <Icon name="edit-calendar" size={20} color={C.accent} />
          </View>
        </TouchableOpacity>

        {singleDay && (
          <View style={styles.dayTypeRow}>
            {dayOptions.map((opt) => {
              const active = selectedOption === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  activeOpacity={0.85}
                  onPress={() => {
                    setSelectedOption(opt.value);
                    setTotalDays(opt.value === "full-day" ? 1 : 0.5);
                  }}
                  style={[styles.dayTypeChip, active && styles.dayTypeChipActive]}
                >
                  <Icon
                    name={opt.icon}
                    size={16}
                    color={active ? "#FFFFFF" : C.textSoft}
                  />
                  <Text style={[styles.dayTypeText, active && styles.dayTypeTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Reason ────────────────────────────────────────────── */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Reason</Text>
          <Text style={styles.sectionHint}>{reason.trim().length}/300</Text>
        </View>
        <View style={[styles.reasonBox, reasonFocused && styles.reasonBoxFocused]}>
          <TextInput
            style={styles.reasonInput}
            placeholder="Briefly tell your manager why you need this leave"
            placeholderTextColor={C.placeholder}
            value={reason}
            onChangeText={setReason}
            onFocus={() => setReasonFocused(true)}
            onBlur={() => setReasonFocused(false)}
            maxLength={300}
            multiline
            numberOfLines={4}
          />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.suggestRow}
        >
          {REASON_SUGGESTIONS.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setReason(s)}
              activeOpacity={0.8}
              style={[styles.suggestChip, reason === s && styles.suggestChipActive]}
            >
              <Text style={[styles.suggestText, reason === s && styles.suggestTextActive]}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ── Summary + submit ──────────────────────────────────── */}
        <View style={styles.summary}>
          <View style={styles.summaryIcon}>
            <Icon name="fact-check" size={20} color={C.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.summaryTitle} numberOfLines={1}>
              {selectedLeave?.title || "Choose a leave type"}
              {totalDays > 0 ? ` · ${totalDays} day${totalDays !== 1 ? "s" : ""}` : ""}
            </Text>
            <Text style={styles.summaryText} numberOfLines={1}>
              {selectedStartDate
                ? `${showDateRange()}${singleDay && selectedOption !== "full-day" ? ` · ${dayOptions.find((o) => o.value === selectedOption)?.label}` : ""}`
                : "Pick your dates to continue"}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleApplyLeave} activeOpacity={0.9} style={styles.submitTouch}>
          <LinearGradient
            colors={C.primaryGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submit}
          >
            <Icon name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>Submit leave request</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Date range sheet ────────────────────────────────────── */}
      <Modal
        visible={isCalendarModalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setIsCalendarModalVisible(false)}
      >
        <View style={styles.sheetBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setIsCalendarModalVisible(false)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Select dates</Text>
                <Text style={styles.sheetHint}>
                  {!selectedStartDate
                    ? "Tap your first day of leave"
                    : !selectedEndDate
                      ? "Tap the last day, or confirm for a single day"
                      : "Tap a date to start over"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsCalendarModalVisible(false)}
                style={styles.sheetClose}
                accessibilityLabel="Close"
              >
                <Icon name="close" size={20} color={C.accent} />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={onDayPress}
              markingType="period"
              markedDates={markedDates}
              minDate={todayISO}
              theme={calendarTheme}
            />

            <View style={styles.sheetSummary}>
              <Icon name="date-range" size={18} color={C.accent} />
              <Text style={styles.sheetSummaryText}>
                {selectedStartDate
                  ? `${showDateRange()} · ${totalDays} day${totalDays !== 1 ? "s" : ""}`
                  : "No dates selected"}
              </Text>
            </View>

            <View style={styles.sheetActions}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedStartDate(null);
                  setSelectedEndDate(null);
                  setMarkedDates({});
                }}
                style={styles.sheetSecondary}
              >
                <Text style={styles.sheetSecondaryText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDates}
                disabled={!selectedStartDate}
                style={[styles.sheetPrimaryTouch, !selectedStartDate && { opacity: 0.5 }]}
              >
                <LinearGradient
                  colors={C.primaryGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.sheetPrimary}
                >
                  <Text style={styles.sheetPrimaryText}>Confirm dates</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <AppDialog
        visible={loaderVisible}
        variant="loading"
        title="Applying for leave"
        message={loaderMessage || "Submitting..."}
      />

      <AppDialog
        visible={alertVisible}
        variant={alertConfig.type as DialogVariant}
        title={alertConfig.title}
        message={alertConfig.message}
        primaryLabel={alertConfig.buttons?.[alertConfig.buttons.length - 1]?.text || "OK"}
        onPrimary={
          alertConfig.buttons?.[alertConfig.buttons.length - 1]?.onPress ||
          (() => setAlertVisible(false))
        }
        secondaryLabel={
          alertConfig.buttons && alertConfig.buttons.length > 1
            ? alertConfig.buttons[0].text
            : undefined
        }
        onSecondary={alertConfig.buttons && alertConfig.buttons.length > 1 ? alertConfig.buttons[0].onPress : undefined}
      />
    </Animated.View>
  );
};

// ─── Helpers (module level) ────────────────────────────────────────────────
const REASON_SUGGESTIONS = [
  "Personal work",
  "Not feeling well",
  "Medical appointment",
  "Family function",
  "Travel",
  "Emergency",
];

const getLeaveIcon = (leaveCode: string) => {
  switch (leaveCode) {
    case "PL":
      return "payments";
    case "CL":
      return "weekend";
    case "SL":
      return "local-hospital";
    case "EL":
      return "work";
    case "ML":
      return "pregnant-woman";
    case "PTL":
      return "man";
    case "BL":
      return "groups";
    case "CO":
      return "cached";
    case "OH":
      return "celebration";
    default:
      return "event";
  }
};

const DateTile = ({ label, iso, muted }: { label: string; iso: string | null; muted?: boolean }) => {
  const date = iso ? new Date(`${iso}T00:00:00`) : null;
  return (
    <View style={styles.dateTile}>
      <Text style={styles.dateLabel}>{label}</Text>
      {date ? (
        <>
          <Text style={[styles.dateDay, muted && styles.dateMuted]}>{format(date, "dd")}</Text>
          <Text style={[styles.dateMonth, muted && styles.dateMuted]}>
            {format(date, "MMM, EEE")}
          </Text>
        </>
      ) : (
        <>
          <Text style={[styles.dateDay, styles.datePlaceholder]}>--</Text>
          <Text style={styles.dateMonth}>Select</Text>
        </>
      )}
    </View>
  );
};

const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scroll: {
    padding: 16,
  },

  // Hero
  hero: {
    borderRadius: 24,
    padding: 18,
    overflow: "hidden",
  },
  heroRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    top: -100,
    right: -60,
    borderWidth: 1,
    borderColor: "rgba(125, 211, 252, 0.16)",
  },
  heroEyebrow: {
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "#7DD3FC",
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  heroRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  heroChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  approverAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(125, 211, 252, 0.2)",
  },
  approverInitials: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  heroChipLabel: {
    fontSize: 10.5,
    color: "rgba(255, 255, 255, 0.65)",
    fontWeight: "600",
  },
  heroChipValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    marginTop: 1,
  },

  // Sections
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: c.text,
  },
  sectionHint: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSoft,
  },

  // Leave type cards
  typeRow: {
    gap: 10,
    paddingRight: 4,
  },
  typeCard: {
    width: 128,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: c.surface,
    overflow: "hidden",
  },
  typeCardLocked: {
    opacity: 0.6,
  },
  typeCardEmpty: {
    borderColor: c.warningBg,
  },
  typeCardInner: {
    padding: 12,
    minHeight: 142,
  },
  typeIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primaryFaint,
  },
  typeIconSelected: {
    backgroundColor: "rgba(255, 255, 255, 0.18)",
  },
  typeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: c.text,
    marginTop: 10,
    minHeight: 34,
  },
  typeTitleSelected: {
    color: "#FFFFFF",
  },
  typeBalanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 4,
  },
  typeBalance: {
    fontSize: 22,
    fontWeight: "800",
    color: c.accent,
  },
  typeBalanceEmpty: {
    color: c.warningText,
  },
  typeTextOnFill: {
    color: "#FFFFFF",
  },
  typeBalanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: c.textSoft,
  },
  typeSubOnFill: {
    color: "rgba(255, 255, 255, 0.75)",
  },
  typeNote: {
    fontSize: 11,
    fontWeight: "600",
    color: c.textFaint,
    marginTop: 4,
  },
  typeNoteWarn: {
    color: c.warningText,
  },

  // Dates
  daysPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: c.primaryFaint,
  },
  daysPillText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: c.accent,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 20,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  dateTile: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    color: c.textFaint,
    textTransform: "uppercase",
  },
  dateDay: {
    fontSize: 28,
    fontWeight: "800",
    color: c.text,
    marginTop: 2,
  },
  dateMonth: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.textSoft,
  },
  dateMuted: {
    color: c.textFaint,
  },
  datePlaceholder: {
    color: c.textFaint,
  },
  dateArrow: {
    paddingHorizontal: 10,
  },
  dateEdit: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primaryFaint,
  },
  dayTypeRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  dayTypeChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  dayTypeChipActive: {
    backgroundColor: c.primary,
    borderColor: c.primary,
  },
  dayTypeText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: c.textSoft,
  },
  dayTypeTextActive: {
    color: "#FFFFFF",
  },

  // Reason
  reasonBox: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: c.border,
    backgroundColor: c.surfaceInput,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  reasonBoxFocused: {
    borderColor: c.accent,
    backgroundColor: c.surface,
  },
  reasonInput: {
    minHeight: 92,
    fontSize: 15,
    color: c.text,
    textAlignVertical: "top",
    paddingVertical: 8,
  },
  suggestRow: {
    gap: 8,
    paddingTop: 10,
    paddingRight: 4,
  },
  suggestChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
  },
  suggestChipActive: {
    backgroundColor: c.primaryFaint,
    borderColor: c.accent,
  },
  suggestText: {
    fontSize: 12.5,
    fontWeight: "600",
    color: c.textSoft,
  },
  suggestTextActive: {
    color: c.accent,
  },

  // Summary + submit
  summary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 22,
    padding: 14,
    borderRadius: 18,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: c.borderStrong,
  },
  summaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primaryFaint,
  },
  summaryTitle: {
    fontSize: 14.5,
    fontWeight: "800",
    color: c.text,
  },
  summaryText: {
    fontSize: 12.5,
    color: c.textSoft,
    marginTop: 2,
  },
  submitTouch: {
    marginTop: 14,
    borderRadius: 18,
    overflow: "hidden",
    elevation: 6,
    shadowColor: c.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    backgroundColor: c.primary,
  },
  submit: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Date sheet
  sheetBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: c.overlay,
  },
  sheet: {
    backgroundColor: c.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: c.borderStrong,
    marginBottom: 12,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: c.text,
  },
  sheetHint: {
    fontSize: 12.5,
    color: c.textSoft,
    marginTop: 2,
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: c.primaryFaint,
  },
  sheetSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: c.surfaceAlt,
  },
  sheetSummaryText: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: "700",
    color: c.text,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  sheetSecondary: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: c.borderStrong,
  },
  sheetSecondaryText: {
    fontSize: 15,
    fontWeight: "700",
    color: c.text,
  },
  sheetPrimaryTouch: {
    flex: 1.6,
    borderRadius: 16,
    overflow: "hidden",
  },
  sheetPrimary: {
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetPrimaryText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
}));

export default LeaveApplicationScreen;
