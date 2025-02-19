import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView } from 'react-native';
import { TextInput, FAB } from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';

const ReimbursementForm: React.FC = () => {
  const [name, setName] = useState<string>('');
  const [employeeCode, setEmployeeCode] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [expenseDescription, setExpenseDescription] = useState<string>('');
  const [documents, setDocuments] = useState<any[]>([]); // To store multiple uploaded documents

  const handleSubmit = () => {
    console.log('Name:', name);
    console.log('Employee Code:', employeeCode);
    console.log('Amount:', amount);
    console.log('Date:', date);
    console.log('Expense Description:', expenseDescription);
    if (documents.length > 0) {
      console.log('Uploaded Documents:', documents.map(doc => doc.name || doc.uri));
    }
  };

  const handleDocumentUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all types of documents
      });
      console.log('Uploaded document:', res); // Log response for debugging
  
      if (res.type === 'success' && res.assets.length > 0) {
        const document = res.assets[0]; // Access the first document from assets
        setDocuments(prevDocs => [...prevDocs, document]); // Add document to the list
      }
    } catch (err) {
      console.error('Document pick error', err);
    }
  };
  
  
  

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Reimbursement Request</Text>

        {/* Name and Employee Code on the same line */}
        <View style={styles.row}>
          <TextInput
            label="Name"
            value={name}
            onChangeText={setName}
            style={[styles.input, styles.halfWidth]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: 'white' } }}
          />
          <TextInput
            label="Employee Code"
            value={employeeCode}
            onChangeText={setEmployeeCode}
            style={[styles.input, styles.halfWidth]}
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
          label="Date of Reimbursement"
          value={date}
          onChangeText={setDate}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: 'white' } }}
        />
        <TextInput
          label="Expense Description"
          value={expenseDescription}
          onChangeText={setExpenseDescription}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: 'white' } }}
        />

        <View style={styles.documentUploadContainer}>
          <Button
            title="Upload Document"
            onPress={handleDocumentUpload}
            color="rgb(0, 41, 87)"
          />
    {documents.length > 0 ? (
  <View style={styles.documentList}>
    <Text style={styles.documentText}>Uploaded Documents:</Text>
    {documents.map((doc, index) => (
      <View key={index} style={styles.documentItem}>
        <Text style={styles.documentName}>
          {doc.name ? doc.name : doc.uri ? doc.uri : 'Unnamed Document'}
        </Text>
      </View>
    ))}
  </View>
) : (
  <Text style={styles.documentText}>No documents uploaded yet.</Text>
)}




        </View>

        <Button title="Submit Request" onPress={handleSubmit} color="rgb(0, 41, 87)" />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="receipt"
        label="Reimbursement History"
        onPress={() => console.log("FAB Pressed")}
        color="white"
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
    paddingBottom: 80, // To avoid the FAB from overlapping the content
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'rgb(0, 41, 87)',
    marginBottom: 30,
    textAlign: 'center',
  },
  input: {
    marginBottom: 20,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  documentUploadContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgb(0, 41, 87)',
  },
  documentList: {
    marginTop: 10,
  },
  documentItem: {
    marginBottom: 10,
  },
  documentName: {
    fontSize: 14,
    color: 'rgb(0, 41, 87)',
  },
  documentText: {
    fontSize: 18,
    color: 'black',
    marginTop: 10,
    marginBottom: 10,
    fontStyle: 'italic',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgb(0, 41, 87)',
    borderRadius: 50,
  },
});

export default ReimbursementForm;
