import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Platform, ScrollView, Linking } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import { MaterialIcons } from '@expo/vector-icons';

const TaxModule = () => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const [selectedYear, setSelectedYear] = useState(null);

  const years = Array.from({ length: 5 }, (_, i) => ({
    label: `${currentYear - i}`,
    value: currentYear - i,
  }));
  console.log(currentYear, currentMonth, selectedYear);

  const allMonths = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const months = selectedYear === currentYear ? allMonths.slice(0, currentMonth + 1) : allMonths;

 const handleDownload = (month) => {
  const dummyPDFUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  Linking.openURL(dummyPDFUrl)
    .then(() => console.log(`Opening PDF for ${month} ${selectedYear}`))
    .catch((err) => console.error('Failed to open PDF:', err));
};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>💼 Salary Slip </Text>
      <Text style={styles.subtitle}>Download your monthly salary slips below</Text>

      <View style={{ paddingVertical: 10 }}>
        <RNPickerSelect
          onValueChange={(value) => setSelectedYear(value)}
          items={years}
          value={selectedYear}
          useNativeAndroidPickerStyle={false}
          placeholder={{ label: 'Select Year', value: null }}
          doneText="Done"
          style={{
            ...pickerSelectStyles,
            iconContainer: {
              top: Platform.OS === 'ios' ? 10 : 8,
              right: 12,
            },
          }}
          Icon={() => (
            <MaterialIcons name="arrow-drop-down" size={30} color="gray" />
          )}
        />
      </View>


      <FlatList
        data={selectedYear ? months : []}
        keyExtractor={(item) => item}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
        ListEmptyComponent={
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 }}>
            <Text style={{ fontSize: 16, color: '#888' }}>
              {selectedYear ? 'No salary slips available.' : 'Please select a year to view salary slips.'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.monthText}>{item}, {selectedYear}</Text>
            <TouchableOpacity style={styles.downloadButton} onPress={() => handleDownload(item)}>
              <MaterialIcons name="file-download" size={20} color="#fff" />
              <Text style={styles.downloadText}>Download</Text>
            </TouchableOpacity>
          </View>
        )}
      />

    </View>
  );
};

export default TaxModule;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EEF3F9',
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#002957',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 14 : 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  pickerLabel: {
    fontSize: 14,
    marginBottom: Platform.OS === 'ios' ? 8 : 0,
    color: '#333',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495E',
  },
  downloadButton: {
    flexDirection: 'row',
    backgroundColor: '#002957',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 6,
  },
});

const pickerSelectStyles = {
  inputIOS: {
    // color:"black",
    // borderColor: "gray",
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    height: 50,  // 👈 Same height
  },
  inputAndroid: {
    color:"black",
    fontSize: 16,
    // borderColor: "gray",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    height: 50,  // 👈 Same height
  },
};


