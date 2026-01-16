// Screen/Timesheet/Timesheet.tsx

import React, { useState, useEffect } from "react";
import { FontAwesome } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import LottieView from "lottie-react-native";
import {
  TimesheetTask,
  Project,
  getTasksByDate,
  addTasks,
  updateTask,
  deleteTask,
  getProjects,
  clearCache,
} from "../../Services/Timesheet/timesheetService";

const { width, height } = Dimensions.get("window");

interface TimesheetFormProps {
  selectedDate: string;
  onTasksUpdated: () => void;
  closeModal: () => void;
}

export default function TimesheetForm({
  selectedDate,
  onTasksUpdated,
  closeModal,
}: TimesheetFormProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [projectId, setProjectId] = useState(0);
  const [customProject, setCustomProject] = useState("");
  const [showCustomProject, setShowCustomProject] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isBillable, setIsBillable] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [existingTasks, setExistingTasks] = useState<TimesheetTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  // Custom Alert Modal State
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: "success" | "error" | "warning" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    type: "success",
    title: "",
    message: "",
  });

  // Lottie animation sources
  const lottieAnimations = {
    success: require("../../assets/animations/success.json"),
    error: require("../../assets/animations/error.json"),
    warning: require("../../assets/animations/cancel.json"),
    confirm: require("../../assets/animations/cancel.json"),
  };

  useEffect(() => {
    console.log("[Form] Component mounted for date:", selectedDate);
    loadInitialData();
  }, [selectedDate]);

  const loadInitialData = async () => {
    console.log("  [Form] Loading initial data...");
    setLoading(true);
    try {
      const [projectsData, tasksData] = await Promise.all([
        getProjects(),
        getTasksByDate(selectedDate),
      ]);
      console.log("  [Form] Projects loaded:", projectsData.length);
      console.log("  [Form] Tasks loaded:", tasksData.length);
      setProjects(projectsData);
      setExistingTasks(tasksData);
    } catch (error) {
      console.error("  [Form] Error loading initial data:", error);
      showAlert("error", "Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setTaskTitle("");
    setTaskDescription("");
    setProjectId(0);
    setCustomProject("");
    setShowCustomProject(false);
    setHours(0);
    setMinutes(0);
    setIsBillable(false);
    setEditingTaskId(null);
  };

  const getTotalMinutes = (): number => {
    return hours * 60 + minutes;
  };

  const setTimeFromMinutes = (totalMinutes: number) => {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    setHours(h);
    setMinutes(m);
  };

  const validateForm = (): boolean => {
    if (!taskTitle.trim()) {
      showAlert("warning", "Validation Error", "Please enter a task title.");
      return false;
    }

    if (!taskDescription.trim()) {
      showAlert(
        "warning",
        "Validation Error",
        "Please enter a task description."
      );
      return false;
    }

    if (getTotalMinutes() <= 0) {
      showAlert(
        "warning",
        "Validation Error",
        "Please enter valid time (greater than 0)."
      );
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const finalProjectName =
        showCustomProject && customProject
          ? customProject
          : projects.find((p) => p.projectId === projectId)?.projectName ||
            "No Project";

      const taskData: TimesheetTask = {
        taskTitle: taskTitle.trim(),
        taskDescription: taskDescription.trim(),
        taskDate: selectedDate,
        projectId: showCustomProject ? 0 : projectId,
        projectName: finalProjectName,
        minutes: getTotalMinutes(),
        billable: isBillable,
      };

      if (editingTaskId) {
        console.log("  [Form] Updating task:", editingTaskId);
        await updateTask({ ...taskData, taskId: editingTaskId });
      } else {
        console.log("  [Form] Adding new task");
        await addTasks([taskData]);
      }

      clearForm();
      await onTasksUpdated();
      await loadInitialData();

      showAlert(
        "success",
        "Success",
        editingTaskId
          ? "Task updated successfully!"
          : "Task added successfully!",
        async () => {
          clearForm();
          await onTasksUpdated();
          await loadInitialData();
        }
      );
    } catch (error: any) {
      console.error("  [Form] Error submitting task:", error);
      if (!error.message?.includes("JSON")) {
        showAlert("error", "Error", "Failed to submit task. Please try again.");
      } else {
        clearForm();
        await onTasksUpdated();
        await loadInitialData();
        showAlert(
          "success",
          "Success",
          editingTaskId
            ? "Task updated successfully!"
            : "Task added successfully!"
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditTask = (task: TimesheetTask) => {
    console.log("  [Form] Editing task:", task.taskId);
    setTaskTitle(task.taskTitle || "");
    setTaskDescription(task.taskDescription || "");
    setProjectId(task.projectId || 0);
    const taskMinutes = task.minutes || task.minutesSpend || 0;
    setTimeFromMinutes(taskMinutes);
    const billableValue =
      typeof task.billable === "string"
        ? task.billable.toLowerCase() === "yes"
        : Boolean(task.billable);
    setIsBillable(billableValue);
    setEditingTaskId(task.taskId || null);
  };

  const handleDeleteTask = async (taskId: number) => {
    showConfirmAlert(
      "Confirm Delete",
      "Are you sure you want to delete this task?",
      async () => {
        setDeleting(taskId);
        try {
          await deleteTask(taskId);
          await onTasksUpdated();
          await loadInitialData();
          showAlert("success", "Success", "Task deleted successfully!");
        } catch (error: any) {
          console.error("  [Form] Error deleting task:", error);
          await onTasksUpdated();
          await loadInitialData();
          showAlert("success", "Success", "Task deleted successfully!");
        } finally {
          setDeleting(null);
        }
      }
    );
  };

  const formatMinutesToHoursAndMinutes = (totalMinutes: number): string => {
    if (!totalMinutes || isNaN(totalMinutes)) return "0h 0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const getTotalHoursForDate = (): string => {
    const totalMinutes = existingTasks.reduce((sum, task) => {
      const taskMinutes = task.minutes || task.minutesSpend || 0;
      return sum + taskMinutes;
    }, 0);
    return formatMinutesToHoursAndMinutes(totalMinutes);
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);

    if (selectedDate) {
      setHours(selectedDate.getHours());
      setMinutes(selectedDate.getMinutes());
    }
  };

  // Updated Alert Functions with Lottie
  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
    onClose?: () => void
  ) => {
    setAlertConfig({ type, title, message, onConfirm: onClose });
    setAlertVisible(true);
  };

  const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void
  ) => {
    setAlertConfig({ type: "confirm", title, message, onConfirm });
    setAlertVisible(true);
  };

  // Custom Alert Modal Component
  const CustomAlertModal = () => {
    const getLottieSource = () => {
      switch (alertConfig.type) {
        case "success":
          return lottieAnimations.success;
        case "error":
          return lottieAnimations.error;
        case "warning":
          return lottieAnimations.warning;
        case "confirm":
          return lottieAnimations.confirm;
        default:
          return lottieAnimations.success;
      }
    };

    return (
      <Modal
        visible={alertVisible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              <LottieView
                source={getLottieSource()}
                autoPlay
                loop={false}
                style={styles.lottieAnimation}
              />

              <Text style={styles.alertTitle}>{alertConfig.title}</Text>
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>

              <View style={styles.alertButtonContainer}>
                {alertConfig.type === "confirm" ? (
                  <>
                    <TouchableOpacity
                      style={[styles.alertButton, styles.alertCancelButton]}
                      onPress={() => setAlertVisible(false)}
                    >
                      <Text style={styles.alertCancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.alertButton}
                      onPress={() => {
                        setAlertVisible(false);
                        alertConfig.onConfirm?.();
                      }}
                    >
                      <LinearGradient
                        colors={["#EF4444", "#DC2626"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.alertConfirmGradient}
                      >
                        <Text style={styles.alertConfirmButtonText}>
                          Delete
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    style={styles.alertButton}
                    onPress={() => {
                      setAlertVisible(false);
                      alertConfig.onConfirm?.();
                    }}
                  >
                    <LinearGradient
                      colors={["rgb(0, 41, 87)", "rgb(0, 61, 117)"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.alertOkGradient}
                    >
                      <Text style={styles.alertOkButtonText}>OK</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // Custom Project Picker Modal
  const ProjectPickerModal = () => (
    <Modal
      visible={showProjectPicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowProjectPicker(false)}
    >
      <TouchableOpacity 
        style={styles.pickerModalOverlay}
        activeOpacity={1}
        onPress={() => setShowProjectPicker(false)}
      >
        <View style={styles.pickerModalContainer}>
          <View style={styles.pickerHeader}>
            <Text style={styles.pickerHeaderText}>Select Project</Text>
            <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
              <FontAwesome name="times" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.pickerScrollView}>
            <TouchableOpacity
              style={[
                styles.pickerItem,
                projectId === 0 && styles.pickerItemSelected
              ]}
              onPress={() => {
                setProjectId(0);
                setShowProjectPicker(false);
              }}
            >
              <Text style={[
                styles.pickerItemText,
                projectId === 0 && styles.pickerItemTextSelected
              ]}>
                Select a project
              </Text>
              {projectId === 0 && (
                <FontAwesome name="check" size={16} color="rgb(0, 41, 87)" />
              )}
            </TouchableOpacity>

            {projects.map((project) => (
              <TouchableOpacity
                key={project.projectId}
                style={[
                  styles.pickerItem,
                  projectId === project.projectId && styles.pickerItemSelected
                ]}
                onPress={() => {
                  setProjectId(project.projectId);
                  setShowProjectPicker(false);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  projectId === project.projectId && styles.pickerItemTextSelected
                ]}>
                  {project.projectName}
                </Text>
                {projectId === project.projectId && (
                  <FontAwesome name="check" size={16} color="rgb(0, 41, 87)" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </TouchableOpacity>
    </Modal>
  );

  // Professional Loading Component
  const LoadingOverlay = ({ message }: { message: string }) => (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={["rgb(0, 41, 87)", "rgb(0, 61, 117)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  if (loading) {
    return <LoadingOverlay message="Loading..." />;
  }

  const selectedProjectName = projects.find(p => p.projectId === projectId)?.projectName || "Select a project";

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" /> */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Enhanced Task Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <FontAwesome name="file-text-o" size={18} color="rgb(0, 41, 87)" />
            <Text style={styles.sectionTitle}>
              {editingTaskId ? "Edit Task" : "Add New Task"}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome
                name="pencil"
                size={16}
                color="#6B7280"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="Enter task title"
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Description *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome
                name="align-left"
                size={16}
                color="#6B7280"
                style={styles.inputIconTextArea}
              />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter task description"
                value={taskDescription}
                onChangeText={setTaskDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Enhanced Project Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project</Text>

            {showCustomProject ? (
              <View style={styles.inputContainer}>
                <FontAwesome
                  name="tag"
                  size={16}
                  color="#6B7280"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter custom project name"
                  value={customProject}
                  onChangeText={setCustomProject}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.customPickerButton}
                onPress={() => setShowProjectPicker(true)}
              >
                <FontAwesome name="briefcase" size={16} color="#6B7280" />
                <Text style={[
                  styles.customPickerText,
                  projectId === 0 && styles.customPickerPlaceholder
                ]}>
                  {selectedProjectName}
                </Text>
                <FontAwesome name="chevron-down" size={14} color="#6B7280" />
              </TouchableOpacity>
            )}
          </View>

          {/* Enhanced Time Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Time Spent *</Text>
            <TouchableOpacity
              style={styles.timeInputButton}
              onPress={() => setShowTimePicker(true)}
            >
              <FontAwesome name="clock-o" size={18} color="rgb(0, 41, 87)" />
              <Text style={styles.timeInputText}>
                {formatMinutesToHoursAndMinutes(getTotalMinutes())}
              </Text>
              <FontAwesome name="chevron-down" size={14} color="#6B7280" />
            </TouchableOpacity>

            <Text style={styles.helperText}>
              Tap to select hours and minutes • {getTotalMinutes()} minutes total
            </Text>
          </View>

          <View style={styles.switchContainer}>
            <View style={styles.switchLabelContainer}>
              <FontAwesome name="dollar" size={16} color="rgb(0, 41, 87)" />
              <Text style={styles.switchLabel}>Billable</Text>
            </View>
            <Switch
              value={isBillable}
              onValueChange={setIsBillable}
              trackColor={{ false: "#D1D5DB", true: "rgba(0, 41, 87, 0.5)" }}
              thumbColor={isBillable ? "rgb(0, 41, 87)" : "#f4f3f4"}
            />
          </View>

          {/* Enhanced Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearForm}
              disabled={saving}
            >
              <FontAwesome name="times" size={14} color="#6B7280" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              <LinearGradient
                colors={["rgb(0, 41, 87)", "rgb(0, 61, 117)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <FontAwesome name="check" size={14} color="white" />
                )}
                <Text style={styles.submitButtonText}>
                  {saving
                    ? editingTaskId
                      ? "Updating..."
                      : "Submitting..."
                    : editingTaskId
                    ? "Update Task"
                    : "Submit Task"}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Tasks List */}
        <View style={styles.tasksContainer}>
          <View style={styles.tasksHeader}>
            <FontAwesome name="list-ul" size={16} color="rgb(0, 41, 87)" />
            <Text style={styles.sectionTitle}>
              Today's Tasks ({existingTasks.length})
            </Text>
          </View>

          {existingTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={["rgba(0, 41, 87, 0.05)", "rgba(0, 41, 87, 0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyStateCard}
              >
                <FontAwesome
                  name="calendar-times-o"
                  size={40}
                  color="rgba(0, 41, 87, 0.3)"
                />
                <Text style={styles.emptyStateText}>
                  No tasks logged for this date
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Add your first task using the form above
                </Text>
              </LinearGradient>
            </View>
          ) : (
            existingTasks.map((task, index) => {
              const taskMinutes = task.minutes || task.minutesSpend || 0;
              const taskBillable =
                typeof task.billable === "string"
                  ? task.billable.toLowerCase() === "yes"
                  : Boolean(task.billable);

              return (
                <View key={task.taskId || index} style={styles.taskCard}>
                  <LinearGradient
                    colors={["#ffffff", "#f9fafb"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.taskCardGradient}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleContainer}>
                        <FontAwesome
                          name="check-circle"
                          size={14}
                          color="#10B981"
                        />
                        <Text style={styles.taskTitle}>
                          {task.taskTitle || "Untitled Task"}
                        </Text>
                      </View>
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => handleEditTask(task)}
                        >
                          <FontAwesome name="edit" size={14} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() =>
                            task.taskId && handleDeleteTask(task.taskId)
                          }
                          disabled={deleting === task.taskId}
                        >
                          {deleting === task.taskId ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <FontAwesome name="trash" size={14} color="white" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    <Text style={styles.taskDescription}>
                      {task.taskDescription || "No description provided"}
                    </Text>

                    <View style={styles.taskFooter}>
                      <View style={styles.taskDetail}>
                        <FontAwesome
                          name="briefcase"
                          size={12}
                          color="#6B7280"
                        />
                        <Text style={styles.taskDetailText}>
                          {task.projectName || "Unknown Project"}
                        </Text>
                      </View>
                      <View style={styles.taskDetail}>
                        <FontAwesome name="clock-o" size={12} color="#6B7280" />
                        <Text style={styles.taskDetailText}>
                          {formatMinutesToHoursAndMinutes(taskMinutes)}
                        </Text>
                      </View>
                      <View style={styles.taskDetail}>
                        <FontAwesome
                          name="dollar"
                          size={12}
                          color={taskBillable ? "#10B981" : "#6B7280"}
                        />
                        <Text
                          style={[
                            styles.taskDetailText,
                            taskBillable && styles.billableText,
                          ]}
                        >
                          {taskBillable ? "Billable" : "Non-billable"}
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {showTimePicker && (
        <DateTimePicker
          value={new Date(0, 0, 0, hours, minutes)}
          mode="time"
          is24Hour={false}
          display={Platform.OS === "android" ? "clock" : "spinner"}
          onChange={onTimeChange}
        />
      )}

      <ProjectPickerModal />
      <CustomAlertModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  formContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 10,
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  formHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "rgb(0, 41, 87)",
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconTextArea: {
    marginRight: 12,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    padding: 0,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  customPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  customPickerText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  customPickerPlaceholder: {
    color: "#9CA3AF",
    fontWeight: "400",
  },
  timeInputButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  timeInputText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
    fontWeight: "600",
  },
  helperText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 6,
    fontStyle: "italic",
  },
  switchContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 18,
  },
  switchLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgb(0, 41, 87)",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
    height: 48,
  },
  clearButtonText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
    height: 48,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
    height: "100%",
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  tasksContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    marginTop: 20,
    borderRadius: 20,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    marginVertical: 10,
  },
  emptyStateCard: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: "100%",
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 14,
    color: "rgba(0, 41, 87, 0.7)",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 12,
    color: "rgba(0, 41, 87, 0.5)",
    textAlign: "center",
  },
  taskCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  taskCardGradient: {
    padding: 14,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1F2937",
  },
  taskActions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    padding: 8,
    minWidth: 36,
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    padding: 8,
    minWidth: 36,
    alignItems: "center",
  },
  taskDescription: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
    lineHeight: 18,
    fontStyle: "italic",
  },
  taskFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  taskDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskDetailText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  billableText: {
    color: "#10B981",
    fontWeight: "600",
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: "rgb(0, 41, 87)",
  },
  loadingGradient: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingCard: {
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "white",
    fontWeight: "600",
  },
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  alertContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    width: "90%",
    maxWidth: 340,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  alertContent: {
    padding: 24,
    alignItems: "center",
  },
  lottieAnimation: {
    width: 120,
    height: 120,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  alertButtonContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  alertButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  alertCancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCancelButtonText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  alertConfirmGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertConfirmButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  alertOkGradient: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertOkButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Project Picker Modal Styles
  pickerModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerModalContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  pickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  pickerHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  pickerScrollView: {
    maxHeight: height * 0.5,
  },
  pickerItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  pickerItemSelected: {
    backgroundColor: "rgba(0, 41, 87, 0.05)",
  },
  pickerItemText: {
    fontSize: 16,
    color: "#374151",
    fontWeight: "500",
  },
  pickerItemTextSelected: {
    color: "rgb(0, 41, 87)",
    fontWeight: "600",
  },
});