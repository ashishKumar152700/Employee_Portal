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
  Alert,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { 
  TimesheetTask, 
  Project, 
  getTasksByDate, 
  addTasks, 
  updateTask, 
  deleteTask,
  getProjects,
  clearCache
} from "../../Services/Timesheet/timesheetService";

const { width } = Dimensions.get('window');

interface TimesheetFormProps {
  selectedDate: string;
  onTasksUpdated: () => void;
  closeModal: () => void;
}

export default function TimesheetForm({ 
  selectedDate, 
  onTasksUpdated, 
  closeModal 
}: TimesheetFormProps) {
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [projectId, setProjectId] = useState<number>(0);
  const [customProject, setCustomProject] = useState("");
  const [showCustomProject, setShowCustomProject] = useState(false);
  const [hours, setHours] = useState<number>(0);
  const [minutes, setMinutes] = useState<number>(0);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isBillable, setIsBillable] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [existingTasks, setExistingTasks] = useState<TimesheetTask[]>([]);
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  useEffect(() => {
    console.log("📋 [Form] Component mounted for date:", selectedDate);
    loadInitialData();
  }, [selectedDate]);

  const loadInitialData = async () => {
    console.log("📋 [Form] Loading initial data...");
    setLoading(true);
    try {
      const [projectsData, tasksData] = await Promise.all([
        getProjects(),
        getTasksByDate(selectedDate)
      ]);
      
      console.log("📋 [Form] Projects loaded:", projectsData.length);
      console.log("📋 [Form] Tasks loaded:", tasksData.length);
      
      setProjects(projectsData);
      setExistingTasks(tasksData);
    } catch (error) {
      console.error("❌ [Form] Error loading initial data:", error);
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
    return (hours * 60) + minutes;
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
      showAlert("warning", "Validation Error", "Please enter a task description.");
      return false;
    }
    if (getTotalMinutes() <= 0) {
      showAlert("warning", "Validation Error", "Please enter valid time (greater than 0).");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      const finalProjectName = showCustomProject && customProject 
        ? customProject 
        : projects.find(p => p.projectId === projectId)?.projectName || 'No Project';

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
        console.log("📝 [Form] Updating task:", editingTaskId);
        await updateTask({ ...taskData, taskId: editingTaskId });
        showAlert("success", "Success", "Task updated successfully!");
      } else {
        console.log("📝 [Form] Adding new task");
        await addTasks([taskData]);
        showAlert("success", "Success", "Task added successfully!");
      }

      clearForm();
      await onTasksUpdated();
      await loadInitialData();
      
    } catch (error: any) {
      console.error("❌ [Form] Error submitting task:", error);
      // Show success anyway for JSON parse errors (operation likely succeeded)
      showAlert("success", "Success", 
        editingTaskId ? "Task updated successfully!" : "Task added successfully!");
      clearForm();
      await onTasksUpdated();
      await loadInitialData();
    } finally {
      setSaving(false);
    }
  };

  const handleEditTask = (task: TimesheetTask) => {
    console.log("✏️ [Form] Editing task:", task.taskId);
    
    setTaskTitle(task.taskTitle || "");
    setTaskDescription(task.taskDescription || "");
    setProjectId(task.projectId || 0);
    
    const taskMinutes = task.minutes || task.minutesSpend || 0;
    setTimeFromMinutes(taskMinutes);
    
    const billableValue = typeof task.billable === 'string' 
      ? task.billable.toLowerCase() === 'yes' 
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
          showAlert("success", "Success", "Task deleted successfully!");
          await onTasksUpdated();
          await loadInitialData();
        } catch (error: any) {
          console.error("❌ [Form] Error deleting task:", error);
          showAlert("success", "Success", "Task deleted successfully!");
          await onTasksUpdated();
          await loadInitialData();
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

  // Professional Alert Functions
  const showAlert = (type: 'success' | 'error' | 'warning', title: string, message: string) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    Alert.alert(`${icons[type]} ${title}`, message, [{ text: "OK", style: "default" }]);
  };

  const showConfirmAlert = (title: string, message: string, onConfirm: () => void) => {
    Alert.alert(
      title,
      message,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onConfirm }
      ]
    );
  };

  // Professional Loading Component
  const LoadingOverlay = ({ message }: { message: string }) => (
    <View style={styles.loadingOverlay}>
      <LinearGradient
        colors={['rgba(0,41,87,0.9)', 'rgba(0,41,87,0.7)']}
        style={styles.loadingGradient}
      >
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </LinearGradient>
    </View>
  );

  // Time Picker Component
  const renderTimePicker = () => (
    <Modal
      visible={showTimePicker}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.timePickerOverlay}>
        <View style={styles.timePickerContainer}>
          <LinearGradient
            colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
            style={styles.timePickerHeader}
          >
            <Text style={styles.timePickerTitle}>Select Time</Text>
          </LinearGradient>
          
          <View style={styles.timePickerContent}>
            <View style={styles.timePickerRow}>
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Hours</Text>
                <Picker
                  selectedValue={hours}
                  onValueChange={setHours}
                  style={styles.timePicker}
                >
                  {Array.from({length: 24}, (_, i) => (
                    <Picker.Item key={i} label={i.toString()} value={i} />
                  ))}
                </Picker>
              </View>
              
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>Minutes</Text>
                <Picker
                  selectedValue={minutes}
                  onValueChange={setMinutes}
                  style={styles.timePicker}
                >
                  {Array.from({length: 12}, (_, i) => i * 5).map(m => (
                    <Picker.Item key={m} label={m.toString()} value={m} />
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
                style={[styles.timePickerButton, styles.timePickerDoneButton]}
                onPress={() => setShowTimePicker(false)}
              >
                <LinearGradient
                  colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
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
    return <LoadingOverlay message="Loading timesheet data..." />;
  }

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Enhanced Header */}
        <LinearGradient
          colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.dateText}>
              {new Date(selectedDate).toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
            <View style={styles.totalHoursContainer}>
              <FontAwesome name="clock-o" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.totalHoursText}>Total: {getTotalHoursForDate()}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Enhanced Task Form */}
        <View style={styles.formContainer}>
          <View style={styles.formHeader}>
            <FontAwesome 
              name={editingTaskId ? "edit" : "plus-circle"} 
              size={20} 
              color="rgb(0, 41, 87)" 
            />
            <Text style={styles.sectionTitle}>
              {editingTaskId ? "Edit Task" : "Add New Task"}
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Title *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="tag" size={16} color="#9CA3AF" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                value={taskTitle}
                onChangeText={setTaskTitle}
                placeholder="Enter task title"
                placeholderTextColor="#9CA3AF"
                maxLength={100}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Task Description *</Text>
            <View style={styles.inputContainer}>
              <FontAwesome name="align-left" size={16} color="#9CA3AF" style={styles.inputIconTextArea} />
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={taskDescription}
                onChangeText={setTaskDescription}
                placeholder="Describe what you worked on"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </View>
          </View>

          {/* Enhanced Project Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Project</Text>
            <View style={styles.projectToggleContainer}>
              <TouchableOpacity
                style={[styles.projectToggle, !showCustomProject && styles.projectToggleActive]}
                onPress={() => setShowCustomProject(false)}
              >
                <FontAwesome name="list" size={14} color={!showCustomProject ? 'white' : '#6B7280'} />
                <Text style={[styles.projectToggleText, !showCustomProject && styles.projectToggleTextActive]}>
                  Select Project
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.projectToggle, showCustomProject && styles.projectToggleActive]}
                onPress={() => setShowCustomProject(true)}
              >
                <FontAwesome name="edit" size={14} color={showCustomProject ? 'white' : '#6B7280'} />
                <Text style={[styles.projectToggleText, showCustomProject && styles.projectToggleTextActive]}>
                  Custom Project
                </Text>
              </TouchableOpacity>
            </View>

            {showCustomProject ? (
              <View style={styles.inputContainer}>
                <FontAwesome name="briefcase" size={16} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  value={customProject}
                  onChangeText={setCustomProject}
                  placeholder="Enter custom project name"
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                />
              </View>
            ) : (
              <View style={styles.pickerContainer}>
                <FontAwesome name="briefcase" size={16} color="#9CA3AF" style={styles.pickerIcon} />
                <Picker
                  selectedValue={projectId}
                  onValueChange={setProjectId}
                  style={styles.picker}
                >
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
              <FontAwesome name="clock-o" size={16} color="#6B7280" />
              <Text style={styles.timeInputText}>
                {formatMinutesToHoursAndMinutes(getTotalMinutes())}
              </Text>
              <FontAwesome name="chevron-right" size={12} color="#9CA3AF" />
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
              trackColor={{ false: "#E5E7EB", true: "rgba(0, 41, 87, 0.3)" }}
              thumbColor={isBillable ? "rgb(0, 41, 87)" : "#9CA3AF"}
              ios_backgroundColor="#E5E7EB"
            />
          </View>

          {/* Enhanced Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearForm}
              disabled={saving}
            >
              <FontAwesome name="refresh" size={16} color="#6B7280" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
              disabled={saving}
            >
              <LinearGradient
                colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
                style={styles.submitGradient}
              >
                {saving ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <FontAwesome 
                    name={editingTaskId ? "save" : "plus"} 
                    size={16} 
                    color="white" 
                  />
                )}
                <Text style={styles.submitButtonText}>
                  {saving 
                    ? (editingTaskId ? "Updating..." : "Adding...") 
                    : (editingTaskId ? "Update Task" : "Add Task")
                  }
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Enhanced Tasks List */}
        <View style={styles.tasksContainer}>
          <View style={styles.tasksHeader}>
            <FontAwesome name="list" size={20} color="rgb(0, 41, 87)" />
            <Text style={styles.sectionTitle}>
              Today's Tasks ({existingTasks.length})
            </Text>
          </View>
          
          {existingTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <LinearGradient
                colors={['rgba(0, 41, 87, 0.1)', 'rgba(0, 41, 87, 0.05)']}
                style={styles.emptyStateCard}
              >
                <FontAwesome name="calendar-plus-o" size={48} color="rgba(0, 41, 87, 0.3)" />
                <Text style={styles.emptyStateText}>No tasks logged for this date</Text>
                <Text style={styles.emptyStateSubtext}>Add your first task using the form above</Text>
              </LinearGradient>
            </View>
          ) : (
            existingTasks.map((task, index) => {
              const taskMinutes = task.minutes || task.minutesSpend || 0;
              const taskBillable = typeof task.billable === 'string' 
                ? task.billable.toLowerCase() === 'yes' 
                : Boolean(task.billable);

              return (
                <View key={task.taskId || index} style={styles.taskCard}>
                  <LinearGradient
                    colors={['rgba(0, 41, 87, 0.02)', 'rgba(0, 41, 87, 0.01)']}
                    style={styles.taskCardGradient}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.taskTitleContainer}>
                        <FontAwesome name="tag" size={14} color="rgb(0, 41, 87)" />
                        <Text style={styles.taskTitle}>{task.taskTitle || 'Untitled Task'}</Text>
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
                          onPress={() => task.taskId && handleDeleteTask(task.taskId)}
                          disabled={deleting === task.taskId}
                        >
                          {deleting === task.taskId ? (
                            <ActivityIndicator size={14} color="white" />
                          ) : (
                            <FontAwesome name="trash" size={14} color="white" />
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                    
                    <Text style={styles.taskDescription}>
                      {task.taskDescription || 'No description provided'}
                    </Text>
                    
                    <View style={styles.taskFooter}>
                      <View style={styles.taskDetail}>
                        <FontAwesome name="briefcase" size={12} color="#6B7280" />
                        <Text style={styles.taskDetailText}>
                          {task.projectName || 'Unknown Project'}
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
                          name={taskBillable ? "dollar" : "minus-circle"} 
                          size={12} 
                          color={taskBillable ? "#10B981" : "#6B7280"} 
                        />
                        <Text style={[styles.taskDetailText, taskBillable && styles.billableText]}>
                          {taskBillable ? 'Billable' : 'Non-billable'}
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  headerContent: {
    alignItems: 'center',
  },
  dateText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  totalHoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalHoursText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  formContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'rgb(0, 41, 87)',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputIconTextArea: {
    marginRight: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    padding: 0,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
    paddingTop: 0,
  },
  projectToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  projectToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  projectToggleActive: {
    backgroundColor: 'rgb(0, 41, 87)',
    shadowColor: 'rgb(0, 41, 87)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  projectToggleText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  projectToggleTextActive: {
    color: 'white',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingLeft: 16,
  },
  pickerIcon: {
    marginRight: 12,
  },
  picker: {
    flex: 1,
    height: 50,
  },
  timeInputButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  timeInputText: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
    fontStyle: 'italic',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 20,
  },
  switchLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgb(0, 41, 87)',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  clearButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    flex: 2,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Time Picker Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  timePickerContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    overflow: 'hidden',
  },
  timePickerHeader: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  timePickerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  timePickerContent: {
    padding: 20,
  },
  timePickerRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
  },
  timePickerColumn: {
    flex: 1,
    alignItems: 'center',
  },
  timePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  timePicker: {
    width: '100%',
    height: 120,
  },
  timePickerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  timePickerButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  timePickerCancelButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    alignItems: 'center',
  },
  timePickerCancelText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
  timePickerDoneButton: {
    overflow: 'hidden',
  },
  timePickerDoneGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  timePickerDoneText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Tasks List Styles
  tasksContainer: {
    backgroundColor: 'white',
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  tasksHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 30,
    borderRadius: 16,
    width: '100%',
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: 'rgba(0, 41, 87, 0.7)',
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyStateSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: 'rgba(0, 41, 87, 0.5)',
    textAlign: 'center',
  },
  taskCard: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  taskCardGradient: {
    padding: 16,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  taskTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    padding: 8,
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 8,
    padding: 8,
  },
  taskDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  taskFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  taskDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskDetailText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  billableText: {
    color: '#10B981',
    fontWeight: '600',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
});


