
import React, { useState } from "react";
import { View, Text, Modal, Button, Platform } from "react-native";
import { Calendar } from "react-native-calendars";
import TimesheetForm from "./Timesheet";
import { KeyboardAvoidingView } from "react-native";

// Define types for state
interface Task {
  description: string;
  hours: number;
}

interface Tasks {
  [date: string]: Task[];
}

interface TimesheetCalendarProps {}

const TimesheetCalendar: React.FC<TimesheetCalendarProps> = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [tasks, setTasks] = useState<Tasks>({});
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);

  // Get today's date
  const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

  // // Function to open the modal and reset the form
  const openTimesheetModal = (date: { dateString: string }) => {
    if (date.dateString > today) return; // Prevent selecting dates after today
    setSelectedDate(date.dateString);
    setEditingTaskIndex(null); // Ensure no task is pre-selected for editing
    setModalVisible(true); // Open the modal
  };

  const addTaskToDate = (updatedTasks: Task[]) => {
    if (selectedDate) {
      setTasks((prevTasks) => ({
        ...prevTasks,
        [selectedDate]: updatedTasks, // Replace tasks for the selected date
      }));
    }
    setModalVisible(false);
    console.log("Viewing tasks for date:", selectedDate, updatedTasks);
  };

  // Merge all marked dates into a single object
  const markedDates = {
    [selectedDate || ""]: { selected: true, selectedColor: "rgb(0, 41, 87)" },
    ...Object.keys(tasks).reduce((acc, date) => {
      acc[date] = { marked: true, dotColor: "rgb(0, 41, 87)" };
      return acc;
    }, {}),
    [today]: { selected: false, dotColor: "orange" }, // Ensure today is highlighted
    ...Array.from({ length: 365 }, (_, i) => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + i);
      const futureDateString = futureDate.toISOString().split("T")[0];
      if (futureDateString > today) {
        return {
          [futureDateString]: { disabled: true, backgroundColor: "gray" },
        };
      }
      return {};
    }).reduce((acc, item) => ({ ...acc, ...item }), {}),
  };
  

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* <Text
        style={{
          fontSize: 35,
          fontWeight: "900",
          marginBottom: 10,
          paddingVertical: 20,
        }}
      >
        Timesheet Calendar
      </Text> */}

      <Calendar
        onDayPress={openTimesheetModal}
        markedDates={markedDates}
        theme={{
          selectedDayBackgroundColor: "rgb(0, 41, 87)",
          todayTextColor: "#fff",
          todayBackgroundColor: "orange", 
          arrowColor: "rgb(0, 41, 87)",
          monthTextColor: "rgb(0, 41, 87)",
          textDayFontWeight: "900",
          textMonthFontWeight: "900",
          textDayFontSize: 16,
          textMonthFontSize: 18,
        }}
      />
     
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 20,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 10,
                maxHeight: "120%",
              }}
            >
              <TimesheetForm
                selectedDate={selectedDate}
                addTaskToDate={addTaskToDate}
                closeModal={() => setModalVisible(false)}
                taskToEdit={
                  editingTaskIndex !== null
                    ? tasks[selectedDate || ""]?.[editingTaskIndex]
                    : null
                }
                tasksForSelectedDate={tasks[selectedDate || ""] || []}
                editingTaskIndex={editingTaskIndex}
              />

              <Button title="Close" onPress={() => setModalVisible(false)} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

export default TimesheetCalendar;
