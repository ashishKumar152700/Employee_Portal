import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { TextInput, FAB } from 'react-native-paper';
import { RootStackParamList } from '../../Global/Types';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSelector } from 'react-redux';

const SalaryAdvanceRequestForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [approverName, setApproverName] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  type salaryAdHistory = StackNavigationProp<RootStackParamList, 'salaryAdHistory'>;

  const managerDetailsSelector = useSelector((state:any) => state.managerInfo ) ;
  const userDetailsSelector = useSelector((state:any) => state.userDetails ) ;
  

  const navigation = useNavigation(); 
  const handlesalaryAdHistoryPress = () => {
    navigation.navigate('salaryAdHistory');
  };

  const handleSubmit = () => {
    console.log('Name:', name);
    console.log('Employee Code:', employeeCode);
    console.log('Department:', department);
    console.log('Approver Name:', approverName);
    console.log('Amount:', amount);
    console.log('Reason:', reason);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Salary Advance Request</Text>

        <View style={styles.row}>
          <TextInput
            label="Name"
            value={userDetailsSelector.user.name}
            // onChangeText={setName}
            disabled
            style={[styles.input, styles.halfInput]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: 'white' } }}
          />
          <TextInput
            label="Employee Code"
            value={String(userDetailsSelector.user.employeecode)}
            // onChangeText={setEmployeeCode}
            disabled
            style={[styles.input, styles.halfInput]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: 'white' } }}
          />
        </View>

        {/* Approver Name and Department in the same row */}
        <View style={styles.row}>
          <TextInput
            label="Approver Name"
            value={managerDetailsSelector.name}
            // onChangeText={setApproverName}
            disabled
            style={[styles.input, styles.halfInput]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: 'white' } }}
          />
          <TextInput
            label="Department"
            value={department}
            onChangeText={setDepartment}

            style={[styles.input, styles.halfInput]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: 'white' } }}
          />
        </View>

        <TextInput
          label="Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: 'white' } }}
        />
        <TextInput
          label="Reason for Advance"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: 'white' } }}
        />

     
                <Button title="Submit Request" onPress={handleSubmit} color="rgb(0, 41, 87)" />
        
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="currency-usd"
        label="Requests"
        color="white"
        onPress={handlesalaryAdHistoryPress}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    padding: 20,
    paddingBottom: 100,  // Increased padding to avoid UI overlap with FAB
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    color: 'rgb(0, 41, 87)',
    marginBottom: 30,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'white',
  },
  submitButton: {
    backgroundColor: 'rgb(0, 41, 87)',
    borderRadius: 5,
    marginTop: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgb(0, 41, 87)',
    borderRadius: 50,
  },
});

export default SalaryAdvanceRequestForm;
