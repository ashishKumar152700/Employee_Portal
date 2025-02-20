import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { FAB, TextInput } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../Global/Types';

const OvertimeRequestForm: React.FC = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hours, setHours] = useState('');
  const [reason, setReason] = useState('');
  const [projectName, setProjectName] = useState('');
  const navigation = useNavigation();

  const userDetails = useSelector((state: any) => state.userDetails);
  const managerDetails = useSelector((state: any) => state.managerInfo);

  type salaryAdHistory = StackNavigationProp<RootStackParamList, 'overtimeHistory'>;
  
  const HistoryPress = () => {
    navigation.navigate('overtimeHistory');
  };


  const handleSubmit = () => {
    console.log('Overtime Date:', date);
    console.log('Start Time:', startTime);
    console.log('End Time:', endTime);
    console.log('Total Hours:', hours);
    console.log('Reason:', reason);
    console.log('Project Name:', projectName);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Overtime Request</Text>
        <View style={styles.row}>
        <TextInput label="Name" value={userDetails.user.name} disabled  style={[styles.input, styles.halfInput]} mode="outlined" />
        <TextInput label="Employee Code" value={String(userDetails.user.employeecode)} disabled  style={[styles.input, styles.halfInput]} mode="outlined" />
        </View>
        <TextInput label="Approver Name" value={managerDetails.name} disabled style={styles.input} mode="outlined" />
        <TextInput label="Date" value={date} onChangeText={setDate} style={styles.input} mode="outlined" />
        <TextInput label="Start Time" value={startTime} onChangeText={setStartTime} style={styles.input} mode="outlined" />
        <TextInput label="End Time" value={endTime} onChangeText={setEndTime} style={styles.input} mode="outlined" />
        <TextInput label="Overtime Hours" keyboardType="numeric" value={hours} onChangeText={setHours} style={styles.input} mode="outlined" />
        <TextInput label="Reason" value={reason} onChangeText={setReason} style={styles.input} mode="outlined" multiline />
        <TextInput label="Project Name" value={projectName} onChangeText={setProjectName} style={styles.input} mode="outlined" />

        <Button title="Submit" onPress={handleSubmit} color="rgb(0, 41, 87)" />
      </ScrollView>
      <FAB
        style={styles.fab}
        icon="currency-usd"
        label="Requests"
        color="white"
        onPress={HistoryPress}
      />
    </View>
  );
};

export default OvertimeRequestForm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white' },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgb(0, 41, 87)',
    borderRadius: 50,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scrollView: { padding: 20, paddingBottom: 100 },
  title: { fontSize: 24, fontWeight: '600', color: 'rgb(0, 41, 87)', marginBottom: 20, textAlign: 'center' },
  input: { marginBottom: 15, backgroundColor: 'white' },
});