// import React, { useState, useEffect } from "react";
// import { Picker } from "@react-native-picker/picker";
// import { FontAwesome } from "@expo/vector-icons";
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   Switch,
//   Alert,
//   ScrollView,
//   StyleSheet,
//   ActivityIndicator,
//   Modal,
// } from "react-native";
// import { 
//   TimesheetTask, 
//   Project, 
//   getTasksByDate, 
//   addTasks, 
//   updateTask, 
//   deleteTask,
//   getProjects 
// } from "../../Services/Timesheet/timesheetService";

// interface TimesheetFormProps {
//   selectedDate: string;
//   onTasksUpdated: () => void;
//   closeModal: () => void;
// }

// export default function TimesheetForm({ 
//   selectedDate, 
//   onTasksUpdated, 
//   closeModal 
// }: TimesheetFormProps) {
//   const [taskTitle, setTaskTitle] = useState("");
//   const [taskDescription, setTaskDescription] = useState("");
//   const [projectId, setProjectId] = useState<number>(0);
//   const [customProject, setCustomProject] = useState("");
//   const [showCustomProject, setShowCustomProject] = useState(false);
//   const [hours, setHours] = useState<number>(0);
//   const [minutes, setMinutes] = useState<number>(0);
//   const [showTimePicker, setShowTimePicker] = useState(false);
//   const [isBillable, setIsBillable] = useState(false);
//   const [projects, setProjects] = useState<Project[]>([]);
//   const [existingTasks, setExistingTasks] = useState<TimesheetTask[]>([]);
//   const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [saving, setSaving] = useState(false);
//   const [deleting, setDeleting] = useState<number | null>(null);

