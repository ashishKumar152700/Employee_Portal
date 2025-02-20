import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { MaterialIcons } from '@expo/vector-icons';

const TaxModule = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const years = Array.from({ length: 5 }, (_, i) => ({
    label: `${currentYear - i}`,
    value: currentYear - i,
  }));

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const months = selectedYear === currentYear ? allMonths.slice(0, currentMonth + 1) : allMonths;

  const handleDownload = (month) => {
    console.log(`Downloading salary slip for ${month} ${selectedYear}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Salary Slips</Text>
      
      <View style={styles.pickerContainer}>
        <RNPickerSelect
          onValueChange={(value) => setSelectedYear(value)}
          items={years}
          value={selectedYear}
          style={pickerSelectStyles}
        />
      </View>
      
      <FlatList
        data={months}
        keyExtractor={(item) => item}
        renderItem={({ item }) => (
          <View style={styles.salarySlipRow}>
            <Text style={styles.monthText}>{item} ,{selectedYear}</Text>
            <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(item)}>
              <MaterialIcons name="file-download" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#F7F9FC' },
  title: { fontSize: 30, fontWeight: 'bold', marginBottom: 20, color: '#1F3A93', textAlign: 'center' },
  pickerContainer: {
    padding: 1,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  salarySlipRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  monthText: { fontSize: 13, color: '#34495E', fontWeight: '600' },
  downloadButton: {
    backgroundColor: 'rgb(0, 41,87)',
    padding: 12,
    borderRadius: 5,
    shadowColor: '#1F3A93',
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
});

const pickerSelectStyles = {
  inputIOS: { fontSize: 16, padding: 12, backgroundColor: 'white', borderRadius: 8 },
  inputAndroid: { fontSize: 16, padding: 12, backgroundColor: 'white', borderRadius: 8 },
};

export default TaxModule;