import React, { useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart } from 'react-native-chart-kit';
import RNPickerSelect from 'react-native-picker-select';

const Dashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState('February');
  const { width } = useWindowDimensions();

  const monthlyData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [{ data: [80, 85, 78, 90], strokeWidth: 3 }],
  };

  const categoryData = {
    labels: ['Present', 'Absent', 'Late', 'Leave'],
    datasets: [{ data: [25, 5, 3, 2] }],
  };

  const chartConfig = {
    backgroundColor: '#f9f9f9',
    backgroundGradientFrom: '#f9f9f9',
    backgroundGradientTo: '#f9f9f9',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 123, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
    style: { borderRadius: 16 },
    propsForDots: { r: '5', strokeWidth: '2', stroke: '#007bff' },
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <LinearGradient colors={['#274c77', 'rgb(0, 41, 87)']} style={styles.header}>
      </LinearGradient>

      <View style={styles.statsContainer}>
        {[{ label: 'Present', value: 25, icon: 'checkmark-circle-outline' as 'checkmark-circle-outline', color: '#4caf50' },
          { label: 'Absent', value: 5, icon: 'close-circle-outline' as 'close-circle-outline', color: '#f44336' },
          { label: 'Late', value: 3, icon: 'time-outline' as 'time-outline', color: '#ff9800' },
          { label: 'Leaves', value: 2, icon: 'calendar-outline' as 'calendar-outline', color: '#2196f3' }]
          .map((item, index) => (
            <View key={index} style={[styles.statCard, { width: width / 2 - 30 }]}>
              <Ionicons name={item.icon} size={40} color={item.color} style={styles.statIcon} />
              <Text style={styles.statLabel}>{item.label}</Text>
              <Text style={styles.statValue}>{item.value}</Text>
            </View>
          ))}
      </View>

      <View style={styles.pickerContainer}>
        <Text style={styles.sectionTitle}>Select Month</Text>
        <RNPickerSelect
          onValueChange={(value) => setSelectedMonth(value)}
          items={['January', 'February', 'March', 'April'].map((m) => ({ label: m, value: m }))}
          style={pickerSelectStyles}
          value={selectedMonth}
        />
      </View>

      <View style={styles.graphContainer}>
        <Text style={styles.sectionTitle}>Monthly Attendance Trend</Text>
        <LineChart data={monthlyData} width={width - 40} height={250} chartConfig={chartConfig} bezier style={styles.chartStyle} />
      </View>

      <View style={styles.graphContainer}>
        <Text style={styles.sectionTitle}>Category-wise Attendance</Text>
        <BarChart data={categoryData} width={width - 40} height={250} chartConfig={chartConfig} style={styles.chartStyle} fromZero yAxisLabel="" yAxisSuffix="" />
      </View>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  header: { height: 160, justifyContent: 'center', alignItems: 'center', borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 28, color: '#fff', fontWeight: 'bold', textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  statsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: -60, marginHorizontal: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 15, paddingVertical: 20, alignItems: 'center', margin: 10, elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6 },
  statLabel: { marginTop: 10, fontSize: 16, color: '#333', fontWeight: '600' },
  statValue: { marginTop: 5, fontSize: 22, fontWeight: 'bold', color: '#333' },
  statIcon: { marginBottom: 10 },
  graphContainer: { marginTop: 30, marginHorizontal: 10, backgroundColor: '#fff', borderRadius: 15, padding: 15, elevation: 6, shadowColor: '#000', shadowOpacity: 0.15, shadowOffset: { width: 0, height: 1 }, shadowRadius: 4 },
  sectionTitle: { fontSize: 22, fontWeight: '600', marginBottom: 10, color: '#333', textAlign: 'center' },
  chartStyle: { borderRadius: 16 },
  pickerContainer: { marginHorizontal: 10, marginTop: 20 },
});

const pickerSelectStyles = {
  inputIOS: { fontSize: 18, paddingVertical: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff', color: '#333', marginTop: 5 },
  inputAndroid: { fontSize: 18, paddingVertical: 8, paddingHorizontal: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, backgroundColor: '#fff', color: '#333', marginTop: 5 },
};

export default Dashboard;