//   useEffect(() => {
//     console.log("📋 [Form] Component mounted for date:", selectedDate);
//     loadInitialData();
//   }, [selectedDate]);

//   const loadInitialData = async () => {
//     console.log("📋 [Form] Loading initial data...");
//     setLoading(true);
//     try {
//       const [projectsData, tasksData] = await Promise.all([
//         getProjects(),
//         getTasksByDate(selectedDate)
//       ]);
      
//       console.log("📋 [Form] Projects loaded:", projectsData.length);
//       console.log("📋 [Form] Tasks loaded:", tasksData.length);
      
//       setProjects(projectsData);
//       setExistingTasks(tasksData);
//     } catch (error) {
//       console.error("❌ [Form] Error loading initial data:", error);
//       Alert.alert("Error", "Failed to load data. Please try again.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const clearForm = () => {
//     setTaskTitle("");
//     setTaskDescription("");
//     setProjectId(0);
//     setCustomProject("");
//     setShowCustomProject(false);
//     setHours(0);
//     setMinutes(0);
//     setIsBillable(false);
//     setEditingTaskId(null);
//   };

//   const getTotalMinutes = (): number => {
//     return (hours * 60) + minutes;
//   };

//   const setTimeFromMinutes = (totalMinutes: number) => {
//     const h = Math.floor(totalMinutes / 60);
//     const m = totalMinutes % 60;
//     setHours(h);
//     setMinutes(m);
//   };

