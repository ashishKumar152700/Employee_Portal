import React, {
  forwardRef,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { FontAwesome, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  TimesheetTask,
  Project,
  getTasksByDate,
  addTasks,
  updateTask,
  deleteTask,
  getProjects,
} from "../../Services/Timesheet/timesheetService";
import { BRAND } from "../../Global/GlassTheme";

const PRIMARY = BRAND.primary;
const GRADIENT = BRAND.primaryGradient;
const PAGE_BG = "#F4F7FB";
const DAILY_TARGET_MINUTES = 8 * 60;
const MAX_MINUTES = 24 * 60;
const STEP_MINUTES = 15;
const DURATION_PRESETS = [15, 30, 60, 120, 240, 480];
const INLINE_PROJECT_LIMIT = 8;

const lottieAnimations = {
  success: require("../../assets/animations/success.json"),
  error: require("../../assets/animations/error.json"),
  warning: require("../../assets/animations/cancel.json"),
  confirm: require("../../assets/animations/cancel.json"),
};

type AlertConfig = {
  type: "success" | "error" | "warning" | "confirm";
  title: string;
  message: string;
  onConfirm?: () => void;
};

type FieldErrors = { title?: string; description?: string; time?: string };

// ─── Pure helpers ─────────────────────────────────────────────────────────

const formatMinutesToHoursAndMinutes = (totalMinutes: number): string => {
  if (!totalMinutes || isNaN(totalMinutes)) return "0h 0m";
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

const formatCompact = (totalMinutes: number): string => {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
};

const getTaskMinutes = (task: TimesheetTask) =>
  task.minutes || task.minutesSpend || 0;

const isTaskBillable = (task: TimesheetTask) =>
  typeof task.billable === "string"
    ? task.billable.toLowerCase() === "yes"
    : Boolean(task.billable);

// ════════════════════════════════════════════════════════════════════════
//  Building blocks
//  These live at module level on purpose: components declared inside the
//  form's render get a new identity on every keystroke, which remounts the
//  TextInputs and dismisses the keyboard.
// ════════════════════════════════════════════════════════════════════════

// ─── Day summary ──────────────────────────────────────────────────────────
const DaySummary = ({
  totalMinutes,
  taskCount,
}: {
  totalMinutes: number;
  taskCount: number;
}) => {
  const progress = Math.min(totalMinutes / DAILY_TARGET_MINUTES, 1);
  const fill = useRef(new Animated.Value(0)).current;
  const remaining = DAILY_TARGET_MINUTES - totalMinutes;

  useEffect(() => {
    Animated.timing(fill, {
      toValue: progress,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  return (
    <LinearGradient
      colors={GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.summary}
    >
      <View style={[styles.summaryCircle, styles.summaryCircleA]} />
      <View style={[styles.summaryCircle, styles.summaryCircleB]} />

      <View style={styles.summaryTop}>
        <View>
          <Text style={styles.summaryLabel}>Logged today</Text>
          <Text style={styles.summaryValue}>
            {formatCompact(totalMinutes)}
            <Text style={styles.summaryTarget}>
              {"  "}/ {formatCompact(DAILY_TARGET_MINUTES)}
            </Text>
          </Text>
        </View>
        <View style={styles.summaryBadge}>
          <MaterialCommunityIcons
            name="format-list-checks"
            size={14}
            color="#FFFFFF"
          />
          <Text style={styles.summaryBadgeText}>
            {taskCount} task{taskCount === 1 ? "" : "s"}
          </Text>
        </View>
      </View>

      <View style={styles.summaryTrack}>
        <Animated.View
          style={[
            styles.summaryFill,
            {
              width: fill.interpolate({
                inputRange: [0, 1],
                outputRange: ["0%", "100%"],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.summaryHint}>
        {remaining > 0
          ? `${formatCompact(remaining)} to reach your ${formatCompact(
              DAILY_TARGET_MINUTES
            )} day`
          : "Daily target reached. Great work!"}
      </Text>
    </LinearGradient>
  );
};

// ─── Section label ────────────────────────────────────────────────────────
const FieldLabel = ({
  icon,
  label,
  required,
  trailing,
}: {
  icon: any;
  label: string;
  required?: boolean;
  trailing?: React.ReactNode;
}) => (
  <View style={styles.fieldLabelRow}>
    <MaterialCommunityIcons name={icon} size={15} color={PRIMARY} />
    <Text style={styles.fieldLabel}>
      {label}
      {required && <Text style={styles.required}> *</Text>}
    </Text>
    <View style={{ flex: 1 }} />
    {trailing}
  </View>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <View style={styles.errorRow}>
      <MaterialCommunityIcons name="alert-circle" size={13} color={BRAND.danger} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  ) : null;

// ─── Text field with focus ring ───────────────────────────────────────────
type InputFieldProps = TextInputProps & { error?: string };

const InputField = forwardRef<TextInput, InputFieldProps>(
  ({ error, multiline, style, onFocus, onBlur, ...rest }, ref) => {
    const [focused, setFocused] = useState(false);
    return (
      <View
        style={[
          styles.inputBox,
          multiline && styles.inputBoxMultiline,
          focused && styles.inputBoxFocused,
          !!error && styles.inputBoxError,
        ]}
      >
        <TextInput
          ref={ref}
          {...rest}
          multiline={multiline}
          placeholderTextColor="#A3AEBD"
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            style,
          ]}
        />
      </View>
    );
  }
);

// ─── Project chips ────────────────────────────────────────────────────────
const ProjectChip = ({
  label,
  selected,
  onPress,
  icon,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  icon?: any;
}) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[styles.chip, selected && styles.chipSelectedShadow]}
  >
    {selected ? (
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.chipInner}
      >
        <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
        <Text style={[styles.chipText, styles.chipTextSelected]} numberOfLines={1}>
          {label}
        </Text>
      </LinearGradient>
    ) : (
      <View style={[styles.chipInner, styles.chipIdle]}>
        {icon && (
          <MaterialCommunityIcons name={icon} size={14} color={PRIMARY} />
        )}
        <Text style={styles.chipText} numberOfLines={1}>
          {label}
        </Text>
      </View>
    )}
  </TouchableOpacity>
);

// ─── Duration control ─────────────────────────────────────────────────────
const DurationControl = ({
  minutes,
  onChange,
  error,
}: {
  minutes: number;
  onChange: (minutes: number) => void;
  error?: string;
}) => {
  const clamp = (value: number) => Math.min(Math.max(value, 0), MAX_MINUTES);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;

  return (
    <View style={[styles.durationCard, !!error && styles.inputBoxError]}>
      <View style={styles.durationRow}>
        <TouchableOpacity
          onPress={() => onChange(clamp(minutes - STEP_MINUTES))}
          disabled={minutes <= 0}
          style={[styles.stepButton, minutes <= 0 && styles.stepButtonDisabled]}
          accessibilityLabel="Decrease by 15 minutes"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <MaterialCommunityIcons name="minus" size={22} color={PRIMARY} />
        </TouchableOpacity>

        <View style={styles.durationDisplay}>
          <View style={styles.durationDigits}>
            <Text style={styles.durationNumber}>{h}</Text>
            <Text style={styles.durationUnit}>h</Text>
            <Text style={[styles.durationNumber, { marginLeft: 10 }]}>
              {String(m).padStart(2, "0")}
            </Text>
            <Text style={styles.durationUnit}>m</Text>
          </View>
          <Text style={styles.durationCaption}>
            {minutes > 0 ? `${minutes} minutes` : "Tap a preset or use + / −"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onChange(clamp(minutes + STEP_MINUTES))}
          disabled={minutes >= MAX_MINUTES}
          accessibilityLabel="Increase by 15 minutes"
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <LinearGradient
            colors={GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.stepButton}
          >
            <MaterialCommunityIcons name="plus" size={22} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <View style={styles.presetRow}>
        {DURATION_PRESETS.map((preset) => {
          const active = minutes === preset;
          return (
            <TouchableOpacity
              key={preset}
              onPress={() => onChange(preset)}
              activeOpacity={0.8}
              style={[styles.preset, active && styles.presetActive]}
            >
              <Text style={[styles.presetText, active && styles.presetTextActive]}>
                {formatCompact(preset)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

// ─── Billable segmented control ───────────────────────────────────────────
const BillableToggle = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <View style={styles.segment}>
    {[
      { key: false, label: "Non-billable", icon: "briefcase-outline" },
      { key: true, label: "Billable", icon: "cash-multiple" },
    ].map((option) => {
      const active = value === option.key;
      return (
        <TouchableOpacity
          key={option.label}
          onPress={() => onChange(option.key)}
          activeOpacity={0.85}
          style={styles.segmentItem}
          accessibilityRole="button"
          accessibilityState={{ selected: active }}
        >
          {active ? (
            <LinearGradient
              colors={
                option.key ? (["#047857", "#10B981"] as const) : GRADIENT
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.segmentActive}
            >
              <MaterialCommunityIcons
                name={option.icon as any}
                size={16}
                color="#FFFFFF"
              />
              <Text style={styles.segmentTextActive}>{option.label}</Text>
            </LinearGradient>
          ) : (
            <View style={styles.segmentIdle}>
              <MaterialCommunityIcons
                name={option.icon as any}
                size={16}
                color={BRAND.primaryMuted}
              />
              <Text style={styles.segmentText}>{option.label}</Text>
            </View>
          )}
        </TouchableOpacity>
      );
    })}
  </View>
);

// ─── Logged task card ─────────────────────────────────────────────────────
const TaskCard = ({
  task,
  editing,
  deleting,
  onEdit,
  onDelete,
}: {
  task: TimesheetTask;
  editing: boolean;
  deleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const taskMinutes = getTaskMinutes(task);
  const billable = isTaskBillable(task);

  return (
    <View style={[styles.taskCard, editing && styles.taskCardEditing]}>
      <LinearGradient
        colors={GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.taskTime}
      >
        <MaterialCommunityIcons
          name="clock-outline"
          size={14}
          color="rgba(255,255,255,0.8)"
        />
        <Text style={styles.taskTimeValue}>{formatCompact(taskMinutes)}</Text>
      </LinearGradient>

      <View style={styles.taskBody}>
        <View style={styles.taskTop}>
          <Text style={styles.taskTitle} numberOfLines={1}>
            {task.taskTitle || "Untitled Task"}
          </Text>
          <TouchableOpacity
            onPress={onEdit}
            style={styles.iconButton}
            accessibilityLabel="Edit task"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <MaterialCommunityIcons name="pencil-outline" size={17} color={PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onDelete}
            disabled={deleting}
            style={[styles.iconButton, styles.iconButtonDanger]}
            accessibilityLabel="Delete task"
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            {deleting ? (
              <ActivityIndicator size="small" color={BRAND.danger} />
            ) : (
              <MaterialCommunityIcons
                name="trash-can-outline"
                size={17}
                color={BRAND.danger}
              />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.taskDesc} numberOfLines={2}>
          {task.taskDescription || "No description provided"}
        </Text>

        <View style={styles.taskMeta}>
          <View style={styles.metaChip}>
            <MaterialCommunityIcons
              name="folder-outline"
              size={12}
              color={BRAND.primaryMuted}
            />
            <Text style={styles.metaChipText} numberOfLines={1}>
              {task.projectName || "No Project"}
            </Text>
          </View>
          <View style={[styles.metaChip, billable && styles.metaChipBillable]}>
            <MaterialCommunityIcons
              name={billable ? "cash-multiple" : "briefcase-outline"}
              size={12}
              color={billable ? "#047857" : BRAND.primaryMuted}
            />
            <Text
              style={[styles.metaChipText, billable && styles.metaChipTextBillable]}
            >
              {billable ? "Billable" : "Non-billable"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Project search sheet ─────────────────────────────────────────────────
const ProjectSheet = ({
  visible,
  projects,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  projects: Project[];
  selectedId: number;
  onSelect: (id: number) => void;
  onClose: () => void;
}) => {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!visible) setQuery("");
  }, [visible]);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [{ projectId: 0, projectName: "No Project" }, ...projects];
    return q ? list.filter((p) => p.projectName.toLowerCase().includes(q)) : list;
  }, [projects, query]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.sheetOverlay} onPress={onClose} />
      <View
        style={[
          styles.sheet,
          { maxHeight: height * 0.75, paddingBottom: insets.bottom + 12 },
        ]}
      >
        <View style={styles.sheetHandle} />
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Select project</Text>
          <TouchableOpacity onPress={onClose} style={styles.sheetClose}>
            <MaterialCommunityIcons name="close" size={18} color={PRIMARY} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={18} color={BRAND.primaryMuted} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects"
            placeholderTextColor="#A3AEBD"
            style={styles.searchInput}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#A3AEBD" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {options.length === 0 ? (
            <Text style={styles.sheetEmpty}>No projects match "{query}"</Text>
          ) : (
            options.map((project) => {
              const selected = project.projectId === selectedId;
              return (
                <TouchableOpacity
                  key={project.projectId}
                  onPress={() => onSelect(project.projectId)}
                  style={[styles.sheetOption, selected && styles.sheetOptionSelected]}
                  activeOpacity={0.8}
                >
                  <View style={[styles.sheetOptionIcon, selected && styles.sheetOptionIconSelected]}>
                    <MaterialCommunityIcons
                      name={project.projectId === 0 ? "folder-off-outline" : "folder-outline"}
                      size={16}
                      color={selected ? "#FFFFFF" : PRIMARY}
                    />
                  </View>
                  <Text
                    style={[styles.sheetOptionText, selected && styles.sheetOptionTextSelected]}
                    numberOfLines={1}
                  >
                    {project.projectName}
                  </Text>
                  {selected && (
                    <MaterialCommunityIcons name="check-circle" size={18} color={PRIMARY} />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

// ─── Alert dialog ─────────────────────────────────────────────────────────
const AlertDialog = ({
  visible,
  config,
  onDismiss,
  onConfirm,
}: {
  visible: boolean;
  config: AlertConfig;
  onDismiss: () => void;
  onConfirm: () => void;
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    statusBarTranslucent
    onRequestClose={onDismiss}
  >
    <View style={styles.alertOverlay}>
      <View style={styles.alertBox}>
        <LottieView
          source={lottieAnimations[config.type]}
          autoPlay
          loop={false}
          style={styles.lottie}
        />
        <Text style={styles.alertTitle}>{config.title}</Text>
        <Text style={styles.alertMessage}>{config.message}</Text>
        <View style={styles.alertBtns}>
          {config.type === "confirm" ? (
            <>
              <TouchableOpacity
                style={[styles.alertBtn, styles.alertCancelBtn]}
                onPress={onDismiss}
              >
                <Text style={styles.alertCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.alertBtn} onPress={onConfirm}>
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
            <TouchableOpacity style={styles.alertBtn} onPress={onConfirm}>
              <LinearGradient
                colors={GRADIENT}
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

// ════════════════════════════════════════════════════════════════════════
//  Form
// ════════════════════════════════════════════════════════════════════════

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
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const descriptionRef = useRef<TextInput>(null);

  // ─── Form state ───────────────────────────────────────────────────────
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [projectId, setProjectId] = useState(0);
  const [customProject, setCustomProject] = useState("");
  const [showCustomProject, setShowCustomProject] = useState(false);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [isBillable, setIsBillable] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [existingTasks, setExistingTasks] = useState<TimesheetTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showProjectPicker, setShowProjectPicker] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState<AlertConfig>({
    type: "success",
    title: "",
    message: "",
  });

  // ─── Init ─────────────────────────────────────────────────────────────
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

  // ─── Helpers ──────────────────────────────────────────────────────────
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
    setErrors({});
  };

  const getTotalMinutes = (): number => hours * 60 + minutes;

  const setTimeFromMinutes = (totalMinutes: number) => {
    setHours(Math.floor(totalMinutes / 60));
    setMinutes(totalMinutes % 60);
  };

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!taskTitle.trim()) next.title = "Please enter a task title.";
    if (!taskDescription.trim())
      next.description = "Please enter a task description.";
    if (getTotalMinutes() <= 0)
      next.time = "Please set time spent (greater than 0).";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return false;
    }
    return true;
  };

  // ─── Submit / Edit / Delete (logic unchanged) ─────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
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
        }
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
          editingTaskId ? "Task updated successfully!" : "Task added successfully!"
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
    setTimeFromMinutes(getTaskMinutes(task));
    setIsBillable(isTaskBillable(task));
    setEditingTaskId(task.taskId || null);
    setErrors({});
    scrollRef.current?.scrollTo({ y: 0, animated: true });
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
      }
    );
  };

  // ─── Alert helpers ────────────────────────────────────────────────────
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

  // ─── Derived ──────────────────────────────────────────────────────────
  const selectableProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.projectId !== 0 && project.projectName !== "No Project"
      ),
    [projects]
  );
  const inlineProjects = selectableProjects.slice(0, INLINE_PROJECT_LIMIT);
  const selectedIsHidden =
    projectId !== 0 && !inlineProjects.some((p) => p.projectId === projectId);
  const selectedProjectName =
    selectableProjects.find((p) => p.projectId === projectId)?.projectName || "";

  const loggedMinutes = existingTasks.reduce(
    (sum, task) => sum + getTaskMinutes(task),
    0
  );
  const totalMinutes = getTotalMinutes();

  // ─── Loading ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color={PRIMARY} />
        <Text style={styles.loadingScreenText}>Loading your day...</Text>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════
  //  MAIN RENDER
  // ════════════════════════════════════════════════════════════════════
  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <DaySummary totalMinutes={loggedMinutes} taskCount={existingTasks.length} />

        {/* ── Composer ─────────────────────────────────────────────── */}
        <View style={[styles.card, editingTaskId && styles.cardEditing]}>
          <View style={styles.cardHead}>
            <View style={styles.cardHeadIcon}>
              <MaterialCommunityIcons
                name={editingTaskId ? "pencil" : "plus"}
                size={18}
                color="#FFFFFF"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>
                {editingTaskId ? "Edit task" : "Log a task"}
              </Text>
              <Text style={styles.cardSubtitle}>
                {editingTaskId
                  ? "Update the details and save"
                  : "What did you work on?"}
              </Text>
            </View>
            {(editingTaskId ||
              taskTitle ||
              taskDescription ||
              totalMinutes > 0) && (
              <TouchableOpacity
                onPress={clearForm}
                disabled={saving}
                style={styles.resetButton}
              >
                <MaterialCommunityIcons
                  name={editingTaskId ? "close" : "refresh"}
                  size={14}
                  color={PRIMARY}
                />
                <Text style={styles.resetText}>
                  {editingTaskId ? "Cancel" : "Clear"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Title */}
          <View style={styles.field}>
            <FieldLabel icon="format-title" label="Task title" required />
            <InputField
              value={taskTitle}
              onChangeText={(text) => {
                setTaskTitle(text);
                if (errors.title) setErrors((e) => ({ ...e, title: undefined }));
              }}
              placeholder="e.g. Fix login bug"
              returnKeyType="next"
              blurOnSubmit={false}
              onSubmitEditing={() => descriptionRef.current?.focus()}
              error={errors.title}
            />
            <FieldError message={errors.title} />
          </View>

          {/* Description */}
          <View style={styles.field}>
            <FieldLabel icon="text" label="Description" required />
            <InputField
              ref={descriptionRef}
              value={taskDescription}
              onChangeText={(text) => {
                setTaskDescription(text);
                if (errors.description)
                  setErrors((e) => ({ ...e, description: undefined }));
              }}
              placeholder="Describe what you did..."
              multiline
              error={errors.description}
            />
            <FieldError message={errors.description} />
          </View>

          {/* Project */}
          <View style={styles.field}>
            <FieldLabel
              icon="folder-outline"
              label="Project"
              trailing={
                selectableProjects.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setShowProjectPicker(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.linkText}>
                      {selectableProjects.length > INLINE_PROJECT_LIMIT
                        ? `All ${selectableProjects.length}`
                        : "Search"}
                    </Text>
                  </TouchableOpacity>
                ) : null
              }
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.chipRow}
            >
              <ProjectChip
                label="No Project"
                icon="folder-off-outline"
                selected={projectId === 0}
                onPress={() => setProjectId(0)}
              />
              {selectedIsHidden && (
                <ProjectChip
                  label={selectedProjectName}
                  selected
                  onPress={() => setShowProjectPicker(true)}
                />
              )}
              {inlineProjects.map((project) => (
                <ProjectChip
                  key={project.projectId}
                  label={project.projectName}
                  selected={projectId === project.projectId}
                  onPress={() => setProjectId(project.projectId)}
                />
              ))}
              {selectableProjects.length > INLINE_PROJECT_LIMIT && (
                <ProjectChip
                  label="More"
                  icon="dots-horizontal"
                  selected={false}
                  onPress={() => setShowProjectPicker(true)}
                />
              )}
            </ScrollView>
          </View>

          {/* Duration */}
          <View style={styles.field}>
            <FieldLabel icon="timer-outline" label="Time spent" required />
            <DurationControl
              minutes={totalMinutes}
              onChange={(value) => {
                setTimeFromMinutes(value);
                if (errors.time) setErrors((e) => ({ ...e, time: undefined }));
              }}
              error={errors.time}
            />
            <FieldError message={errors.time} />
          </View>

          {/* Billable */}
          <View style={styles.field}>
            <FieldLabel icon="cash-multiple" label="Billing" />
            <BillableToggle value={isBillable} onChange={setIsBillable} />
          </View>

          {/* Submit */}
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={saving}
            activeOpacity={0.9}
            style={styles.submitTouch}
          >
            <LinearGradient
              colors={GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submit}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <MaterialCommunityIcons
                  name={editingTaskId ? "content-save-outline" : "check-circle-outline"}
                  size={20}
                  color="#FFFFFF"
                />
              )}
              <Text style={styles.submitText}>
                {saving
                  ? editingTaskId
                    ? "Updating..."
                    : "Submitting..."
                  : editingTaskId
                  ? "Update task"
                  : totalMinutes > 0
                  ? `Log ${formatCompact(totalMinutes)}`
                  : "Log task"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Logged tasks ─────────────────────────────────────────── */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Logged tasks</Text>
          <View style={styles.countChip}>
            <Text style={styles.countChipText}>{existingTasks.length}</Text>
          </View>
          <View style={{ flex: 1 }} />
          {existingTasks.length > 0 && (
            <Text style={styles.listTotal}>
              {formatMinutesToHoursAndMinutes(loggedMinutes)}
            </Text>
          )}
        </View>

        {existingTasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={30}
                color={PRIMARY}
              />
            </View>
            <Text style={styles.emptyText}>No tasks logged yet</Text>
            <Text style={styles.emptySubtext}>
              Your entries for this day will show up here
            </Text>
          </View>
        ) : (
          existingTasks.map((task, index) => (
            <TaskCard
              key={task.taskId || index}
              task={task}
              editing={!!editingTaskId && editingTaskId === task.taskId}
              deleting={deleting === task.taskId}
              onEdit={() => handleEditTask(task)}
              onDelete={() => task.taskId && handleDeleteTask(task.taskId)}
            />
          ))
        )}
      </ScrollView>

      <ProjectSheet
        visible={showProjectPicker}
        projects={selectableProjects}
        selectedId={projectId}
        onSelect={(id) => {
          setProjectId(id);
          setShowProjectPicker(false);
        }}
        onClose={() => setShowProjectPicker(false)}
      />

      <AlertDialog
        visible={alertVisible}
        config={alertConfig}
        onDismiss={() => setAlertVisible(false)}
        onConfirm={() => {
          setAlertVisible(false);
          alertConfig.onConfirm?.();
        }}
      />
    </View>
  );
}

export default memo(TimesheetForm);

// ════════════════════════════════════════════════════════════════════════
//  STYLES
// ════════════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  scrollContent: {
    padding: 16,
  },

  // Loading
  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: PAGE_BG,
    gap: 12,
  },
  loadingScreenText: {
    fontSize: 15,
    color: PRIMARY,
    fontWeight: "600",
  },

  // Day summary
  summary: {
    borderRadius: 22,
    padding: 18,
    overflow: "hidden",
    elevation: 6,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
  },
  summaryCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  summaryCircleA: { width: 160, height: 160, top: -80, right: -40 },
  summaryCircleB: {
    width: 90,
    height: 90,
    bottom: -50,
    left: 40,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  summaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  summaryValue: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    marginTop: 4,
  },
  summaryTarget: {
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.65)",
  },
  summaryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.14)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
  },
  summaryBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  summaryTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 16,
    overflow: "hidden",
  },
  summaryFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#7DD3FC",
  },
  summaryHint: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
    marginTop: 8,
  },

  // Composer card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 3,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  cardEditing: {
    borderColor: "rgba(0, 86, 160, 0.45)",
    borderWidth: 1.5,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  cardHeadIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: PRIMARY,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.ink,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: BRAND.inkSoft,
    marginTop: 1,
  },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: BRAND.primaryFaint,
  },
  resetText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },

  // Fields
  field: {
    marginTop: 16,
  },
  fieldLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.ink,
  },
  required: {
    color: BRAND.danger,
  },
  linkText: {
    fontSize: 12.5,
    fontWeight: "700",
    color: BRAND.primaryLight,
  },
  inputBox: {
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(0, 41, 87, 0.1)",
    backgroundColor: "#F8FAFD",
    paddingHorizontal: 14,
  },
  inputBoxMultiline: {
    paddingVertical: 4,
  },
  inputBoxFocused: {
    borderColor: BRAND.primaryLight,
    backgroundColor: "#FFFFFF",
  },
  inputBoxError: {
    borderColor: "rgba(214, 69, 69, 0.6)",
  },
  input: {
    fontSize: 15,
    color: BRAND.ink,
    paddingVertical: 12,
  },
  inputMultiline: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
  },
  errorText: {
    fontSize: 12,
    color: BRAND.danger,
    fontWeight: "500",
  },

  // Project chips
  chipRow: {
    gap: 8,
    paddingRight: 4,
  },
  chip: {
    borderRadius: 999,
  },
  chipSelectedShadow: {
    elevation: 3,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    backgroundColor: PRIMARY,
  },
  chipInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    maxWidth: 200,
  },
  chipIdle: {
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: PRIMARY,
    flexShrink: 1,
  },
  chipTextSelected: {
    color: "#FFFFFF",
  },

  // Duration
  durationCard: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "rgba(0, 41, 87, 0.1)",
    backgroundColor: "#F8FAFD",
    padding: 12,
  },
  durationRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  stepButtonDisabled: {
    opacity: 0.4,
  },
  durationDisplay: {
    flex: 1,
    alignItems: "center",
  },
  durationDigits: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  durationNumber: {
    fontSize: 34,
    fontWeight: "800",
    color: PRIMARY,
    fontVariant: ["tabular-nums"],
  },
  durationUnit: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.primaryMuted,
    marginLeft: 2,
  },
  durationCaption: {
    fontSize: 11.5,
    color: BRAND.inkSoft,
    marginTop: 2,
  },
  presetRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  preset: {
    flexGrow: 1,
    minWidth: 48,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  presetActive: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  presetText: {
    fontSize: 13,
    fontWeight: "700",
    color: PRIMARY,
  },
  presetTextActive: {
    color: "#FFFFFF",
  },

  // Billable segment
  segment: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 16,
    backgroundColor: "#F1F5FA",
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
  },
  segmentItem: {
    flex: 1,
  },
  segmentActive: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  segmentIdle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 11,
  },
  segmentText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: BRAND.primaryMuted,
  },
  segmentTextActive: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  // Submit
  submitTouch: {
    marginTop: 22,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    backgroundColor: PRIMARY,
  },
  submit: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },

  // Logged tasks
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: BRAND.ink,
  },
  countChip: {
    marginLeft: 8,
    minWidth: 24,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: BRAND.primaryFaint,
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    alignItems: "center",
  },
  countChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: PRIMARY,
  },
  listTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: BRAND.primaryLight,
  },
  taskCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: BRAND.primaryBorder,
    elevation: 2,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
  },
  taskCardEditing: {
    borderColor: "rgba(0, 86, 160, 0.5)",
    borderWidth: 1.5,
  },
  taskTime: {
    width: 74,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 4,
  },
  taskTimeValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  taskBody: {
    flex: 1,
    padding: 12,
  },
  taskTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.primaryFaint,
  },
  iconButtonDanger: {
    backgroundColor: "rgba(214, 69, 69, 0.08)",
  },
  taskDesc: {
    fontSize: 13,
    color: BRAND.inkSoft,
    lineHeight: 18,
    marginTop: 4,
  },
  taskMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 10,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "100%",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#F1F5FA",
  },
  metaChipBillable: {
    backgroundColor: "#DCFCE7",
  },
  metaChipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: BRAND.inkSoft,
    flexShrink: 1,
  },
  metaChipTextBillable: {
    color: "#047857",
    fontWeight: "700",
  },

  // Empty state
  emptyCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(0, 41, 87, 0.18)",
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: BRAND.primaryFaint,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "700",
    color: BRAND.ink,
  },
  emptySubtext: {
    fontSize: 12.5,
    color: BRAND.inkSoft,
    marginTop: 4,
    textAlign: "center",
  },

  // Project sheet
  sheetOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 22, 48, 0.5)",
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(0, 41, 87, 0.15)",
    marginBottom: 12,
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: BRAND.ink,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.primaryFaint,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "#F1F5FA",
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: BRAND.ink,
    paddingVertical: 10,
  },
  sheetEmpty: {
    textAlign: "center",
    color: BRAND.inkSoft,
    paddingVertical: 24,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginVertical: 2,
  },
  sheetOptionSelected: {
    backgroundColor: BRAND.primaryFaint,
  },
  sheetOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BRAND.primaryFaint,
  },
  sheetOptionIconSelected: {
    backgroundColor: PRIMARY,
  },
  sheetOptionText: {
    flex: 1,
    fontSize: 15,
    color: BRAND.ink,
  },
  sheetOptionTextSelected: {
    fontWeight: "700",
    color: PRIMARY,
  },

  // Alert
  alertOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 22, 48, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  alertBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 22,
    alignItems: "center",
    width: "100%",
    maxWidth: 380,
    elevation: 16,
    shadowColor: BRAND.shadow,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
  },
  lottie: {
    width: 110,
    height: 110,
  },
  alertTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: PRIMARY,
    marginTop: 4,
    textAlign: "center",
  },
  alertMessage: {
    fontSize: 14,
    color: BRAND.inkSoft,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
  },
  alertBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 22,
    width: "100%",
  },
  alertBtn: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  alertCancelBtn: {
    borderWidth: 1.5,
    borderColor: "rgba(0, 41, 87, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  alertCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: PRIMARY,
  },
  alertGradientBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
  },
  alertBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
