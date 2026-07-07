import React, { useState, useEffect, useRef, memo } from "react";
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
  Animated,
  KeyboardAvoidingView,
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

const PRIMARY = "rgb(0, 41, 87)";
const PRIMARY_DARK = "rgb(0, 28, 60)";
const PRIMARY_LIGHT = "rgb(0, 61, 117)";
const PRIMARY_ULTRA_LIGHT = "rgba(0, 41, 87, 0.06)";

const STEPS = [
  { label: "Task Info", icon: "pencil" },
  { label: "Project & Time", icon: "clock-o" },
  { label: "Review", icon: "check-circle" },
];

interface TimesheetFormProps {
  selectedDate: string;
  onTasksUpdated: () => void;
  closeModal: () => void;
}

function TimesheetForm({
  selectedDate,
  onTasksUpdated,
  closeModal,
}: TimesheetFormProps) {
  // ─── Wizard state ────────────────────────────────────────────────────
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ─── Form state (unchanged) ──────────────────────────────────────────
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

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<{
    type: "success" | "error" | "warning" | "confirm";
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ type: "success", title: "", message: "" });

  const lottieAnimations = {
    success: require("../../assets/animations/success.json"),
    error: require("../../assets/animations/error.json"),
    warning: require("../../assets/animations/cancel.json"),
    confirm: require("../../assets/animations/cancel.json"),
  };

  // ─── Init (unchanged) ────────────────────────────────────────────────
  useEffect(() => {
    console.log("[Form] Component mounted for date:", selectedDate);
    loadInitialData();
  }, [selectedDate]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [projectsData, tasksData] = await Promise.all([
        getProjects(),
        getTasksByDate(selectedDate),
      ]);
      setProjects(projectsData);
      setExistingTasks(tasksData);
    } catch (error) {
      showAlert("error", "Error", "Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ─── Helpers (unchanged) ─────────────────────────────────────────────
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
    animateToStep(0);
  };

  const getTotalMinutes = (): number => hours * 60 + minutes;

  const setTimeFromMinutes = (totalMinutes: number) => {
    setHours(Math.floor(totalMinutes / 60));
    setMinutes(totalMinutes % 60);
  };

  const formatMinutesToHoursAndMinutes = (totalMinutes: number): string => {
    if (!totalMinutes || isNaN(totalMinutes)) return "0h 0m";
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h}h ${m}m`;
  };

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === "android") setShowTimePicker(false);
    if (selectedDate) {
      setHours(selectedDate.getHours());
      setMinutes(selectedDate.getMinutes());
    }
  };

  // ─── Wizard navigation ───────────────────────────────────────────────
  const animateToStep = (next: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    setCurrentStep(next);
  };

  const validateStep = (step: number): boolean => {
    if (step === 0) {
      if (!taskTitle.trim()) {
        showAlert("warning", "Missing Info", "Please enter a task title.");
        return false;
      }
      if (!taskDescription.trim()) {
        showAlert("warning", "Missing Info", "Please enter a task description.");
        return false;
      }
    }
    if (step === 1) {
      if (getTotalMinutes() <= 0) {
        showAlert("warning", "Missing Info", "Please set time spent (greater than 0).");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) animateToStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) animateToStep(currentStep - 1);
  };

  // ─── Submit / Edit / Delete (all logic unchanged) ────────────────────
  const handleSubmit = async () => {
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
        await updateTask({ ...taskData, taskId: editingTaskId });
      } else {
        await addTasks([taskData]);
      }


      clearForm();
      await onTasksUpdated();
      await loadInitialData();

      showAlert(
        "success",
        "Success",
        editingTaskId ? "Task updated successfully!" : "Task added successfully!",
        async () => {
          clearForm();
          await onTasksUpdated();
          await loadInitialData();
        },
      );
    } catch (error: any) {
      if (!error.message?.includes("JSON")) {
        showAlert("error", "Error", "Failed to submit task. Please try again.");
      } else {
        clearForm();
        await onTasksUpdated();
        await loadInitialData();
        showAlert(
          "success",
          "Success",
          editingTaskId ? "Task updated successfully!" : "Task added successfully!",
        );
      }
    } finally {
      setSaving(false);
    }
  };

  const handleEditTask = (task: TimesheetTask) => {
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
    animateToStep(0);
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
          await onTasksUpdated();
          await loadInitialData();
          showAlert("success", "Success", "Task deleted successfully!");
        } finally {
          setDeleting(null);
        }
      },
    );
  };

  // ─── Alert helpers (unchanged) ───────────────────────────────────────
  const showAlert = (
    type: "success" | "error" | "warning",
    title: string,
    message: string,
    onClose?: () => void,
  ) => {
    setAlertConfig({ type, title, message, onConfirm: onClose });
    setAlertVisible(true);
  };

  const showConfirmAlert = (
    title: string,
    message: string,
    onConfirm: () => void,
  ) => {
    setAlertConfig({ type: "confirm", title, message, onConfirm });
    setAlertVisible(true);
  };

  const selectedProjectName =
    projects.find((p) => p.projectId === projectId)?.projectName ||
    "Select a project";


  // ─── Premium Step Indicator ──────────────────────────────────────────
  const StepIndicator = () => (
    <View style={styles.stepIndicatorWrapper}>
      {/* Progress bar background */}
      <View style={styles.progressBarBg}>
        <Animated.View
          style={[
            styles.progressBarFill,
            { width: `${((currentStep) / (STEPS.length - 1)) * 100}%` },
          ]}
        />
      </View>

      {/* Step bubbles */}
      <View style={styles.stepBubbleRow}>
        {STEPS.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;
          return (
            <View key={index} style={styles.stepBubbleItem}>
              <View
                style={[
                  styles.stepBubble,
                  isActive && styles.stepBubbleActive,
                  isCompleted && styles.stepBubbleCompleted,
                ]}
              >
                {isCompleted ? (
                  <FontAwesome name="check" size={13} color="white" />
                ) : (
                  <FontAwesome
                    name={step.icon as any}
                    size={13}
                    color={isActive ? "white" : "#C0C9D6"}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.stepBubbleLabel,
                  isActive && styles.stepBubbleLabelActive,
                  isCompleted && styles.stepBubbleLabelCompleted,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  // ─── Step 0 – Task Info ──────────────────────────────────────────────
  const Step0 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
        <Text style={styles.stepHeading}>
          {editingTaskId ? "Edit Task" : "What did you work on?"}
        </Text>
        <Text style={styles.stepSubheading}>
          Give your task a clear title and description
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Task Title *</Text>
          <View style={styles.inputRow}>
            <View style={styles.inputIconBadge}>
              <FontAwesome name="pencil" size={13} color={PRIMARY} />
            </View>
            <TextInput
              style={styles.inputField}
              placeholder="e.g. Fix login bug"
              value={taskTitle}
              onChangeText={setTaskTitle}
              placeholderTextColor="#B0BAC6"
            />
          </View>
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Description *</Text>
          <View style={[styles.inputRow, styles.inputRowMultiline]}>
            <View style={[styles.inputIconBadge, { alignSelf: "flex-start", marginTop: 2 }]}>
              <FontAwesome name="align-left" size={13} color={PRIMARY} />
            </View>
            <TextInput
              style={[styles.inputField, { minHeight: 80, textAlignVertical: "top" }]}
              placeholder="Describe what you did in detail..."
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#B0BAC6"
            />
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );

  // ─── Step 1 – Project & Time ─────────────────────────────────────────
  const Step1 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
    >
      <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
        <Text style={styles.stepHeading}>Project & Time</Text>
        <Text style={styles.stepSubheading}>
          Link to a project and log your hours
        </Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Project</Text>
          {showCustomProject ? (
            <View style={styles.inputRow}>
              <View style={styles.inputIconBadge}>
                <FontAwesome name="tag" size={13} color={PRIMARY} />
              </View>
              <TextInput
                style={styles.inputField}
                placeholder="Enter custom project name"
                value={customProject}
                onChangeText={setCustomProject}
                placeholderTextColor="#B0BAC6"
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.inputRow}
              onPress={() => setShowProjectPicker(true)}
              activeOpacity={0.8}
            >
              <View style={styles.inputIconBadge}>
                <FontAwesome name="briefcase" size={13} color={PRIMARY} />
              </View>
              <Text
                style={[
                  styles.inputField,
                  { flex: 1 },
                  projectId === 0 && { color: "#B0BAC6" },
                ]}
              >
                {selectedProjectName}
              </Text>
              <FontAwesome name="chevron-down" size={12} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Time Spent *</Text>
          <TouchableOpacity
            style={styles.inputRow}
            onPress={() => setShowTimePicker(true)}
            activeOpacity={0.8}
          >
            <View style={styles.inputIconBadge}>
              <FontAwesome name="clock-o" size={14} color={PRIMARY} />
            </View>
            <Text style={[styles.inputField, { flex: 1, fontWeight: "700" }]}>
              {getTotalMinutes() > 0
                ? formatMinutesToHoursAndMinutes(getTotalMinutes())
                : "Tap to set time"}
            </Text>
            <View style={styles.timePill}>
              <Text style={styles.timePillText}>{getTotalMinutes()} min</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.helperNote}>
            Tap the row above to open the time picker
          </Text>
        </View>

        {/* Billable toggle card */}
        <View style={styles.billableCard}>
          <LinearGradient
            colors={[PRIMARY_ULTRA_LIGHT, "rgba(0,41,87,0.02)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.billableGradient}
          >
            <View style={styles.billableLeft}>
              <View style={styles.billableIconBox}>
                <FontAwesome name="dollar" size={15} color={PRIMARY} />
              </View>
              <View>
                <Text style={styles.billableTitle}>Mark as Billable</Text>
                <Text style={styles.billableSubtitle}>
                  Will be invoiced to client
                </Text>
              </View>
            </View>
            <Switch
              value={isBillable}
              onValueChange={setIsBillable}
              trackColor={{
                false: "#D1D5DB",
                true: "rgba(0, 41, 87, 0.45)",
              }}
              thumbColor={isBillable ? PRIMARY : "#f4f3f4"}
            />
          </LinearGradient>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );

  // ─── Step 2 – Review & Submit ────────────────────────────────────────
  const Step2 = () => {
    const finalProjectName =
      showCustomProject && customProject
        ? customProject
        : projects.find((p) => p.projectId === projectId)?.projectName ||
          "No Project";

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      >
        <Animated.View style={[styles.stepContent, { opacity: fadeAnim }]}>
          <Text style={styles.stepHeading}>Review & Submit</Text>
          <Text style={styles.stepSubheading}>
            Confirm your timesheet entry below
          </Text>

          {/* Review gradient card */}
          <View style={styles.reviewCard}>
            <LinearGradient
              colors={[PRIMARY_DARK, PRIMARY_LIGHT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reviewGradient}
            >
              {/* Task title row */}
              <View style={styles.reviewRow}>
                <View style={styles.reviewIconBox}>
                  <FontAwesome name="pencil" size={13} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewMiniLabel}>Task</Text>
                  <Text style={styles.reviewValue}>{taskTitle || "—"}</Text>
                </View>
              </View>
              <View style={styles.reviewSep} />

              {/* Description row */}
              <View style={styles.reviewRow}>
                <View style={styles.reviewIconBox}>
                  <FontAwesome name="align-left" size={13} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewMiniLabel}>Description</Text>
                  <Text style={styles.reviewValue} numberOfLines={2}>
                    {taskDescription || "—"}
                  </Text>
                </View>
              </View>
              <View style={styles.reviewSep} />

              {/* Project row */}
              <View style={styles.reviewRow}>
                <View style={styles.reviewIconBox}>
                  <FontAwesome name="briefcase" size={13} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reviewMiniLabel}>Project</Text>
                  <Text style={styles.reviewValue}>{finalProjectName}</Text>
                </View>
              </View>

              {/* Chips */}
              <View style={styles.reviewChipsRow}>
                <View style={styles.reviewChip}>
                  <FontAwesome name="clock-o" size={12} color={PRIMARY} />
                  <Text style={styles.reviewChipText}>
                    {formatMinutesToHoursAndMinutes(getTotalMinutes())}
                  </Text>
                </View>
                <View
                  style={[
                    styles.reviewChip,
                    isBillable && styles.reviewChipBillable,
                  ]}
                >
                  <FontAwesome
                    name="dollar"
                    size={12}
                    color={isBillable ? "#10B981" : PRIMARY}
                  />
                  <Text
                    style={[
                      styles.reviewChipText,
                      isBillable && { color: "#10B981" },
                    ]}
                  >
                    {isBillable ? "Billable" : "Non-billable"}
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    );
  };

  // ─── Navigation Buttons ──────────────────────────────────────────────
  const NavButtons = () => (
    <View style={styles.navRow}>
      {currentStep === 0 ? (
        <TouchableOpacity
          style={styles.clearBtn}
          onPress={clearForm}
          disabled={saving}
        >
          <FontAwesome name="times" size={13} color="#6B7280" />
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
          <FontAwesome name="chevron-left" size={13} color="#6B7280" />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
      )}

      {currentStep < STEPS.length - 1 ? (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleNext}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[PRIMARY, PRIMARY_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            <Text style={styles.primaryBtnText}>Next</Text>
            <FontAwesome name="chevron-right" size={13} color="white" />
          </LinearGradient>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleSubmit}
          disabled={saving}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={["#059669", "#10B981"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryBtnGradient}
          >
            {saving ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <FontAwesome name="check" size={13} color="white" />
            )}
            <Text style={styles.primaryBtnText}>
              {saving
                ? editingTaskId
                  ? "Updating..."
                  : "Submitting..."
                : editingTaskId
                ? "Update Task"
                : "Submit"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Alert Modal (unchanged logic, restyled) ─────────────────────────
  const CustomAlertModal = () => (
    <Modal
      visible={alertVisible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={() => setAlertVisible(false)}
    >
      <View style={styles.alertOverlay}>
        <View style={styles.alertBox}>
          <LottieView
            source={
              alertConfig.type === "success"
                ? lottieAnimations.success
                : alertConfig.type === "error"
                ? lottieAnimations.error
                : lottieAnimations.warning
            }
            autoPlay
            loop={false}
            style={styles.lottie}
          />
          <Text style={styles.alertTitle}>{alertConfig.title}</Text>
          <Text style={styles.alertMessage}>{alertConfig.message}</Text>
          <View style={styles.alertBtns}>
            {alertConfig.type === "confirm" ? (
              <>
                <TouchableOpacity
                  style={[styles.alertBtn, styles.alertCancelBtn]}
                  onPress={() => setAlertVisible(false)}
                >
                  <Text style={styles.alertCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.alertBtn}
                  onPress={() => {
                    setAlertVisible(false);
                    alertConfig.onConfirm?.();
                  }}
                >
                  <LinearGradient
                    colors={["#EF4444", "#DC2626"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.alertGradientBtn}
                  >
                    <Text style={styles.alertBtnText}>Delete</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.alertBtn}
                onPress={() => {
                  setAlertVisible(false);
                  alertConfig.onConfirm?.();
                }}
              >
                <LinearGradient
                  colors={[PRIMARY, PRIMARY_LIGHT]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.alertGradientBtn}
                >
                  <Text style={styles.alertBtnText}>OK</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  // ─── Project Picker (unchanged logic, restyled) ──────────────────────
  const ProjectPickerModal = () => {
    // Filter out any projects that are "No Project" to avoid duplicates
    const filteredProjects = projects.filter(
      (project) =>
        project.projectId !== 0 && project.projectName !== "No Project",
    );

    return (
      <Modal
        visible={showProjectPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProjectPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowProjectPicker(false)}
        >
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHandle} />
            <View style={styles.pickerHead}>
              <Text style={styles.pickerTitle}>Select Project</Text>
              <TouchableOpacity onPress={() => setShowProjectPicker(false)}>
                <FontAwesome name="times" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: height * 0.5 }}>
              <TouchableOpacity
                style={[
                  styles.pickerOption,
                  projectId === 0 && styles.pickerOptionSelected,
                ]}
                onPress={() => {
                  setProjectId(0);
                  setShowProjectPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerOptionText,
                    projectId === 0 && styles.pickerOptionTextSelected,
                  ]}
                >
                  No Project
                </Text>
                {projectId === 0 && (
                  <FontAwesome name="check" size={15} color={PRIMARY} />
                )}
              </TouchableOpacity>
              {filteredProjects.map((project) => (
                <TouchableOpacity
                  key={project.projectId}
                  style={[
                    styles.pickerOption,
                    projectId === project.projectId &&
                      styles.pickerOptionSelected,
                  ]}
                  onPress={() => {
                    setProjectId(project.projectId);
                    setShowProjectPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      projectId === project.projectId &&
                        styles.pickerOptionTextSelected,
                    ]}
                  >
                    {project.projectName}
                  </Text>
                  {projectId === project.projectId && (
                    <FontAwesome name="check" size={15} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // ─── Loading state ───────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingScreenText}>Loading...</Text>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Wizard Card ───────────────────────────────────────────── */}
        <View style={styles.wizardCard}>
          {/* Decorative top accent */}
          <LinearGradient
            colors={[PRIMARY_DARK, PRIMARY_LIGHT]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.wizardAccentBar}
          />

          {/* Step indicator */}
          <StepIndicator />

          {/* Divider */}
          <View style={styles.wizardDivider} />

          {/* Step-specific content */}
          {currentStep === 0 && <Step0 />}
          {currentStep === 1 && <Step1 />}
          {currentStep === 2 && <Step2 />}

          {/* Navigation */}
          <NavButtons />
        </View>

        {/* ── Today's Tasks ─────────────────────────────────────────── */}
        <View style={styles.tasksCard}>
          {/* Section header */}
          <View style={styles.tasksHeader}>
            <View style={styles.tasksHeaderLeft}>
              <View style={styles.tasksIconBox}>
                <FontAwesome name="list-ul" size={14} color="white" />
              </View>
              <Text style={styles.tasksSectionTitle}>Today's Tasks</Text>
            </View>
            <View style={styles.tasksBadge}>
              <Text style={styles.tasksBadgeText}>{existingTasks.length}</Text>
            </View>
          </View>

          {existingTasks.length === 0 ? (
            /* Empty state */
            <View style={styles.emptyState}>
              <LinearGradient
                colors={[PRIMARY_ULTRA_LIGHT, "rgba(0,41,87,0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyCard}
              >
                <FontAwesome
                  name="calendar-o"
                  size={36}
                  color="rgba(0,41,87,0.2)"
                />
                <Text style={styles.emptyText}>No tasks logged yet</Text>
                <Text style={styles.emptySubtext}>
                  Use the wizard above to log your first task
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
                <View
                  key={task.taskId || index}
                  style={styles.taskItem}
                >
                  {/* Left accent stripe */}
                  <LinearGradient
                    colors={[PRIMARY, PRIMARY_LIGHT]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                    style={styles.taskStripe}
                  />

                  <View style={styles.taskBody}>
                    {/* Top row: title + action buttons */}
                    <View style={styles.taskTopRow}>
                      <View style={styles.taskTitleRow}>
                        <FontAwesome
                          name="check-circle"
                          size={13}
                          color="#10B981"
                        />
                        <Text style={styles.taskTitle} numberOfLines={1}>
                          {task.taskTitle || "Untitled Task"}
                        </Text>
                      </View>
                      <View style={styles.taskActions}>
                        <TouchableOpacity
                          style={styles.editBtn}
                          onPress={() => handleEditTask(task)}
                        >
                          <FontAwesome name="edit" size={12} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteBtn}
                          onPress={() =>
                            task.taskId && handleDeleteTask(task.taskId)
                          }
                          disabled={deleting === task.taskId}
                        >
                          {deleting === task.taskId ? (
                            <ActivityIndicator size="small" color="white" />
                          ) : (
                            <FontAwesome
                              name="trash"
                              size={12}
                              color="white"
                            />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Description */}
                    <Text style={styles.taskDesc} numberOfLines={2}>
                      {task.taskDescription || "No description provided"}
                    </Text>

                    {/* Meta chips */}
                    <View style={styles.taskMetaRow}>
                      <View style={styles.metaChip}>
                        <FontAwesome name="briefcase" size={10} color="#6B7280" />
                        <Text style={styles.metaChipText}>
                          {task.projectName || "No Project"}
                        </Text>
                      </View>
                      <View style={styles.metaChip}>
                        <FontAwesome name="clock-o" size={10} color="#6B7280" />
                        <Text style={styles.metaChipText}>
                          {formatMinutesToHoursAndMinutes(taskMinutes)}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.metaChip,
                          taskBillable && styles.metaChipBillable,
                        ]}
                      >
                        <FontAwesome
                          name="dollar"
                          size={10}
                          color={taskBillable ? "#10B981" : "#6B7280"}
                        />
                        <Text
                          style={[
                            styles.metaChipText,
                            taskBillable && {
                              color: "#10B981",
                              fontWeight: "700",
                            },
                          ]}
                        >
                          {taskBillable ? "Billable" : "Non-billable"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Native time picker */}
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

// ════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════
export default memo(TimesheetForm);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#EEF2F7",
    // paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 18, paddingBottom: 32 },

  // ── Loading screen ───────────────────────────────────────────────────
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEF2F7",
    gap: 12,
  },
  loadingScreenText: {
    fontSize: 16,
    color: "rgb(0,41,87)",
    fontWeight: "600",
  },

  // ── Wizard card ──────────────────────────────────────────────────────
  wizardCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "rgb(0,41,87)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.14,
    shadowRadius: 20,
    elevation: 10,
    marginBottom: 20,
  },
  wizardAccentBar: {
    height: 5,
    width: "100%",
  },
  wizardDivider: {
    height: 1,
    backgroundColor: "#F1F4F8",
    marginHorizontal: 10,
  },

  // ── Step indicator ───────────────────────────────────────────────────
  stepIndicatorWrapper: {
    paddingHorizontal: 24,
    paddingTop: 22,
    paddingBottom: 20,
    position: "relative",
  },
  progressBarBg: {
    position: "absolute",
    top: 35,
    left: 52,
    right: 52,
    height: 3,
    backgroundColor: "#E5EAF0",
    borderRadius: 2,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "rgb(0,41,87)",
    borderRadius: 2,
  },
  stepBubbleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  stepBubbleItem: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  stepBubble: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5EAF0",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E5EAF0",
  },
  stepBubbleActive: {
    backgroundColor: "rgb(0,41,87)",
    borderColor: "rgb(0,41,87)",
    shadowColor: "rgb(0,41,87)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  stepBubbleCompleted: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  stepBubbleLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#A0ADBC",
    textAlign: "center",
  },
  stepBubbleLabelActive: {
    color: "rgb(0,41,87)",
    fontWeight: "800",
  },
  stepBubbleLabelCompleted: {
    color: "#10B981",
    fontWeight: "700",
  },

  // ── Step content ─────────────────────────────────────────────────────
  stepContent: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 8,
  },
  stepHeading: {
    fontSize: 21,
    fontWeight: "800",
    color: "rgb(0,41,87)",
    letterSpacing: -0.3,
    marginBottom: 5,
  },
  stepSubheading: {
    fontSize: 13,
    color: "#8A95A3",
    marginBottom: 24,
    fontWeight: "500",
  },

  // ── Field styles ─────────────────────────────────────────────────────
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 9,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F7F9FC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  inputRowMultiline: {
    alignItems: "flex-start",
    paddingTop: 13,
  },
  inputIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "rgba(0,41,87,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  inputField: {
    flex: 1,
    fontSize: 15,
    color: "#1F2937",
    padding: 0,
    fontWeight: "500",
  },
  timePill: {
    backgroundColor: "rgba(0,41,87,0.1)",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  timePillText: {
    fontSize: 12,
    color: "rgb(0,41,87)",
    fontWeight: "700",
  },
  helperNote: {
    fontSize: 11,
    color: "#A0ADBC",
    marginTop: 7,
    fontStyle: "italic",
    marginLeft: 4,
  },

  // ── Billable card ────────────────────────────────────────────────────
  billableCard: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(0,41,87,0.12)",
    marginBottom: 4,
  },
  billableGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  billableLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  billableIconBox: {
    width: 38,
    height: 38,
    borderRadius: 11,
    backgroundColor: "rgba(0,41,87,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  billableTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "rgb(0,41,87)",
  },
  billableSubtitle: {
    fontSize: 12,
    color: "#8A95A3",
    marginTop: 2,
  },

  // ── Review card ──────────────────────────────────────────────────────
  reviewCard: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "rgb(0,41,87)",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  reviewGradient: {
    padding: 20,
  },
  reviewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    paddingVertical: 10,
  },
  reviewIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  reviewMiniLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  reviewValue: {
    fontSize: 14,
    color: "white",
    fontWeight: "600",
    lineHeight: 20,
  },
  reviewSep: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 2,
  },
  reviewChipsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  reviewChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  reviewChipBillable: {
    backgroundColor: "rgba(16,185,129,0.18)",
  },
  reviewChipText: {
    fontSize: 13,
    color: "rgb(0,41,87)",
    fontWeight: "700",
  },

  // ── Navigation buttons ───────────────────────────────────────────────
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 22,
    paddingTop: 4,
    paddingBottom: 18,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  clearBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 13,
    backgroundColor: "#F3F4F6",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  primaryBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    height: 50,
    shadowColor: "rgb(0,41,87)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryBtnGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  primaryBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.2,
  },

  // ── Tasks section card ───────────────────────────────────────────────
  tasksCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    borderRadius: 24,
    padding: 20,
    shadowColor: "rgb(0,41,87)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  tasksHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  tasksHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tasksIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "rgb(0,41,87)",
    justifyContent: "center",
    alignItems: "center",
  },
  tasksSectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "rgb(0,41,87)",
  },
  tasksBadge: {
    backgroundColor: "rgb(0,41,87)",
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: "center",
  },
  tasksBadgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "white",
  },

  // ── Empty state ──────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    marginVertical: 8,
  },
  emptyCard: {
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 30,
    borderRadius: 18,
    width: "100%",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(0,41,87,0.55)",
    marginTop: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#A0ADBC",
    textAlign: "center",
  },

  // ── Task item ────────────────────────────────────────────────────────
  taskItem: {
    flexDirection: "row",
    borderRadius: 16,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "rgb(0,41,87)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  taskStripe: {
    width: 4,
  },
  taskBody: {
    flex: 1,
    padding: 14,
  },
  taskTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 7,
  },
  taskTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginRight: 10,
  },
  taskTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
  },
  taskActions: {
    flexDirection: "row",
    gap: 7,
  },
  editBtn: {
    backgroundColor: "#3B82F6",
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteBtn: {
    backgroundColor: "#EF4444",
    borderRadius: 8,
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  taskDesc: {
    fontSize: 12,
    color: "#6B7280",
    lineHeight: 17,
    marginBottom: 10,
    fontStyle: "italic",
  },
  taskMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "white",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metaChipBillable: {
    backgroundColor: "rgba(16,185,129,0.1)",
    borderColor: "rgba(16,185,129,0.25)",
  },
  metaChipText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
  },

  // ── Alert modal ──────────────────────────────────────────────────────
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.58)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  alertBox: {
    backgroundColor: "white",
    borderRadius: 26,
    width: "100%",
    maxWidth: 340,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 12,
  },
  lottie: {
    width: 120,
    height: 120,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1F2937",
    marginBottom: 8,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  alertBtns: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  alertBtn: {
    flex: 1,
    borderRadius: 13,
    overflow: "hidden",
  },
  alertCancelBtn: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCancelText: {
    color: "#6B7280",
    fontSize: 15,
    fontWeight: "700",
  },
  alertGradientBtn: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  alertBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },

  // ── Project picker ───────────────────────────────────────────────────
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  pickerHandle: {
    width: 36,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  pickerHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F4F8",
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1F2937",
  },
  pickerOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 22,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F8FAFC",
  },
  pickerOptionSelected: {
    backgroundColor: "rgba(0,41,87,0.05)",
  },
  pickerOptionText: {
    fontSize: 15,
    color: "#374151",
    fontWeight: "500",
  },
  pickerOptionTextSelected: {
    color: "rgb(0,41,87)",
    fontWeight: "700",
  },
});