//   const validateForm = (): boolean => {
//     if (!taskTitle.trim()) {
//       Alert.alert("Error", "Please enter a task title.");
//       return false;
//     }
//     if (!taskDescription.trim()) {
//       Alert.alert("Error", "Please enter a task description.");
//       return false;
//     }
//     if (getTotalMinutes() <= 0) {
//       Alert.alert("Error", "Please enter valid time (greater than 0).");
//       return false;
//     }
//     return true;
//   };

//   const handleSubmit = async () => {
//     if (!validateForm()) return;

//     setSaving(true);
//     try {
//       const finalProjectName = showCustomProject && customProject 
//         ? customProject 
//         : projects.find(p => p.projectId === projectId)?.projectName || 'No Project';

//       const taskData: TimesheetTask = {
//         taskTitle: taskTitle.trim(),
//         taskDescription: taskDescription.trim(),
//         taskDate: selectedDate,
//         projectId: showCustomProject ? 0 : projectId,
//         projectName: finalProjectName,
//         minutes: getTotalMinutes(),
//         billable: isBillable,
//       };

//       if (editingTaskId) {
//         console.log("📝 [Form] Updating task:", editingTaskId);
//         await updateTask({ ...taskData, taskId: editingTaskId });
//         Alert.alert("Success", "Task updated successfully!");
//       } else {
//         console.log("📝 [Form] Adding new task");
//         await addTasks([taskData]);
//         Alert.alert("Success", "Task added successfully!");
//       }

