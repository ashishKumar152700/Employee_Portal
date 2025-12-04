
// Screen/Timesheet/Timesheet.tsx

import React, { useState, useEffect } from "react";
import { Picker } from "@react-native-picker/picker";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

const { width } = Dimensions.get("window");

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

      // Show success alert only once after everything is done
      showAlert(
        "success",
        "Success",
        editingTaskId
          ? "Task updated successfully!"
          : "Task added successfully!"
      );
    } catch (error: any) {
      console.error("  [Form] Error submitting task:", error);
      // Only show error if it's a real error (not JSON parse)
      if (!error.message?.includes("JSON")) {
        showAlert("error", "Error", "Failed to submit task. Please try again.");
      } else {
        // For JSON parse errors, still refresh and show success
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
          // Still refresh on error as operation likely succeeded
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

  // Updated Alert Functions with Lottie
  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    message: string
  ) => {
    setAlertConfig({ type, title, message });
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
        transparent
        animationType="fade"
        onRequestClose={() => setAlertVisible(false)}
      >
        <View style={styles.alertOverlay}>
          <View style={styles.alertContainer}>
            <View style={styles.alertContent}>
              {/* Lottie Animation */}
              <LottieView
                source={getLottieSource()}
                autoPlay
                loop={false}
                style={styles.lottieAnimation}
              />

              {/* Alert Title */}
              <Text style={styles.alertTitle}>{alertConfig.title}</Text>

              {/* Alert Message */}
              <Text style={styles.alertMessage}>{alertConfig.message}</Text>

              {/* Action Buttons */}
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
                    onPress={() => setAlertVisible(false)}
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

  // Digital Round Clock Component
  const DigitalClock = () => {
    const getClockDegrees = () => {
      const hourAngle = (hours % 12) * 30 + minutes * 0.5;
      const minuteAngle = minutes * 6;
      return { hourAngle, minuteAngle };
    };

    const { hourAngle, minuteAngle } = getClockDegrees();

    return (
      <View style={styles.clockContainer}>
        <View style={styles.clockFace}>
          {/* Clock numbers */}
          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((num, index) => {
            const angle = (index * 30 - 90) * (Math.PI / 180);
            const radius = 70;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <Text
                key={num}
                style={[
                  styles.clockNumber,
                  {
                    left: 90 + x - 10,
                    top: 90 + y - 10,
                  },
                ]}
              >
                {num}
              </Text>
            );
          })}

          {/* Center dot */}
          <View style={styles.clockCenter} />

          {/* Hour hand */}
          <View
            style={[
              styles.hourHand,
              {
                transform: [{ rotate: `${hourAngle}deg` }],
              },
            ]}
          />

          {/* Minute hand */}
          <View
            style={[
              styles.minuteHand,
              {
                transform: [{ rotate: `${minuteAngle}deg` }],
              },
            ]}
          />
        </View>

        {/* Digital Display */}
        <View style={styles.digitalDisplay}>
          <Text style={styles.digitalTime}>
            {String(hours).padStart(2, "0")}:{String(minutes).padStart(2, "0")}
          </Text>
          <Text style={styles.digitalLabel}>
            {formatMinutesToHoursAndMinutes(getTotalMinutes())}
          </Text>
        </View>
      </View>
    );
  };

  // Time Picker Component with Digital Clock
  const renderTimePicker = () => (
    <Modal
      visible={showTimePicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.timePickerOverlay}>
        <View style={styles.timePickerContainer}>
          <LinearGradient
            colors={["rgb(0, 41, 87)", "rgb(0, 61, 117)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.timePickerHeader}
          >
            <Text style={styles.timePickerTitle}>Select Time</Text>
          </LinearGradient>

          <View style={styles.timePickerContent}>
            {/* Digital Clock Display */}
            <DigitalClock />

            {/* Time Pickers */}
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hours</Text>
                <Picker
                  selectedValue={hours}
                  onValueChange={(value) => setHours(value)}
                  style={styles.timePicker}
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <Picker.Item key={i} label={`${i}`} value={i} />
                  ))}
                </Picker>
              </View>

              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <Picker
                  selectedValue={minutes}
                  onValueChange={(value) => setMinutes(value)}
                  style={styles.timePicker}
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                    <Picker.Item key={m} label={`${m}`} value={m} />
                  ))}
                </Picker>
              </View>
            </View>

            <View style={styles.timePickerButtons}>
              <TouchableOpacity
                style={[styles.timePickerButton, styles.timePickerCancelButton]}
                onPress={() => setShowTimePicker(false)}
              >
                <Text style={styles.timePickerCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => setShowTimePicker(false)}
              >
                <LinearGradient
                  colors={["rgb(0, 41, 87)", "rgb(0, 61, 117)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.timePickerDoneGradient}
                >
                  <Text style={styles.timePickerDoneText}>Done</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return <LoadingOverlay message="Loading..." />;
  }

  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
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
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={projectId}
                  onValueChange={(value) => setProjectId(value)}
                  style={styles.picker}
                >
                  <Picker.Item label="Select a project" value={0} />
                  {projects.map((project) => (
                    <Picker.Item
                      key={project.projectId}
                      label={project.projectName}
                      value={project.projectId}
                    />
                  ))}
                </Picker>
              </View>
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
              Tap to select hours and minutes • {getTotalMinutes()} minutes
              total
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

      {renderTimePicker()}
      <CustomAlertModal />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollContent: {
    paddingBottom: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: "center",
  },
  dateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 6,
    textAlign: "center",
  },
  totalHoursContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  totalHoursText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    fontWeight: "600",
  },
  formContainer: {
    backgroundColor: "white",
    margin: 15,
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
    marginBottom: 10,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "rgb(0, 41, 87)",
    marginTop: 5,
    marginBottom: 5,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 10,
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
    fontSize: 14,
    color: "#374151",
    padding: 0,
  },
  textArea: {
    minHeight: 18,
    textAlignVertical: "top",
    paddingTop: 0,
  },
  projectToggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  projectToggle: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  projectToggleActive: {
    backgroundColor: "rgb(0, 41, 87)",
    shadowColor: "rgb(0, 41, 87)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  projectToggleText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "700",
  },
  projectToggleTextActive: {
    color: "white",
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingLeft: 12, // Reduced from 16 to 12
    paddingVertical: 5,
    height: 40,
  },
  picker: {
    flex: 1,
    height: 80,
    fontSize: 14,  // Increased from 8 to make text fully visible
  color: '#374151',  // Add text color for better visibility
  },
  timeInputButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 18,
  },
  timeInputText: {
    flex: 1,
    fontSize: 14,
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
    paddingVertical: 0,
    marginBottom: 5,
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
  },
  clearButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 8,
    height: 40,
  },
  clearButtonText: {
    color: "#6B7280",
    fontSize: 14,
    fontWeight: "600",
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
    height: 40,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  submitButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  // Digital Clock Styles
  clockContainer: {
    alignItems: "center",
    marginBottom: 20,
    gap: 15,
  },
  clockFace: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#ffffff",
    borderWidth: 3,
    borderColor: "rgb(0, 41, 87)",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  clockNumber: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "bold",
    color: "rgb(0, 41, 87)",
    width: 20,
    textAlign: "center",
  },
  clockCenter: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgb(0, 41, 87)",
    position: "absolute",
    zIndex: 10,
  },
  hourHand: {
    position: "absolute",
    width: 4,
    height: 40,
    backgroundColor: "rgb(0, 41, 87)",
    borderRadius: 2,
    bottom: "50%",
    left: "50%",
    marginLeft: -2,
    transformOrigin: "bottom",
  },
  minuteHand: {
    position: "absolute",
    width: 3,
    height: 55,
    backgroundColor: "#3B82F6",
    borderRadius: 1.5,
    bottom: "50%",
    left: "50%",
    marginLeft: -1.5,
    transformOrigin: "bottom",
  },
  digitalDisplay: {
    backgroundColor: "rgb(0, 41, 87)",
    paddingHorizontal: 24,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: "center",
  },
  digitalTime: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
    letterSpacing: 2,
  },
  digitalLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    // marginTop: 4,
  },
  // Time Picker Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  timePickerContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    width: "100%",
    maxWidth: 350,
    overflow: "hidden",
  },
  timePickerHeader: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  timePickerContent: {
    padding: 25,
  },
  timePickerRow: {
    flexDirection: "row",
    gap: 20,
    // marginBottom: 10,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: "center",
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    // marginBottom: 10,
  },
  timePicker: {
    width: "100%",
    height: 80,
  },
  timePickerButtons: {
    flexDirection: "row",
    gap: 12,
  },
  timePickerButton: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
  timePickerCancelButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    alignItems: "center",
  },
  timePickerCancelText: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
  timePickerDoneButton: {
    overflow: "hidden",
  },
  timePickerDoneGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  timePickerDoneText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  // Tasks List Styles
  tasksContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
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
    marginBottom: 10,
    gap: 12,
  },
  emptyState: {
    alignItems: "center",
    marginBottom: 10,
  },
  emptyStateCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: "100%",
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 12,
    color: "rgba(0, 41, 87, 0.7)",
    fontWeight: "600",
    textAlign: "center",
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 11,
    color: "rgba(0, 41, 87, 0.5)",
    textAlign: "center",
  },
  taskCard: {
    borderRadius: 12,
    marginBottom: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  taskCardGradient: {
    padding: 10,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginRight: 8,
  },
  taskTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
  },
  taskActions: {
    flexDirection: "row",
    gap: 6,
  },
  editButton: {
    backgroundColor: "#3B82F6",
    borderRadius: 6,
    padding: 6,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    borderRadius: 6,
    padding: 6,
  },
  taskDescription: {
    fontSize: 12,
    color: "#6B7280",
    marginBottom: 10,
    lineHeight: 16,
    fontStyle: "italic",
  },
  taskFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  taskDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  taskDetailText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
  },
  billableText: {
    color: "#10B981",
    fontWeight: "600",
  },
  loadingOverlay: {
    position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: 1000,
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
    fontSize: 14,
    color: "white",
    fontWeight: "600",
  },
  // Custom Alert Modal Styles
  alertOverlay: {
   flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
  },
  alertContainer: {
     backgroundColor: '#ffffff',
  borderRadius: 24,
  width: '90%',
  maxWidth: 340,
  overflow: 'hidden',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.3,
  shadowRadius: 20,
  elevation: 10,
  },
  alertContent: {
    padding: 20,
    alignItems: "center",
  },
  lottieAnimation: {
    width: 140,
    height: 140,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 12,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
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
});
