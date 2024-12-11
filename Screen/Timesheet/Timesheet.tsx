import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
import { FontAwesome } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  Button,
  Switch,
  Alert,
  Modal,
  ScrollView,
  TouchableOpacity,
} from "react-native";

export default function TimesheetForm({
  selectedDate,
  addTaskToDate,
  tasksForSelectedDate,
  closeModal,
  taskToEdit,
  editingTaskIndex,
}) {
  const [taskTitle, setTaskTitle] = useState("");
  const [assignedProject, setAssignedProject] = useState("No Project");
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isBillable, setIsBillable] = useState(false);
  const [description, setDescription] = useState("");
  const [taskReviewVisible, setTaskReviewVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);

  const clearForm = () => {
    setTaskTitle("");
    setAssignedProject("No Project");
    setHours(0);
    setMinutes(0);
    setIsBillable(false);
    setDescription("");
    setEditingIndex(null);
  };

  // Prefill form when editing a task
  useEffect(() => {
    if (taskToEdit) {
      console.log("Prefilling form with task data:", taskToEdit);
      setTaskTitle(taskToEdit.taskTitle || "");
      setAssignedProject(taskToEdit.assignedProject || "No Project");
      setHours(taskToEdit.hours || 0);
      setMinutes(taskToEdit.minutes || 0);
      setIsBillable(taskToEdit.isBillable || false);
      setDescription(taskToEdit.description || "");
      setEditingIndex(editingTaskIndex);
    } else {
      clearForm();
    }
  }, [taskToEdit, editingTaskIndex]);

  const handleAddOrUpdateTask = () => {
    if (!taskTitle || !description) {
      Alert.alert("Error", "Please fill out Task Title and Description.");
      return;
    }
    if (hours === 0 && minutes === 0) {
      Alert.alert("Error", "Please specify either hours or minutes.");
      return;
    }

    const newTask = {
      taskTitle,
      assignedProject,
      hours,
      minutes,
      isBillable,
      description,
    };

    console.log("Task to be added/updated:", newTask);

    Alert.alert(
      "Task Details",
      `Task: ${taskTitle}\nProject: ${assignedProject}\nHours: ${hours} hrs, ${minutes} mins\nBillable: ${
        isBillable ? "Yes" : "No"
      }\nDescription: ${description}`,
      [
        {
          text: "Confirm",
          onPress: () => {
            let updatedTasks;

            if (editingIndex !== null) {
              // Update existing task
              updatedTasks = tasksForSelectedDate.map((task, index) =>
                index === editingIndex ? newTask : task
              );
              console.log("Updating task:", {
                previous: tasksForSelectedDate[editingIndex],
                updated: newTask,
              });
            } else {
              // Add new task
              updatedTasks = [...tasksForSelectedDate, newTask];
              console.log("Adding new task:", newTask);
            }

            addTaskToDate(updatedTasks); // Ensure this function replaces the tasks properly
            Alert.alert(
              editingIndex !== null ? "Task Updated" : "Task Added",
              `The task has been successfully ${
                editingIndex !== null ? "updated" : "added"
              }.`
            );
            clearForm(); // Reset the form
          },
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const handleEditTask = (task, index) => {
    console.log("Editing task:", { index, task });
    setTaskTitle(task.taskTitle);
    setAssignedProject(task.assignedProject);
    setHours(task.hours);
    setMinutes(task.minutes);
    setIsBillable(task.isBillable);
    setDescription(task.description);
    setEditingIndex(index);
    setTaskReviewVisible(false);
  };

  const handleDeleteTask = (index) => {
    const updatedTasks = tasksForSelectedDate.filter((_, i) => i !== index);

    console.log("Deleting task:", {
      index,
      task: tasksForSelectedDate[index],
    });

    addTaskToDate(updatedTasks); // Update the state without nesting
    Alert.alert("Task Deleted", "The task has been successfully deleted.");

  };

  return (
    <ScrollView>
      <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "column" }}>
          <Text style={{ fontSize: 20, fontWeight: "bold" }}>
            {editingIndex !== null ? "Edit Task" : "Add Task"} for
          </Text>
          <Text style={{ fontSize: 34, fontWeight: "bold" }}>
            {selectedDate}
          </Text>
        </View>

        <View style={{ flexDirection: "column" }}>
          <Text style={{ fontSize: 18, fontWeight: "bold" }}>Billable 💰</Text>
          <Switch value={isBillable} onValueChange={setIsBillable} />
        </View>
      </View>

      <TextInput
        placeholder="Task Title"
        value={taskTitle}
        onChangeText={setTaskTitle}
        style={{
          borderWidth: 1,
          borderRadius: 5,
          padding: 10,
          marginVertical: 5,
        }}
      />

      <TextInput
        placeholder="Enter project name"
        value={assignedProject === "No Project" ? "" : assignedProject}
        onChangeText={(value) => setAssignedProject(value || "No Project")}
        style={{
          borderWidth: 1,
          borderRadius: 5,
          padding: 10,
          marginVertical: 5,
        }}
      />

      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginVertical: 5,
          borderWidth: 1,
          borderRadius: 5,
          padding: 10,
        }}
      >
        <Text>Hours</Text>
        <Picker
          selectedValue={hours}
          style={{ flex: 1 }}
          onValueChange={setHours}
        >
          {[...Array(24).keys()].map((hour) => (
            <Picker.Item key={hour} label={`${hour}`} value={hour} />
          ))}
        </Picker>

        <Text>Minutes</Text>
        <Picker
          selectedValue={minutes}
          style={{ flex: 1 }}
          onValueChange={setMinutes}
        >
          {[...Array(60).keys()].map((minute) => (
            <Picker.Item key={minute} label={`${minute}`} value={minute} />
          ))}
        </Picker>
      </View>

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={{
          borderWidth: 1,
          borderRadius: 5,
          padding: 10,
          marginVertical: 10,
          height: 80,
        }}
      />

      <Button
        title={editingIndex !== null ? "Update Task" : "Add Task"}
        onPress={handleAddOrUpdateTask}
        color="rgb(0, 41, 87)"
      />

      <View style={{ marginTop: 10, marginBottom: 10 }}>
        <Button
          title="View Added Tasks"
          onPress={() => {
            console.log(
              "Viewing tasks for date:",
              selectedDate,
              tasksForSelectedDate
            );
            setTaskReviewVisible(true);
          }}
          color="orange"
        />
      </View>

      <Modal
        visible={taskReviewVisible}
        animationType="slide"
        transparent={true}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              padding: 20,
              borderRadius: 10,
              maxHeight: "80%",
              
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "bold",
                marginBottom: 10,
              }}
            >
              Tasks for {selectedDate}
            </Text>

            <ScrollView>
              {Array.isArray(tasksForSelectedDate) &&
              tasksForSelectedDate.length > 0 ? (
                tasksForSelectedDate
                  .flat()
                  .filter(
                    (task) =>
                      typeof task.taskTitle === "string" &&
                      task.taskTitle.trim() !== ""
                  )
                  .map((task, index) => (
                    <View
                      key={index}
                      style={{
                        marginBottom: 10,
                        padding: 10,
                        borderWidth: 1,
                        borderRadius: 5,
                        borderColor: "gray",
                        backgroundColor: "#f9f9f9",
                      }}
                    >
                      <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                        Task Title: {task.taskTitle}
                      </Text>
                      <Text>Project: {task.assignedProject}</Text>
                      <Text>
                        Duration: {task.hours} hrs {task.minutes} mins
                      </Text>
                      <Text>Billable: {task.isBillable ? "Yes" : "No"}</Text>
                      <Text>Description: {task.description}</Text>

                      <View
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          marginTop: 15,
                          
                        }}
                      >
                        <TouchableOpacity
                          onPress={() => handleEditTask(task, index)}
                        >
                          <FontAwesome name="edit" size={20} color="orange" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteTask(index)}
                        >
                          <FontAwesome name="trash" size={20} color="red" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              ) : (
                <Text style={{ textAlign: "center" }}>
                  No tasks added for this date.
                </Text>
              )}
            </ScrollView>

            <Button
              title="Close"
              onPress={() => setTaskReviewVisible(false)}
              color="rgb(0, 41, 87)"
              
            />
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
