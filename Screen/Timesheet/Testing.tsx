import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const App = () => {
  const [selectedDate, setSelectedDate] = useState('');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Calendar
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
        }}
        markedDates={{
          [selectedDate]: { selected: true, marked: true, selectedColor: '#004186' },
        }}
        theme={{
          selectedDayBackgroundColor: '#004186',
          todayTextColor: '#004186',
          arrowColor: '#004186',
          monthTextColor: '#004186',
        }}
      />
    </SafeAreaView>
  );
};

export default App;
