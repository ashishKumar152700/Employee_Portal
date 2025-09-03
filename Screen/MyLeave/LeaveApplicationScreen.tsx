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
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Global/Types';
import Icon from "react-native-vector-icons/MaterialIcons";

const leaveTypes = {
  Casual: "Casual Leave",
  Sick: "Sick Leave",
  Optional: "Optional Leave",
  Paid: "Paid Leave",
};

const LeaveApplicationScreen: React.FC = () => {
  const [leaveType, setLeaveType] = useState<string>(leaveTypes.Casual);
  const [selectedOption, setSelectedOption] = useState<string>("full-day");
  const [reason, setReason] = useState<string>("");
  const [approverId, setApproverId] = useState<number>(0);
  const [applicationDate] = useState<string>(new Date().toISOString());
  const [totalDays, setTotalDays] = useState<number>(1);
  const [isCalendarModalVisible, setIsCalendarModalVisible] = useState<boolean>(false);
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [userDOJ, setUserDOJ] = useState<Date | null>(null);
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation<LoginScreenNavigationProp>();
  type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyLeaveScreen'>;

  const leave_Details = useSelector((state: any) => state.leaveDetails);
  const managerDetailsSelector = useSelector((state:any) => state.managerInfo);

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
  };

  useEffect(() => {
    getUserDetails();
  }, []);

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

    try {
      const response = await submitLeaveApplication(leaveApplication);
      if (response.status === 200) {
        Alert.alert(
          "Success",
          response.message || "Leave application submitted successfully!"
        );
        resetForm();
        navigation.navigate('MyLeaveScreen');
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
      return `${format(selectedStartDate, "dd-MM-yyyy")} to ${format(selectedEndDate, "dd-MM-yyyy")}`;
    } else {
      return format(selectedStartDate, "dd-MM-yyyy");
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
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
                }}
              >
                <Text style={[
                  styles.radioButtonText,
                  leaveType === leaveTypes[label] && styles.radioButtonTextSelected
                ]}>
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
            <Text style={styles.dateButtonText}>
              {showDateRange()}
            </Text>
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
                {totalDays} day{totalDays !== 1 ? 's' : ''} selected
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

        <TouchableOpacity onPress={handleApplyLeave} style={styles.submitButton}>
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002957',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002957',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002957',
    marginBottom: 14,
  },
  radioButtonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  radioButton: {
    width: '48%',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#e9f0f7',
    borderColor: '#002957',
  },
  radioButtonText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  radioButtonTextSelected: {
    color: '#002957',
    fontWeight: '600',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#002957',
    fontWeight: '500',
    flex: 1,
    marginHorizontal: 12,
  },
  partialDayContainer: {
    marginTop: 10,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    overflow: 'visible',
  },
  picker: {
    height: 55,
  },
  daysContainer: {
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#e9f0f7',
    borderRadius: 12,
    alignItems: 'center',
  },
  daysText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#002957',
  },
  textInput: {
    height: 80,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    padding: 14,
    textAlignVertical: 'top',
    fontSize: 14,
  },
  submitButton: {
    backgroundColor: '#002957',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 95,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  calendarContainer: {
    width: '95%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#002957',
  },
  closeCalendarButton: {
    padding: 4,
  },
  confirmButton: {
    backgroundColor: '#002957',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default LeaveApplicationScreen;

// import React, { useState, useCallback, useEffect } from "react";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   Alert,
//   Modal,
// } from "react-native";
// import { Picker } from "@react-native-picker/picker";
// import CalendarPicker from "react-native-calendar-picker";
// import { useFocusEffect } from "@react-navigation/native";
// import { format } from "date-fns";
// import { ScrollView } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { submitLeaveApplication } from "../../Services/Leave/Leave.service";
// import { useDispatch, useSelector } from "react-redux";
// import { useNavigation } from '@react-navigation/native';
// import { StackNavigationProp } from '@react-navigation/stack';
// import { RootStackParamList } from '../../Global/Types';

// const leaveTypes = {
//   Casual: "Casual Leave",
//   Sick: "Sick Leave",
//   Optional: "Optional Leave",
//   Paid: "Paid Leave",
// };

// const LeaveApplicationScreen: React.FC = () => {
//   const [leaveType, setLeaveType] = useState<string>(leaveTypes.Casual);
//   const [showDropdown, setShowDropdown] = useState<boolean>(false);
//   const [selectedOption, setSelectedOption] = useState<string>("full-day");
//   const [reason, setReason] = useState<string>("");
//   const [approverId, setApproverId] = useState<number>(0);
//   const [applicationDate] = useState<string>(new Date().toISOString());
//   const [totalDays, setTotalDays] = useState<number>(1);
//   const [isCalendarModalVisible, setIsCalendarModalVisible] = useState<boolean>(false);
//   const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
//   const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
//   const [userDOJ, setUserDOJ] = useState<Date | null>(null);
//   const navigation = useNavigation<LoginScreenNavigationProp>();
// type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MyLeaveScreen'>;

  
//   const leave_Details = useSelector((state: any) => state.leaveDetails);

//   useEffect(() => {
//     console.log("leave_Details updated", leave_Details);
//   }, [leave_Details]);
    
  
//   const resetForm = () => {
//     setLeaveType(leaveTypes.Casual);
//     setSelectedStartDate(null);
//     setSelectedEndDate(null);
//     setShowDropdown(false);
//     setReason("");
//     setApproverId(0);
//     setTotalDays(1);
//     setSelectedOption("full-day");
//   };

//   useEffect(() => {
//     getUserDetails();
//   }, []);

 
//   async function getUserDetails() {
    
 
//     try {
//       const userDetailsString = await AsyncStorage.getItem("user");

//       if (userDetailsString) {
//         const userDetails = JSON.parse(userDetailsString);
//         const joiningDate = new Date(userDetails.joiningdate); 
//         setUserDOJ(joiningDate);

//       }
//     } catch (error) {
//       console.error("Error retrieving user details:", error);
//     }
//   }

//   const managerDetailsSelector = useSelector((state:any) => state.managerInfo ) ;

//   useFocusEffect(
//     useCallback(() => {
//       resetForm();
//     }, [])
//   );

//   const handleApplyLeave = async () => {
//     if (!selectedStartDate) {
//       Alert.alert("Error", "Please select a start date.");
//       return;
//     }
//     if (!reason.trim()) {
//       Alert.alert("Error", "Reason for leave is required.");
//       return;
//     }
  
  
//       const leaveApplication = {
//         leavetype: leaveType,
//         leavestart: selectedStartDate
//           ? format(selectedStartDate, "dd/MM/yyyy")
//           : "",
//         leaveend: selectedEndDate
//           ? format(selectedEndDate, "dd/MM/yyyy")
//           : format(selectedStartDate, "dd/MM/yyyy"),
//         leavepart: selectedOption,
//         reason: reason.trim(),
//         approver: managerDetailsSelector.id,
//       };
      
//       console.log("Leave Application:", leaveApplication);
  
//       try {
//         const response = await submitLeaveApplication(leaveApplication);
//         if (response.status === 200) {
//           Alert.alert(
//             "Success",
//             response.message || "Leave application submitted successfully!"
//           );

//           resetForm();
//           navigation.navigate('MyLeaveScreen');

//         } else {
//           Alert.alert(
//             "Error",
//             response.message || "Failed to submit leave application."
//           );
//         }
//       } catch (error) {
//         Alert.alert(
//           "Error",
//           "An error occurred while submitting the leave application."
//         );
//       }
    
//   };
  

//   const onDateChange = (date: Date) => {
//     if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
//       setSelectedStartDate(date);
//       setSelectedEndDate(null);
//     } else {
//       setSelectedEndDate(date);
//     }
//     calculateTotalDays();
//   };

//   const calculateTotalDays = () => {
//     if (selectedStartDate && !selectedEndDate) {
//       setShowDropdown(leaveType === leaveTypes.Casual || leaveType === leaveTypes.Paid || leaveType === leaveTypes.Sick || leaveType === leaveTypes.Paid );
//       const leavepart = selectedOption === "full-day" ? 1 : 0.5;
//       setTotalDays(leavepart);
//     } else if (selectedStartDate && selectedEndDate) {
//       const start = new Date(selectedStartDate);
//       const end = new Date(selectedEndDate);
//       setShowDropdown(false);
//       const difference =
//         Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
//       setTotalDays(difference < 0 ? 0 : difference);
//     } else {
//       setTotalDays(0);
//       setShowDropdown(false);
//     }
//   };

//   React.useEffect(() => {
//     calculateTotalDays();
//   }, [selectedStartDate, selectedEndDate, leaveType, selectedOption]);

//   const handleConfirmDates = () => {
//     setIsCalendarModalVisible(false);
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <Text style={styles.header}>Apply for Leave</Text>
//       <View style={styles.flexRow}>
//         <View style={styles.rowItem}>
//           <Text style={styles.label}>Application Date</Text>
//           <Text style={styles.dateText}>
//             {format(new Date(applicationDate), "dd-MM-yyyy")}
//           </Text>
//         </View>
//         <View style={styles.rowItem}>
//           <Text style={styles.label}>Approver name</Text>
//           <TextInput
//             style={styles.textInputApprover}
//             value={managerDetailsSelector.name}
//             editable={false}
//           />
//         </View>
//       </View>

//       <Text style={styles.leaveTypeContainer}>Leave Type</Text>
//       <View style={styles.radioButtonContainer}>
//         {Object.keys(leaveTypes).map((label) => (
//           <TouchableOpacity
//           key={label}
//           style={[
//             styles.radioButton,
//             leaveType === leaveTypes[label] && styles.radioButtonSelected,
//           ]}
//           onPress={() => {
//             if (label === "Paid") {
//               if (userDOJ) {
//                 const dojDate = new Date(userDOJ);
//                 // const dojDate = new Date("2022-10-24T10:28:56.304Z");
//                 // console.log("DOJDATE TO CHECK : " , dojDate);
                
//                 const appDate = new Date(applicationDate);
                
//                 const diffInMonths =
//                   (appDate.getFullYear() - dojDate.getFullYear()) * 12 +
//                   (appDate.getMonth() - dojDate.getMonth());
        
//                 if (diffInMonths < 6) {
//                   Alert.alert(
//                     "Not Eligible",
//                     "You are not eligible to get paid leave since you are in your probation period."
//                   );
//                   return;
//                 }
//               } else {
//                 Alert.alert(
//                   "Error",
//                   "User date of joining is not available. Please contact admin."
//                 );
//                 return;
//               }
//             }
//             setLeaveType(leaveTypes[label]);
//             setShowDropdown(label === "Casual");
//           }}
//         >
//           <Text style={styles.radioButtonText}>{label}</Text>
//         </TouchableOpacity>
        
//         ))}
//       </View>

//       <TouchableOpacity
//         onPress={() => setIsCalendarModalVisible(true)}
//         style={styles.button}
//       >
//         <Text style={styles.buttonText}>
//           {selectedStartDate
//             ? `Selected Date: ${format(selectedStartDate, "dd-MM-yyyy")}${
//                 selectedEndDate
//                   ? ` to ${format(selectedEndDate, "dd-MM-yyyy")}`
//                   : ""
//               }`
//             : "Select Dates"}
//         </Text>
//       </TouchableOpacity>

//       <Modal
//         visible={isCalendarModalVisible}
//         transparent={true}
//         animationType="slide"
//         onRequestClose={() => setIsCalendarModalVisible(false)}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.calendarContainer}>
//             <CalendarPicker
//               todayBackgroundColor={"gray"}
//               minDate={new Date()}
//               selectedDayTextStyle={{ color: "white" }}
//               selectedDayStyle={{ backgroundColor: "black" }}
//               onDateChange={onDateChange}
//               allowRangeSelection={true}
//               selectedStartDate={selectedStartDate}
//               selectedEndDate={selectedEndDate}
//             />
//             <TouchableOpacity
//               onPress={handleConfirmDates}
//               style={styles.closeButton}
//             >
//               <Text style={styles.closeButtonText} >OK</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>

//       {showDropdown && (
//         <>
//           <Text style={styles.label}>Leave Day Part</Text>

//           <Picker
//             selectedValue={selectedOption}
//             style={styles.picker}
//             onValueChange={(itemValue) => {
//               setSelectedOption(itemValue);
//               setTotalDays(itemValue === "full-day" ? 1 : 0.5);
//             }}
//           >
//             <Picker.Item label="Full-day" value="full-day" />
//             <Picker.Item label="1st Half" value="first-half" />
//             <Picker.Item label="2nd Half" value="second-half" />
//           </Picker>
//         </>
//       )}

//       <Text style={styles.label}>Reason for Leave *</Text>
//       <TextInput
//         style={styles.textInput}
//         placeholder="Provide a reason (mandatory)"
//         value={reason}
//         onChangeText={setReason}
//       />

//       <TouchableOpacity onPress={handleApplyLeave} style={styles.submitButton}>
//         <Text style={styles.submitButtonText}>Submit Leave Application</Text>
//       </TouchableOpacity>
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 20,
//     backgroundColor: "#fff",
//   },
//   header: {
//     fontSize: 24,
//     fontWeight: "bold",
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: "600",
//     marginTop: 15,
//     marginBottom: 10,
//   },
//   leaveTypeContainer: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#333",
//     marginBottom: 15,
//   },
//   radioButtonContainer: {
//     flexDirection: "row",
//     flexWrap: "wrap",
//     justifyContent: "space-between",
//     marginBottom: 10,
//   },
//   radioButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     justifyContent: "center",
//     width: "48%",
//     padding: 12,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     marginBottom: 10,
//   },
//   radioButtonSelected: {
//     backgroundColor: "#e0f7fa",
//     borderColor: "#00796b",
//   },
//   radioButtonText: {
//     fontSize: 16,
//   },
//   dateText: {
//     fontSize: 18,
//     fontWeight: "900",
//     color: "#D3D3D3",

//     padding: 10,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     marginBottom: 10,
//   },
//   textInput: {
//     height: 50,
//     borderColor: "gray",
//     borderWidth: 1,
//     borderRadius: 8,
//     paddingHorizontal: 10,
//   },
//   textInputApprover: {
//     fontSize: 18,
//     fontWeight: "900",
//     color: "#D3D3D3",
//     padding: 10,
//     borderRadius: 8,
//     borderWidth: 1,
//     borderColor: "#ccc",
//     marginBottom: 10,
//   },

//   submitButton: {
//     paddingVertical: 15,
//     backgroundColor: "rgb(0, 41, 87)",
//     borderRadius: 8,
//     marginTop: 25,
//     marginBottom: 25,
//   },
//   submitButtonText: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#fff",
//     textAlign: "center",
//   },
//   flexRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   rowItem: {
//     flex: 0.48,
//   },
//   button: {
//     backgroundColor: "rgb(0, 41, 87)",
//     padding: 12,
//     borderRadius: 8,
//     marginVertical: 15,
//   },
//   buttonText: {
//     color: "#fff",
    
//     fontSize: 16,
//     textAlign: "center",
//   },
//   picker: {
//     height: 50,
//     width: "100%",
    
//   },
//   modalContainer: {
//     flex: 1,
//     backgroundColor: "rgba(0, 0, 0, 0.6)",
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   calendarContainer: {
//     backgroundColor: "white",
//     padding: 20,
//     borderRadius: 8,
//     width: "96%",
//   },
//   closeButton: {
//     backgroundColor: "rgb(0, 41, 87)",
//     paddingVertical: 10,
//     marginTop: 20,
//     borderRadius: 8,
//     alignItems: "center",
//   },
//   closeButtonText: {
//     color: "white",
//     fontSize: 16,
//   },
// });

// export default LeaveApplicationScreen;