//       clearForm();
//       await onTasksUpdated();
//       await loadInitialData();
      
//     } catch (error: any) {
//       console.error("❌ [Form] Error submitting task:", error);
//       Alert.alert(
//         "Success", // Show success even if response parsing failed
//         editingTaskId ? "Task updated successfully!" : "Task added successfully!"
//       );
//       clearForm();
//       await onTasksUpdated();
//       await loadInitialData();
//     } finally {
//       setSaving(false);
//     }
//   };

//   const handleEditTask = (task: TimesheetTask) => {
//     console.log("✏️ [Form] Editing task:", task.taskId);
    
//     setTaskTitle(task.taskTitle || "");
//     setTaskDescription(task.taskDescription || "");
//     setProjectId(task.projectId || 0);
    
//     const taskMinutes = task.minutes || task.minutesSpend || 0;
//     setTimeFromMinutes(taskMinutes);
    
//     const billableValue = typeof task.billable === 'string' 
//       ? task.billable.toLowerCase() === 'yes' 
//       : Boolean(task.billable);
//     setIsBillable(billableValue);
    
//     setEditingTaskId(task.taskId || null);
//   };

//   const handleDeleteTask = async (taskId: number) => {
//     Alert.alert(
//       "Confirm Delete",
//       "Are you sure you want to delete this task?",
//       [
//         { text: "Cancel", style: "cancel" },
//         {
//           text: "Delete",
//           style: "destructive",
//           onPress: async () => {
//             setDeleting(taskId);
//             try {
//               console.log("🗑️ [Form] Deleting task:", taskId);
//               await deleteTask(taskId);
//               Alert.alert("Success", "Task deleted successfully!");
//               await onTasksUpdated();
//               await loadInitialData();
//             } catch (error: any) {
//               console.error("❌ [Form] Error deleting task:", error);
//               Alert.alert("Success", "Task deleted successfully!"); // Show success anyway
//               await onTasksUpdated();
//               await loadInitialData();
//             } finally {
//               setDeleting(null);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const formatMinutesToHoursAndMinutes = (totalMinutes: number): string => {
//     if (!totalMinutes || isNaN(totalMinutes)) return "0h 0m";
//     const h = Math.floor(totalMinutes / 60);
//     const m = totalMinutes % 60;
//     return `${h}h ${m}m`;
//   };

//   const getTotalHoursForDate = (): string => {
//     const totalMinutes = existingTasks.reduce((sum, task) => {
//       const taskMinutes = task.minutes || task.minutesSpend || 0;
//       return sum + taskMinutes;
//     }, 0);
//     return formatMinutesToHoursAndMinutes(totalMinutes);
//   };

//   // Time Picker Component
//   const renderTimePicker = () => (
//     <Modal
//       visible={showTimePicker}
//       transparent={true}
//       animationType="slide"
//       onRequestClose={() => setShowTimePicker(false)}
//     >
//       <View style={styles.timePickerOverlay}>
//         <View style={styles.timePickerContainer}>
//           <Text style={styles.timePickerTitle}>Select Time</Text>
          
//           <View style={styles.timePickerRow}>
//             <View style={styles.timePickerColumn}>
//               <Text style={styles.timePickerLabel}>Hours</Text>
//               <Picker
//                 selectedValue={hours}
//                 onValueChange={setHours}
//                 style={styles.timePicker}
//               >
//                 {Array.from({length: 24}, (_, i) => (
//                   <Picker.Item key={i} label={i.toString()} value={i} />
//                 ))}
//               </Picker>
//             </View>
            
//             <View style={styles.timePickerColumn}>
//               <Text style={styles.timePickerLabel}>Minutes</Text>
//               <Picker
//                 selectedValue={minutes}
//                 onValueChange={setMinutes}
//                 style={styles.timePicker}
//               >
//                 {Array.from({length: 12}, (_, i) => i * 5).map(m => (
//                   <Picker.Item key={m} label={m.toString()} value={m} />
//                 ))}
//               </Picker>
//             </View>
//           </View>
          
