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
import CalendarPicker from "react-native-calendar-picker";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { submitLeaveApplication } from "../../Services/Leave/Leave.service";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../Global/Types";
import Icon from "react-native-vector-icons/MaterialIcons";
import { ActivityIndicator } from "react-native";

const leaveTypes = {
  Casual: "Casual Leave",
  Sick: "Sick Leave",
  Optional: "Optional Leave",
  Paid: "Paid Leave",
};

const LeaveApplicationScreen: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [leaveType, setLeaveType] = useState<string>(leaveTypes.Casual);
  const [selectedOption, setSelectedOption] = useState<string>("full-day");
  const [reason, setReason] = useState<string>("");
  const [approverId, setApproverId] = useState<number>(0);
  const [applicationDate] = useState<string>(new Date().toISOString());
  const [totalDays, setTotalDays] = useState<number>(1);
  const [isCalendarModalVisible, setIsCalendarModalVisible] =
    useState<boolean>(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [userDOJ, setUserDOJ] = useState<Date | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation<LoginScreenNavigationProp>();
  type LoginScreenNavigationProp = StackNavigationProp<
    RootStackParamList,
    "MyLeaveScreen"
  >;

  const leave_Details = useSelector((state: any) => state.leaveDetails);
  const managerDetailsSelector = useSelector((state: any) => state.managerInfo);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    title: "",
    message: "",
    type: "info", // 'success', 'error', 'warning', 'info'
    buttons: null as any,
  });

  const [loaderVisible, setLoaderVisible] = useState(false);
  const [loaderMessage, setLoaderMessage] = useState("");

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

  const resetForm = () => {
    setLeaveType(leaveTypes.Casual);
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

  // Get leave data to check balances
  const getLeaveBalances = () => {
    if (!leave_Details || Object.keys(leave_Details).length === 0) {
      return {
        casualleave: 0,
        sickleave: 0,
        optionalleave: 0,
        paidleave: 0,
      };
    }
    return leave_Details;
  };

  const leaveBalances = getLeaveBalances();

  // Check if leave type is available
  const isLeaveTypeAvailable = (type: string) => {
    switch (type) {
      case leaveTypes.Casual:
        return (leaveBalances.casualleave || 0) > 0;
      case leaveTypes.Sick:
        return (leaveBalances.sickleave || 0) > 0;
      case leaveTypes.Optional:
        return (leaveBalances.optionalleave || 0) > 0;
      case leaveTypes.Paid:
        return (leaveBalances.paidleave || 0) > 0;
      default:
        return true;
    }
  };

  // Get available leave count for a type
  const getAvailableLeaves = (type: string) => {
    switch (type) {
      case leaveTypes.Casual:
        return leaveBalances.casualleave || 0;
      case leaveTypes.Sick:
        return leaveBalances.sickleave || 0;
      case leaveTypes.Optional:
        return leaveBalances.optionalleave || 0;
      case leaveTypes.Paid:
        return leaveBalances.paidleave || 0;
      default:
        return 0;
    }
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
    }, [])
  );

  const CustomAlert = ({
    visible,
    title,
    message,
    type,
    onClose,
    buttons,
  }: any) => {
    if (!visible) return null;

    const getBackgroundColor = () => {
      switch (type) {
        case "success":
          return "#28a745";
        case "error":
          return "#dc3545";
        case "warning":
          return "#ffc107";
        default:
          return "#002957";
      }
    };

    const getIcon = () => {
      switch (type) {
        case "success":
          return "check-circle";
        case "error":
          return "error";
        case "warning":
          return "warning";
        default:
          return "info";
      }
    };

    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View
              style={[
                styles.alertHeader,
                { backgroundColor: getBackgroundColor() },
              ]}
            >
              <Icon name={getIcon()} size={24} color="#fff" />
              <Text style={styles.alertTitle}>{title}</Text>
            </View>
            <View style={styles.alertBody}>
              <Text style={styles.alertMessage}>{message}</Text>
            </View>
            <View style={styles.alertFooter}>
              {buttons ? (
                buttons.map((button: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.alertButton,
                      button.style === "cancel" && styles.alertButtonCancel,
                    ]}
                    onPress={button.onPress}
                  >
                    <Text
                      style={[
                        styles.alertButtonText,
                        button.style === "cancel" &&
                          styles.alertButtonCancelText,
                      ]}
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <TouchableOpacity style={styles.alertButton} onPress={onClose}>
                  <Text style={styles.alertButtonText}>OK</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Custom Loading Component
  const CustomLoader = ({ visible, message }: any) => {
    if (!visible) return null;

    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#002957" />
            <Text style={styles.loaderText}>{message || "Submitting..."}</Text>
          </View>
        </View>
      </Modal>
    );
  };

  // const handleApplyLeave = async () => {
  //   if (!selectedStartDate) {
  //     Alert.alert("Error", "Please select a start date.");
  //     return;
  //   }
  //   if (!reason.trim()) {
  //     Alert.alert("Error", "Reason for leave is required.");
  //     return;
  //   }

  //   // Check if selected leave type has available leaves
  //   if (!isLeaveTypeAvailable(leaveType)) {
  //     Alert.alert(
  //       "No Leaves Available",
  //       `You have no ${leaveType} leaves remaining. Please select another leave type.`,
  //       [{ text: "OK", style: "default" }]
  //     );
  //     return;
  //   }

  //   const leaveApplication = {
  //     leavetype: leaveType,
  //     leavestart: selectedStartDate
  //       ? format(selectedStartDate, "dd/MM/yyyy")
  //       : "",
  //     leaveend: selectedEndDate
  //       ? format(selectedEndDate, "dd/MM/yyyy")
  //       : format(selectedStartDate, "dd/MM/yyyy"),
  //     leavepart: selectedOption,
  //     reason: reason.trim(),
  //     approver: managerDetailsSelector.id,
  //   };

  //   console.log("Leave Application:", leaveApplication);

  //   setIsLoading(true);

  //   try {
  //     const response = await submitLeaveApplication(leaveApplication);
  //     if (response.status === 200) {
  //       Alert.alert(
  //         "Success!",
  //         response.message || "Leave application submitted successfully!",
  //         [
  //           {
  //             text: "OK",
  //             style: "default",
  //             onPress: () => {
  //               resetForm();
  //               navigation.navigate("MyLeaveScreen");
  //             },
  //           },
  //         ]
  //       );
  //     } else {
  //       Alert.alert(
  //         "Error",
  //         response.message || "Failed to submit leave application."
  //       );
  //     }
  //   } catch (error) {
  //     Alert.alert(
  //       "Error",
  //       "An error occurred while submitting the leave application."
  //     );
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const handleApplyLeave = async () => {
    if (!selectedStartDate) {
      setAlertConfig({
        title: "Missing Information",
        message: "Please select a start date.",
        type: "warning",
        buttons: null,
      });
      setAlertVisible(true);
      return;
    }

    if (!reason.trim()) {
      setAlertConfig({
        title: "Missing Information",
        message: "Reason for leave is required.",
        type: "warning",
        buttons: null,
      });
      setAlertVisible(true);
      return;
    }

    // Check if selected leave type has available leaves
    if (!isLeaveTypeAvailable(leaveType)) {
      setAlertConfig({
        title: "No Leaves Available",
        message: `You have no ${leaveType} leaves remaining. Please select another leave type.`,
        type: "warning",
        buttons: null,
      });
      setAlertVisible(true);
      return;
    }

    const leaveApplication = {
      leavetype: leaveType,
      leavestart: selectedStartDate
        ? format(selectedStartDate, "dd/MM/yyyy")
        : "",
      leaveend: selectedEndDate
        ? format(selectedEndDate, "dd/MM/yyyy")
        : format(selectedStartDate, "dd/MM/yyyy"),
      leavepart: selectedOption,
      reason: reason.trim(),
      approver: managerDetailsSelector.id,
    };

    console.log("Leave Application:", leaveApplication);

    // Show loader
    setLoaderMessage("Submitting your leave application...");
    setLoaderVisible(true);

    try {
      const response = await submitLeaveApplication(leaveApplication);
      if (response.status === 200) {
        setLoaderVisible(false); // Hide loader first

        // Show success alert
        setAlertConfig({
          title: "Success!",
          message:
            response.message || "Leave application submitted successfully!",
          type: "success",
          buttons: [
            // {
            //   text: "View My Leaves",
            //   onPress: () => {
            //     resetForm();
            //     navigation.navigate("MyLeaveScreen");
            //   },
            // },
            {
              text: "Cancel",
              style: "cancel",
              onPress: () => {
                resetForm();
              },
            },
          ],
        });
        setAlertVisible(true);
      } else {
        setLoaderVisible(false);
        setAlertConfig({
          title: "Submission Failed",
          message: response.message || "Failed to submit leave application.",
          type: "error",
          buttons: null,
        });
        setAlertVisible(true);
      }
    } catch (error) {
      setLoaderVisible(false);
      setAlertConfig({
        title: "Error",
        message: "An error occurred while submitting the leave application.",
        type: "error",
        buttons: null,
      });
      setAlertVisible(true);
    }
  };

  const onDateChange = (date: Date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else {
      setSelectedEndDate(date);
    }
    calculateTotalDays();
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
        "dd-MM-yyyy"
      )}`;
    } else {
      return format(selectedStartDate, "dd-MM-yyyy");
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollContainer}
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
            {Object.keys(leaveTypes).map((label) => (
              <TouchableOpacity
                key={label}
                style={[
                  styles.radioButton,
                  leaveType === leaveTypes[label] && styles.radioButtonSelected,
                ]}
                onPress={() => {
                  if (label === "Paid") {
                    if (userDOJ) {
                      const dojDate = new Date(userDOJ);
                      const appDate = new Date(applicationDate);

                      const diffInMonths =
                        (appDate.getFullYear() - dojDate.getFullYear()) * 12 +
                        (appDate.getMonth() - dojDate.getMonth());

                      // if (diffInMonths < 6) {
                      //   Alert.alert(
                      //     "Not Eligible",
                      //     "You are not eligible to get paid leave since you are in your probation period."
                      //   );
                      //   return;
                      // }
                      if (diffInMonths < 6) {
                        setAlertConfig({
                          title: "Not Eligible",
                          message:
                            "You are not eligible to get paid leave since you are in your probation period.",
                          type: "warning",
                          buttons: null,
                        });
                        setAlertVisible(true);
                        return;
                      }
                    } else {
                      Alert.alert(
                        "Error",
                        "User date of joining is not available. Please contact admin."
                      );
                      return;
                    }
                  }
                  setLeaveType(leaveTypes[label]);
                }}
              >
                <Text
                  style={[
                    styles.radioButtonText,
                    leaveType === leaveTypes[label] &&
                      styles.radioButtonTextSelected,
                  ]}
                >
                  {label}
                </Text>
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
            <Icon name="event" size={20} color="#002957" />
            <Text style={styles.dateButtonText}>{showDateRange()}</Text>
            <Icon name="keyboard-arrow-down" size={24} color="#002957" />
          </TouchableOpacity>

          {selectedStartDate && !selectedEndDate && (
            <View style={styles.partialDayContainer}>
              <Text style={styles.sectionTitle}>Leave Duration</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedOption}
                  style={styles.picker}
                  onValueChange={(itemValue) => {
                    setSelectedOption(itemValue);
                    setTotalDays(itemValue === "full-day" ? 1 : 0.5);
                  }}
                >
                  <Picker.Item label="Full Day" value="full-day" />
                  <Picker.Item label="First Half" value="first-half" />
                  <Picker.Item label="Second Half" value="second-half" />
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

        {/* <TouchableOpacity onPress={handleApplyLeave} style={styles.submitButton}>
          <Text style={styles.submitButtonText}>Submit Leave Application</Text>
        </TouchableOpacity> */}

        <TouchableOpacity
          onPress={handleApplyLeave}
          style={[
            styles.submitButton,
            isLoading && styles.submitButtonDisabled,
          ]}
          disabled={isLoading}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#fff" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>
              Submit Leave Application
            </Text>
          )}
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
                <Icon name="close" size={24} color="#002957" />
              </TouchableOpacity>
            </View>

            <CalendarPicker
              todayBackgroundColor={"#e9f0f7"}
              minDate={new Date()}
              selectedDayTextColor={"#FFFFFF"}
              selectedDayStyle={{ backgroundColor: "#002957" }}
              selectedRangeStyle={{ backgroundColor: "#1a4a7a" }}
              onDateChange={onDateChange}
              allowRangeSelection={true}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
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

      <CustomAlert
        visible={alertVisible}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        buttons={alertConfig.buttons}
        onClose={() => setAlertVisible(false)}
      />

      <CustomLoader visible={loaderVisible} message={loaderMessage} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#002957",
    marginBottom: 16,
    textAlign: "center",
  },
  infoCard: {
    backgroundColor: "#fff",
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
    color: "#6c757d",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
  },
  section: {
    backgroundColor: "#fff",
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
    color: "#002957",
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
    borderColor: "#dee2e6",
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  radioButtonSelected: {
    backgroundColor: "#e9f0f7",
    borderColor: "#002957",
  },
  radioButtonText: {
    fontSize: 14,
    color: "#495057",
    fontWeight: "500",
  },
  radioButtonTextSelected: {
    color: "#002957",
    fontWeight: "600",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#002957",
    fontWeight: "500",
    flex: 1,
    marginHorizontal: 12,
  },
  partialDayContainer: {
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#dee2e6",
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
    backgroundColor: "#e9f0f7",
    borderRadius: 12,
    alignItems: "center",
  },
  daysText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
  },
  textInput: {
    height: 80,
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
    padding: 14,
    textAlignVertical: "top",
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: "#002957",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 95,
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  calendarContainer: {
    width: "95%",
    backgroundColor: "#fff",
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
    color: "#002957",
  },
  closeCalendarButton: {
    padding: 4,
  },
  confirmButton: {
    backgroundColor: "#002957",
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
    backgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
    opacity: 0.6,
  },
  radioButtonContent: {
    alignItems: "center",
  },
  radioButtonTextDisabled: {
    color: "#6c757d",
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
     backgroundColor: 'rgba(0, 0, 0, 0.5)',
    // backgroundColor: "#002957",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  alertContainer: {
    backgroundColor: "#fff",
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
    backgroundColor: "#002957",
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
    color: "#495057",
    lineHeight: 22,
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: 5,
    // borderTopWidth: 1,
    // borderTopColor: "#002957",
  },
  alertButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#002957",
    borderRadius: 8,
    marginLeft: 8,
    minWidth: 80,
    alignItems: "center",
  },
  alertButtonCancel: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#6c757d",
  },
  alertButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  alertButtonCancelText: {
    color: "#6c757d",
  },

  // Loader Styles
  loaderOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loaderContainer: {
    backgroundColor: "#fff",
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
    color: "#002957",
    fontWeight: "500",
    textAlign: "center",
  },
});

export default LeaveApplicationScreen;
