import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import CalendarPicker from "react-native-calendar-picker";
import { useFocusEffect } from "@react-navigation/native";
import { format } from "date-fns";
import { ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { submitLeaveApplication } from "../../Services/Leave/Leave.service";
import { useDispatch, useSelector } from "react-redux";

const leaveTypes = {
  Casual: "casualleaves",
  Sick: "sickleaves",
  Optional: "optionalleaves",
  Paid: "paidleaves",
};

const LeaveApplicationScreen: React.FC = () => {
  const [leaveType, setLeaveType] = useState<string>(leaveTypes.Casual);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [selectedOption, setSelectedOption] = useState<string>("full-day");
  const [reason, setReason] = useState<string>("");
  const [approverName, setApproverName] = useState<string>("");
  const [approverId, setApproverId] = useState<number>(0);
  const [applicationDate] = useState<string>(new Date().toISOString());
  const [totalDays, setTotalDays] = useState<number>(1);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState<boolean>(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [userDOJ, setUserDOJ] = useState<Date | null>(null);

  
  let dispatch = useDispatch()
  

  const resetForm = () => {
    setLeaveType(leaveTypes.Casual);
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setShowDropdown(false);
    setReason("");
    setApproverId(0);
    setTotalDays(1);
    setSelectedOption("full-day");
  };

  useEffect(() => {
    // getManagerDetails();
    getUserDetails();
  }, []);

 
  async function getUserDetails() {
    
 
    try {
      const userDetailsString = await AsyncStorage.getItem("user");
      // console.log("userDetailsString : ", userDetailsString);

      if (userDetailsString) {
        const userDetails = JSON.parse(userDetailsString);
        // console.log("User details:", userDetails);
        const joiningDate = new Date(userDetails.joiningdate); 
        setUserDOJ(joiningDate);
        // console.log("User DOJ details:", userDOJ);
        // console.log("applicationDate:", applicationDate);
      }
    } catch (error) {
      console.error("Error retrieving user details:", error);
    }
  }

  const managerDetailsSelector = useSelector((state:any) => state.managerInfo ) ;
  // console.log("managerDetailsSelector : " , managerDetailsSelector);
  // console.log("managerDetailsSelector.name : " , managerDetailsSelector.name);
  // console.log("managerDetailsSelector.id : " , managerDetailsSelector.id);
  
  // function getManagerDetails() {
  //       setApproverName(managerDetailsSelector.name);
  //       setApproverId(managerDetailsSelector.id);
  //       console.log("setting managerDetailsSelector.name : " , managerDetailsSelector.name);
  //       console.log("setting managerDetailsSelector.id : " , managerDetailsSelector.id);  
  //     }
   


  useFocusEffect(
    useCallback(() => {
      resetForm();
    }, [])
  );

  const handleApplyLeave = async () => {
    if (!selectedStartDate) {
      Alert.alert("Error", "Please select a start date.");
      return;
    }
    if (!reason.trim()) {
      Alert.alert("Error", "Reason for leave is required.");
      return;
    }

    const leaveApplication = {
      leavetype: leaveType,
      applydate: applicationDate,
      leavestart: selectedStartDate
        ? format(selectedStartDate, "dd/MM/yyyy")
        : "",
      leaveend: selectedEndDate
        ? format(selectedEndDate, "dd/MM/yyyy")
        : format(selectedStartDate, "dd/MM/yyyy"),
      leavepart: selectedOption,
      leavestatus: "Pending",
      reason: reason.trim(),
      approver: managerDetailsSelector.id,
    };

    try {
      const response = await submitLeaveApplication(leaveApplication);
      if (response.status === 200) {
        Alert.alert(
          "Success",
          response.message || "Leave application submitted successfully!"
        );
        resetForm();
      } else {
        Alert.alert(
          "Error",
          response.message || "Failed to submit leave application."
        );
      }
    } catch (error) {
      Alert.alert(
        "Error",
        "An error occurred while submitting the leave application."
      );
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
      setShowDropdown(leaveType === leaveTypes.Casual);
      const leavepart = selectedOption === "full-day" ? 1 : 0.5;
      setTotalDays(leavepart);
    } else if (selectedStartDate && selectedEndDate) {
      const start = new Date(selectedStartDate);
      const end = new Date(selectedEndDate);
      setShowDropdown(false);
      const difference =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
      setTotalDays(difference < 0 ? 0 : difference);
    } else {
      setTotalDays(0);
      setShowDropdown(false);
    }
  };

  React.useEffect(() => {
    calculateTotalDays();
  }, [selectedStartDate, selectedEndDate, leaveType, selectedOption]);

  const handleConfirmDates = () => {
    setIsCalendarModalVisible(false);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Apply for Leave</Text>
      <View style={styles.flexRow}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Application Date</Text>
          <Text style={styles.dateText}>
            {format(new Date(applicationDate), "dd-MM-yyyy")}
          </Text>
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>Approver name</Text>
          <TextInput
            style={styles.textInputApprover}
            value={managerDetailsSelector.name}
            editable={false}
          />
        </View>
      </View>

      <Text style={styles.leaveTypeContainer}>Leave Type</Text>
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
                // const dojDate = new Date("2022-10-24T10:28:56.304Z");
                // console.log("DOJDATE TO CHECK : " , dojDate);
                
                const appDate = new Date(applicationDate);
                
                const diffInMonths =
                  (appDate.getFullYear() - dojDate.getFullYear()) * 12 +
                  (appDate.getMonth() - dojDate.getMonth());
        
                if (diffInMonths < 6) {
                  Alert.alert(
                    "Not Eligible",
                    "You are not eligible to get paid leave since you are in your probation period."
                  );
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
            setShowDropdown(label === "Casual");
          }}
        >
          <Text style={styles.radioButtonText}>{label}</Text>
        </TouchableOpacity>
        
        ))}
      </View>

      <TouchableOpacity
        onPress={() => setIsCalendarModalVisible(true)}
        style={styles.button}
      >
        <Text style={styles.buttonText}>
          {selectedStartDate
            ? `Selected Date: ${format(selectedStartDate, "dd-MM-yyyy")}${
                selectedEndDate
                  ? ` to ${format(selectedEndDate, "dd-MM-yyyy")}`
                  : ""
              }`
            : "Select Dates"}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isCalendarModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCalendarModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.calendarContainer}>
            <CalendarPicker
              todayBackgroundColor={"gray"}
              minDate={new Date()}
              selectedDayTextStyle={{ color: "white" }}
              selectedDayStyle={{ backgroundColor: "black" }}
              onDateChange={onDateChange}
              allowRangeSelection={true}
              selectedStartDate={selectedStartDate}
              selectedEndDate={selectedEndDate}
            />
            <TouchableOpacity
              onPress={handleConfirmDates}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showDropdown && (
        <>
          <Text style={styles.label}>Leave Day Part</Text>

          <Picker
            selectedValue={selectedOption}
            style={styles.picker}
            onValueChange={(itemValue) => {
              setSelectedOption(itemValue);
              setTotalDays(itemValue === "full-day" ? 1 : 0.5);
            }}
          >
            <Picker.Item label="Full-day" value="full-day" />
            <Picker.Item label="1st Half" value="first-half" />
            <Picker.Item label="2nd Half" value="second-half" />
          </Picker>
        </>
      )}

      <Text style={styles.label}>Reason for Leave *</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Provide a reason (mandatory)"
        value={reason}
        onChangeText={setReason}
      />

      <TouchableOpacity onPress={handleApplyLeave} style={styles.submitButton}>
        <Text style={styles.submitButtonText}>Submit Leave Application</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 68,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
    marginBottom: 10,
  },
  leaveTypeContainer: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  radioButtonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  radioButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "48%",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  radioButtonSelected: {
    backgroundColor: "#e0f7fa",
    borderColor: "#00796b",
  },
  radioButtonText: {
    fontSize: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#D3D3D3",

    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },
  textInput: {
    height: 50,
    borderColor: "gray",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  textInputApprover: {
    fontSize: 18,
    fontWeight: "900",
    color: "#D3D3D3",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
    marginBottom: 10,
  },

  submitButton: {
    backgroundColor: "rgb(0, 41, 87)",
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 25,
    marginBottom: 25,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  flexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowItem: {
    flex: 0.48,
  },
  button: {
    backgroundColor: "rgb(0, 41, 87)",
    padding: 12,
    borderRadius: 8,
    marginVertical: 15,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    width: "96%",
  },
  closeButton: {
    backgroundColor: "rgb(0, 41, 87)",
    paddingVertical: 10,
    marginTop: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
  },
});

export default LeaveApplicationScreen;