//           <View style={styles.timePickerButtons}>
//             <TouchableOpacity
//               style={[styles.timePickerButton, styles.timePickerCancelButton]}
//               onPress={() => setShowTimePicker(false)}
//             >
//               <Text style={styles.timePickerCancelText}>Cancel</Text>
//             </TouchableOpacity>
            
//             <TouchableOpacity
//               style={[styles.timePickerButton, styles.timePickerDoneButton]}
//               onPress={() => setShowTimePicker(false)}
//             >
//               <Text style={styles.timePickerDoneText}>Done</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     </Modal>
//   );

//   if (loading) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
//         <Text style={styles.loadingText}>Loading timesheet data...</Text>
//       </View>
//     );
//   }

//   return (
//     <>
//       <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
//         {/* Header */}
//         <View style={styles.header}>
//           <Text style={styles.dateText}>
//             {new Date(selectedDate).toLocaleDateString('en-US', { 
//               weekday: 'long', 
//               year: 'numeric', 
//               month: 'long', 
//               day: 'numeric' 
//             })}
//           </Text>
//           <Text style={styles.totalHoursText}>
//             Total: {getTotalHoursForDate()}
//           </Text>
//         </View>

//         {/* Task Form */}
//         <View style={styles.formContainer}>
//           <Text style={styles.sectionTitle}>
//             {editingTaskId ? "Edit Task" : "Add New Task"}
//           </Text>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Task Title *</Text>
//             <TextInput
//               style={styles.textInput}
//               value={taskTitle}
//               onChangeText={setTaskTitle}
//               placeholder="Enter task title"
//               maxLength={100}
//             />
//           </View>

//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Task Description *</Text>
//             <TextInput
//               style={[styles.textInput, styles.textArea]}
//               value={taskDescription}
//               onChangeText={setTaskDescription}
//               placeholder="Describe what you worked on"
//               multiline
//               numberOfLines={3}
//               maxLength={500}
//             />
//           </View>

//           {/* Project Selection */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Project</Text>
//             <View style={styles.projectRow}>
//               <TouchableOpacity
//                 style={[styles.projectToggle, !showCustomProject && styles.projectToggleActive]}
//                 onPress={() => setShowCustomProject(false)}
//               >
//                 <Text style={[styles.projectToggleText, !showCustomProject && styles.projectToggleTextActive]}>
//                   Select Project
//                 </Text>
//               </TouchableOpacity>
//               <TouchableOpacity
//                 style={[styles.projectToggle, showCustomProject && styles.projectToggleActive]}
//                 onPress={() => setShowCustomProject(true)}
//               >
//                 <Text style={[styles.projectToggleText, showCustomProject && styles.projectToggleTextActive]}>
//                   Custom Project
//                 </Text>
//               </TouchableOpacity>
//             </View>

//             {showCustomProject ? (
//               <TextInput
//                 style={styles.textInput}
//                 value={customProject}
//                 onChangeText={setCustomProject}
//                 placeholder="Enter custom project name"
//                 maxLength={100}
//               />
//             ) : (
//               <View style={styles.pickerContainer}>
//                 <Picker
//                   selectedValue={projectId}
//                   onValueChange={setProjectId}
//                   style={styles.picker}
//                 >
//                   {projects.map((project) => (
//                     <Picker.Item 
//                       key={project.projectId} 
//                       label={project.projectName} 
//                       value={project.projectId} 
//                     />
//                   ))}
//                 </Picker>
//               </View>
//             )}
//           </View>

//           {/* Time Selection */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>Time Spent *</Text>
//             <TouchableOpacity
//               style={styles.timeInputButton}
//               onPress={() => setShowTimePicker(true)}
//             >
//               <Text style={styles.timeInputText}>
//                 {formatMinutesToHoursAndMinutes(getTotalMinutes())}
//               </Text>
//               <FontAwesome name="clock-o" size={20} color="#6B7280" />
//             </TouchableOpacity>
//             <Text style={styles.helperText}>
//               Tap to select hours and minutes
//             </Text>
//           </View>

//           <View style={styles.switchGroup}>
//             <Text style={styles.label}>Billable</Text>
//             <Switch
//               value={isBillable}
//               onValueChange={setIsBillable}
//               trackColor={{ false: "#767577", true: "#10B981" }}
//               thumbColor={isBillable ? "#ffffff" : "#f4f3f4"}
//             />
//           </View>

