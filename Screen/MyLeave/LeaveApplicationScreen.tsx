import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
  Animated,
  Easing,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
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
          current === startTime || current === endTime ? "#002957" : "#1a4a7a",
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

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={{ paddingBottom: contentPaddingBottom }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Apply for Leave</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Application Date</Text>
              <Text style={styles.infoValue}>
                {format(new Date(applicationDate), "dd-MM-yyyy")}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Approver</Text>
              <Text style={styles.infoValue}>
                {managerDetailsSelector?.name || "Not assigned"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Leave Type</Text>
          <View style={styles.radioButtonContainer}>
            {availableLeaveTypes.map((item: any) => (
              <TouchableOpacity
                key={item.leaveCode}
                disabled={!item.eligible}
                style={[
                  styles.radioButton,
                  leaveType === item.leaveCode && styles.radioButtonSelected,
                  !item.eligible && styles.radioButtonDisabled,
                ]}
                onPress={() => {
                  if (!item.eligible) return;

                  setLeaveType(item.leaveCode);
                  setSelectedOption("full-day");
                }}
              >
                <View style={styles.radioButtonContent}>
                  <Text
                    style={[
                      styles.radioButtonText,
                      leaveType === item.leaveCode &&
                        styles.radioButtonTextSelected,
                    ]}
                  >
                    {item.title}
                  </Text>

                  <Text
                    style={[
                      styles.leaveCountText,
                      item.remaining <= 0 && styles.leaveCountTextDisabled,
                    ]}
                  >
                    Balance : {item.remaining}
                  </Text>

                  {!item.eligible && (
                    <Text
                      style={{
                        color: "#dc3545",
                        fontSize: 11,
                        marginTop: 4,
                        textAlign: "center",
                      }}
                    >
                      Available after {item.daysRemainingForEligibility} day(s)
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Selection</Text>
          <TouchableOpacity
            onPress={() => setIsCalendarModalVisible(true)}
            style={styles.dateButton}
          >
            <Icon name="event" size={20} color={C.accent} />
            <Text style={styles.dateButtonText}>{showDateRange()}</Text>
            <Icon name="keyboard-arrow-down" size={24} color={C.accent} />
          </TouchableOpacity>

          {selectedStartDate && !selectedEndDate && (
            <View style={styles.partialDayContainer}>
              <Text style={styles.sectionTitle}>Leave Duration</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  key={leaveType}
                  selectedValue={selectedOption}
                  style={styles.picker}
                  onValueChange={(itemValue) => {
                    setSelectedOption(itemValue);
                    setTotalDays(itemValue === "full-day" ? 1 : 0.5);
                  }}
                >
                  {[
                    { label: "Full Day", value: "full-day" },
                    ...(selectedLeave?.halfDayAllowed
                      ? [
                          { label: "First Half", value: "first-half" },
                          { label: "Second Half", value: "second-half" },
                        ]
                      : []),
                  ].map((item) => (
                    <Picker.Item
                      key={item.value}
                      label={item.label}
                      value={item.value}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {totalDays > 0 && (
            <View style={styles.daysContainer}>
              <Text style={styles.daysText}>
                {totalDays} day{totalDays !== 1 ? "s" : ""} selected
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reason for Leave</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Please provide a reason for your leave"
            value={reason}
            onChangeText={setReason}
            multiline
            numberOfLines={4}
          />
        </View>

        <TouchableOpacity
          onPress={handleApplyLeave}
          style={styles.submitButton}
        >
          <Text style={styles.submitButtonText}>Submit Leave Application</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isCalendarModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCalendarModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date Range</Text>
              <TouchableOpacity
                onPress={() => setIsCalendarModalVisible(false)}
                style={styles.closeCalendarButton}
              >
                <Icon name="close" size={24} color={C.accent} />
              </TouchableOpacity>
            </View>

            <Calendar
              onDayPress={onDayPress}
              markingType="period"
              markedDates={markedDates}
              minDate={todayISO}
              theme={{
                todayBackgroundColor: C.primaryFaint,
                todayTextColor: C.text,
                selectedDayBackgroundColor: C.primary,
                selectedDayTextColor: "#FFFFFF",
                textDayFontWeight: "500",
                arrowColor: C.accent,
              }}
            />

            <TouchableOpacity
              onPress={handleConfirmDates}
              style={styles.confirmButton}
            >
              <Text style={styles.confirmButtonText}>Confirm Dates</Text>
            </TouchableOpacity>
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
const styles = themedStyles((c) => ({
  container: {
    flex: 1,
    backgroundColor: c.background,
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: c.accent,
    marginBottom: 16,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: c.textSoft,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: c.accent,
  },
  section: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: c.accent,
    marginBottom: 14,
  },
  radioButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  radioButton: {
    width: "48%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    backgroundColor: c.primaryFaint,
    borderColor: c.accent,
  },
  radioButtonText: {
    fontSize: 14,
    color: c.textSoft,
    fontWeight: "500",
  },
  radioButtonTextSelected: {
    color: c.accent,
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.background,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.border,
  },
  dateButtonText: {
    fontSize: 16,
    color: c.accent,
    fontWeight: "500",
    flex: 1,
    marginHorizontal: 12,
  },
  partialDayContainer: {
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    overflow: "visible",
  },
  picker: {
    height: 55,
  },
  daysContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: c.primaryFaint,
    borderRadius: 12,
    alignItems: "center",
  },
  daysText: {
    fontSize: 16,
    fontWeight: "600",
    color: c.accent,
  },
  textInput: {
    height: 80,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: 12,
    padding: 14,
    textAlignVertical: "top",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: c.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: c.overlay,
  },
  calendarContainer: {
    width: "95%",
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 14,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: c.accent,
  },
  closeCalendarButton: {
    padding: 4,
  },
  confirmButton: {
    backgroundColor: c.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  radioButtonDisabled: {
    backgroundColor: c.background,
    borderColor: c.border,
    opacity: 0.6,
  },
  radioButtonContent: {
    alignItems: "center",
  },
  radioButtonTextDisabled: {
    color: c.textSoft,
  },
  leaveCountText: {
    fontSize: 12,
    color: "#28a745",
    marginTop: 4,
    fontWeight: "500",
  },
  leaveCountTextDisabled: {
    color: "#dc3545",
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  // Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    // backgroundColor: c.primary,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    backgroundColor: c.surface,
    borderRadius: 16,
    width: "100%",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: c.primary,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginLeft: 8,
  },
  alertBody: {
    padding: 20,
  },
  alertMessage: {
    fontSize: 16,
    color: c.textSoft,
    lineHeight: 22,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 5,
    // borderTopWidth: 1,
    // borderTopColor: c.accent,
  },
  alertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: c.primary,
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: "center",
  },
  alertButtonCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: c.borderStrong,
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  alertButtonCancelText: {
    color: c.textSoft,
  },

  // Loader Styles
  loaderOverlay: {
    flex: 1,
    backgroundColor: c.overlay,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: c.surface,
    padding: 30,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 200,
  },
  loaderText: {
    marginTop: 16,
    fontSize: 16,
    color: c.accent,
    fontWeight: "500",
    textAlign: "center",
  },
}));

export default LeaveApplicationScreen;
