import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, Text, View, TextStyle, Modal, Button, KeyboardAvoidingView, Platform } from 'react-native';
import { CalendarList, DateData } from 'react-native-calendars';
import testIDs from './TestId';
import TimesheetForm from './Timesheet';

const initialDate = '2025-01-01'; // January 1st, 2025

interface Props {
  horizontalView?: boolean;
}

const CalendarListScreen = (props: Props) => {
  const { horizontalView } = props;
  const [selected, setSelected] = useState(initialDate);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [editingTaskIndex, setEditingTaskIndex] = useState<number | null>(null);
  const [tasks, setTasks] = useState<{ [key: string]: any[] }>({});

  // Marked dates for the calendar
  const marked = useMemo(() => {
    return {
      [selected]: {
        selected: true,
        disableTouchEvent: true,
        selectedColor: '#5E60CE',
        selectedTextColor: 'white',
      },
    };
  }, [selected]);

  // Day press handler
  const onDayPress = useCallback((day: DateData) => {
    console.log('rrrrrr');
    
    setSelected(day.dateString);
    setSelectedDate(day.dateString);
    setModalVisible(true);
  }, []);

  // Add task for a specific date
  const addTaskToDate = (task: any) => {
    setTasks((prevTasks) => {
      const newTasks = { ...prevTasks };
      if (!newTasks[selectedDate]) {
        newTasks[selectedDate] = [];
      }
      newTasks[selectedDate].push(task);
      return newTasks;
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <CalendarList
        testID={testIDs.calendarList.CONTAINER}
        current={initialDate}
        pastScrollRange={0}
        futureScrollRange={11}
        onDayPress={onDayPress}
        markedDates={marked}
        renderHeader={!horizontalView ? renderCustomHeader : undefined}
        calendarHeight={!horizontalView ? 390 : undefined}
        theme={!horizontalView ? theme : undefined}
        horizontal={horizontalView}
        pagingEnabled={horizontalView}
        staticHeader={horizontalView}
        minDate={'2025-01-01'}
        maxDate={'2025-12-31'}
      />

      {modalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View
              style={{
                flex: 1,
                justifyContent: 'center',
                padding: 20,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
              }}
            >
              <View
                style={{
                  backgroundColor: 'white',
                  padding: 20,
                  borderRadius: 10,
                  maxHeight: '120%',
                }}
              >
                <TimesheetForm
                  selectedDate={selectedDate}
                  addTaskToDate={addTaskToDate}
                  closeModal={() => setModalVisible(false)}
                  taskToEdit={
                    editingTaskIndex !== null ? tasks[selectedDate || '']?.[editingTaskIndex] : null
                  }
                  tasksForSelectedDate={tasks[selectedDate || ''] || []}
                  editingTaskIndex={editingTaskIndex}
                />
                <Button title="Close" onPress={() => {
                  setSelected("");
                  setSelectedDate("");
                  setModalVisible(false)
                  } } />
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}
    </View>
  );
};

// Calendar theme customization
const theme = {
  stylesheet: {
    calendar: {
      header: {
        dayHeader: {
          fontWeight: '600',
          color: '#48BFE3',
        },
      },
    },
  },
  'stylesheet.day.basic': {
    today: {
      borderColor: '#48BFE3',
      borderWidth: 0.8,
    },
    todayText: {
      color: '#5390D9',
      fontWeight: '800',
    },
  },
};

// Custom calendar header
function renderCustomHeader(date: any) {
  const header = date.toString('MMMM yyyy');
  const [month, year] = header.split(' ');
  const textStyle: TextStyle = {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 10,
    paddingBottom: 10,
    color: '#5E60CE',
    paddingRight: 5,
  };

  return (
    <View style={styles.header}>
      <Text style={[styles.month, textStyle]}>{`${month}`}</Text>
      <Text style={[styles.year, textStyle]}>{year}</Text>
    </View>
  );
}

export default CalendarListScreen;

// Stylesheet
const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 10,
  },
  month: {
    marginLeft: 5,
  },
  year: {
    marginRight: 5,
  },
});