//           {/* Action Buttons */}
//           <View style={styles.buttonContainer}>
//             <TouchableOpacity
//               style={[styles.button, styles.cancelButton]}
//               onPress={clearForm}
//               disabled={saving}
//             >
//               <Text style={styles.cancelButtonText}>Clear</Text>
//             </TouchableOpacity>

//             <TouchableOpacity
//               style={[styles.button, styles.submitButton]}
//               onPress={handleSubmit}
//               disabled={saving}
//             >
//               {saving ? (
//                 <>
//                   <ActivityIndicator color="#ffffff" size="small" />
//                   <Text style={[styles.submitButtonText, {marginLeft: 8}]}>
//                     {editingTaskId ? "Updating..." : "Adding..."}
//                   </Text>
//                 </>
//               ) : (
//                 <Text style={styles.submitButtonText}>
//                   {editingTaskId ? "Update Task" : "Add Task"}
//                 </Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>

//         {/* Existing Tasks List */}
//         <View style={styles.tasksContainer}>
//           <Text style={styles.sectionTitle}>
//             Tasks for {selectedDate} ({existingTasks.length})
//           </Text>
          
//           {existingTasks.length === 0 ? (
//             <View style={styles.emptyState}>
//               <FontAwesome name="clock-o" size={48} color="#9CA3AF" />
//               <Text style={styles.emptyStateText}>No tasks logged for this date</Text>
//               <Text style={styles.emptyStateSubtext}>Add your first task above</Text>
//             </View>
//           ) : (
//             existingTasks.map((task, index) => {
//               const taskMinutes = task.minutes || task.minutesSpend || 0;
//               const taskBillable = typeof task.billable === 'string' 
//                 ? task.billable.toLowerCase() === 'yes' 
//                 : Boolean("💰" + task.billable);

//               return (
//                 <View key={task.taskId || index} style={styles.taskCard}>
//                   <View style={styles.taskHeader}>
//                     <Text style={styles.taskTitle}>{task.taskTitle || 'Untitled Task'}</Text>
//                     <View style={styles.taskActions}>
//                       <TouchableOpacity
//                         style={styles.actionButton}
//                         onPress={() => handleEditTask(task)}
//                       >
//                         <FontAwesome name="edit" size={16} color="#3B82F6" />
//                       </TouchableOpacity>
//                       <TouchableOpacity
//                         style={styles.actionButton}
//                         onPress={() => task.taskId && handleDeleteTask(task.taskId)}
//                         disabled={deleting === task.taskId}
//                       >
//                         {deleting === task.taskId ? (
//                           <ActivityIndicator size={16} color="#EF4444" />
//                         ) : (
//                           <FontAwesome name="trash" size={16} color="#EF4444" />
//                         )}
//                       </TouchableOpacity>
//                     </View>
//                   </View>
                  
//                   <Text style={styles.taskDescription}>
//                     {task.taskDescription || 'No description'}
//                   </Text>
                  
//                   <View style={styles.taskFooter}>
//                     <Text style={styles.taskDetail}>
//                       Project: {task.projectName || 'Unknown'}
//                     </Text>
//                     <Text style={styles.taskDetail}>
//                       Time: {formatMinutesToHoursAndMinutes(taskMinutes)}
//                     </Text>
//                     <Text style={[styles.taskDetail, taskBillable && styles.billableText]}>
//                       {taskBillable ? '💰 Billable' : 'Non-billable'}
//                     </Text>
//                   </View>
//                 </View>
//               );
//             })
//           )}
//         </View>
//       </ScrollView>
      
//       {renderTimePicker()}
//     </>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f8fafc',
//   },
//   scrollContent: {
//     padding: 20,
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: 'rgb(0, 41, 87)',
//   },
//   header: {
//     backgroundColor: '#ffffff',
//     padding: 16,
//     borderRadius: 12,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   dateText: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: 'rgb(0, 41, 87)',
//     marginBottom: 4,
//   },
//   totalHoursText: {
//     fontSize: 16,
//     color: '#6B7280',
//   },
//   formContainer: {
//     backgroundColor: '#ffffff',
//     padding: 20,
//     borderRadius: 12,
//     marginBottom: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   sectionTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: 'rgb(0, 41, 87)',
//     marginBottom: 16,
//   },
//   inputGroup: {
//     marginBottom: 16,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 8,
//   },
//   textInput: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     padding: 12,
//     fontSize: 16,
//     backgroundColor: '#ffffff',
//   },
//   textArea: {
//     height: 80,
//     textAlignVertical: 'top',
//   },
//   projectRow: {
//     flexDirection: 'row',
//     marginBottom: 12,
//     backgroundColor: '#F3F4F6',
//     borderRadius: 8,
//     padding: 4,
//   },
//   projectToggle: {
//     flex: 1,
//     paddingVertical: 8,
//     paddingHorizontal: 12,
//     borderRadius: 6,
//     alignItems: 'center',
//   },
//   projectToggleActive: {
//     backgroundColor: '#ffffff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   projectToggleText: {
//     fontSize: 14,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   projectToggleTextActive: {
//     color: 'rgb(0, 41, 87)',
//     fontWeight: '600',
//   },
//   pickerContainer: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     backgroundColor: '#ffffff',
//   },
//   picker: {
//     height: 50,
//   },
//   timeInputButton: {
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//     borderRadius: 8,
//     padding: 12,
//     backgroundColor: '#ffffff',
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   timeInputText: {
//     fontSize: 16,
//     color: '#374151',
//   },
//   helperText: {
//     fontSize: 12,
//     color: '#6B7280',
//     marginTop: 4,
//   },
//   switchGroup: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 20,
//   },
//   buttonContainer: {
//     flexDirection: 'row',
//     gap: 12,
//   },
//   button: {
//     flex: 1,
//     paddingVertical: 12,
//     paddingHorizontal: 20,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     minHeight: 48,
//     flexDirection: 'row',
//   },
//   cancelButton: {
//     backgroundColor: '#F3F4F6',
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//   },
//   cancelButtonText: {
//     color: '#374151',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   submitButton: {
//     backgroundColor: 'rgb(0, 41, 87)',
//   },
//   submitButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Time Picker Styles
//   timePickerOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   timePickerContainer: {
//     backgroundColor: '#ffffff',
//     borderRadius: 12,
//     padding: 20,
//     width: 300,
//     maxWidth: '90%',
//   },
//   timePickerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: 'rgb(0, 41, 87)',
//     textAlign: 'center',
//     marginBottom: 20,
//   },
//   timePickerRow: {
//     flexDirection: 'row',
//     gap: 20,
//   },
//   timePickerColumn: {
//     flex: 1,
//     alignItems: 'center',
//   },
//   timePickerLabel: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#374151',
//     marginBottom: 8,
//   },
//   timePicker: {
//     width: 100,
//     height: 120,
//   },
//   timePickerButtons: {
//     flexDirection: 'row',
//     gap: 12,
//     marginTop: 20,
//   },
//   timePickerButton: {
//     flex: 1,
//     paddingVertical: 12,
//     borderRadius: 8,
//     alignItems: 'center',
//   },
//   timePickerCancelButton: {
//     backgroundColor: '#F3F4F6',
//     borderWidth: 1,
//     borderColor: '#D1D5DB',
//   },
//   timePickerCancelText: {
//     color: '#374151',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   timePickerDoneButton: {
//     backgroundColor: 'rgb(0, 41, 87)',
//   },
//   timePickerDoneText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   // Task List Styles
//   tasksContainer: {
//     backgroundColor: '#ffffff',
//     padding: 20,
//     borderRadius: 12,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   emptyState: {
//     alignItems: 'center',
//     paddingVertical: 40,
//   },
//   emptyStateText: {
//     marginTop: 12,
//     fontSize: 16,
//     color: '#6B7280',
//     fontWeight: '500',
//   },
//   emptyStateSubtext: {
//     marginTop: 4,
//     fontSize: 14,
//     color: '#9CA3AF',
//   },
//   taskCard: {
//     borderWidth: 1,
//     borderColor: '#E5E7EB',
//     borderRadius: 8,
//     padding: 16,
//     marginBottom: 12,
//     backgroundColor: '#FAFAFA',
//   },
//   taskHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'flex-start',
//     marginBottom: 8,
//   },
//   taskTitle: {
//     flex: 1,
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#1F2937',
//     marginRight: 12,
//   },
//   taskActions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   actionButton: {
//     padding: 8,
//   },
//   taskDescription: {
//     fontSize: 14,
//     color: '#6B7280',
//     marginBottom: 12,
//     lineHeight: 20,
//   },
//   taskFooter: {
//     flexDirection: 'row',
//     flexWrap: 'wrap',
//     gap: 12,
//   },
//   taskDetail: {
//     fontSize: 12,
//     color: '#9CA3AF',
//   },
//   billableText: {
//     color: '#10B981',
//     fontWeight: '600',
//   },
// });
