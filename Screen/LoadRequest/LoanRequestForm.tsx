import React, { useState } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { TextInput, FAB } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../Global/Types";
import { useSelector } from "react-redux";

const LoanRequestForm: React.FC = () => {
  // const [name, setName] = useState<string>("");
  // const [employeeCode, setEmployeeCode] = useState<any>("");
  // const [approverName, setApproverName] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [loanAmount, setLoanAmount] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [loanType, setLoanType] = useState<string>("");
  const [otherLoanReason, setOtherLoanReason] = useState<string>("");
  const [monthlyIncome, setMonthlyIncome] = useState<string>("");
  const [repaymentPeriod, setRepaymentPeriod] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [emergencyContact, setEmergencyContact] = useState<string>("");
  const [documents, setDocuments] = useState<any[]>([]); // To store multiple uploaded documents
  type loanHistory = StackNavigationProp<RootStackParamList, 'loanHistory'>;

  const managerDetailsSelector = useSelector((state:any) => state.managerInfo ) ;
  const userDetailsSelector = useSelector((state:any) => state.userDetails ) ;
  

  const handleSubmit = () => {
    console.log("Employee Nmae:", userDetailsSelector.user.name);
    console.log("Employee Code:", userDetailsSelector.user.employeecode);
    console.log("Approver Name:", managerDetailsSelector.name);
    console.log("Department:", department);
    console.log("Loan Amount:", loanAmount);
    console.log("Reason:", reason);
    console.log("Loan Type:", loanType);
    console.log("Monthly Income:", monthlyIncome);
    console.log("Repayment Period:", repaymentPeriod);
    console.log("Address:", address);
    console.log("Emergency Contact:", emergencyContact);
    if (loanType === "other") {
      console.log("Other Loan Reason:", otherLoanReason);
    }
    if (documents.length > 0) {
      console.log(
        "Uploaded Documents:",
        documents.map((doc) => doc.name)
      );
    }
  };

  const handleLoanTypeChange = (itemValue: string) => {
    setLoanType(itemValue);
    if (itemValue !== "other") {
      setOtherLoanReason("");
    }
  };

  const navigation = useNavigation(); 
  const handleLoanHistoryPress = () => {
    navigation.navigate('loanHistory');
  };

  const handleDocumentUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: "image/*", // Allow only image file types
      });
      if (res) {
        console.log("Uploaded document:", res); // Debugging line to check document info
        setDocuments((prevDocs) => [...prevDocs, res]); // Add new document to the list
      }
    } catch (err) {
      console.error("Document pick error", err);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Employee Loan Request</Text>

        {/* Name and Employee Code on the same line */}
        <View style={styles.row}>
          <TextInput
            label="Name"
            value={userDetailsSelector.user.name}
            disabled
            // onChangeText={setName}
            style={[styles.input, styles.halfWidth]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: "white" } }}
          />
          <TextInput
            label="Employee Code"
            value={String(userDetailsSelector.user.employeecode)}
            // onChangeText={setEmployeeCode}
            disabled
            style={[styles.input, styles.halfWidth]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: "white" } }}
          />
        </View>

        <View style={styles.row}>
          <TextInput
            label="Approver Name"
            value={managerDetailsSelector.name}
            // onChangeText={setApproverName}
            disabled
            style={[styles.input, styles.halfWidth]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: "white" } }}
          />
          <TextInput
            label="Department"
            value={department}
            disabled
            // onChangeText={setDepartment}
            style={[styles.input, styles.halfWidth]}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: "white" } }}
          />
        </View>

        <TextInput
          label="Loan Amount"
          keyboardType="numeric"
          value={loanAmount}
          onChangeText={setLoanAmount}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: "white" } }}
        />
        <TextInput
          label="Reason for Loan"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: "white" } }}
        />
        <TextInput
          label="Monthly Income"
          keyboardType="numeric"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: "white" } }}
        />
        <TextInput
          label="Repayment Period (Months)"
          keyboardType="numeric"
          value={repaymentPeriod}
          onChangeText={setRepaymentPeriod}
          style={styles.input}
          mode="outlined"
          activeOutlineColor="rgb(0, 41, 87)"
          outlineColor="rgb(0, 41, 87)"
          theme={{ colors: { background: "white" } }}
        />

        <Text style={styles.label}>Select Loan Type</Text>
        <Picker
          selectedValue={loanType}
          onValueChange={handleLoanTypeChange}
          style={styles.picker}
        >
          <Picker.Item label="Select" value="" />
          <Picker.Item label="Home Loan" value="home" />
          <Picker.Item label="Car Loan" value="car" />
          <Picker.Item label="Other Loan" value="other" />
        </Picker>

        {loanType === "other" && (
          <TextInput
            label="Please specify other loan type"
            value={otherLoanReason}
            onChangeText={setOtherLoanReason}
            style={styles.input}
            mode="outlined"
            activeOutlineColor="rgb(0, 41, 87)"
            outlineColor="rgb(0, 41, 87)"
            theme={{ colors: { background: "white" } }}
          />
        )}

        {/* Document Upload Section */}
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
                  <Text style={styles.documentName}>{doc.assets[0].name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.documentText}>No documents uploaded yet.</Text>
          )}
        </View>

        <Button
          title="Submit Request"
          onPress={handleSubmit}
          color="rgb(0, 41, 87)"
        />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="bank"
        label="Loan History"
        onPress={handleLoanHistoryPress}
        color="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  scrollView: {
    padding: 20,
    paddingBottom: 80, // To avoid the FAB from overlapping the content
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "rgb(0, 41, 87)",
    marginBottom: 30,
    textAlign: "center",
  },
  input: {
    marginBottom: 20,
    backgroundColor: "white",
  },
  label: {
    fontSize: 18,
    color: "rgb(0, 41, 87)",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    // marginBottom: 20,
  },
  halfWidth: {
    width: "48%",
  },
  picker: {
    height: 50,
    borderColor: "rgb(0, 41, 87)",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
  },
  documentUploadContainer: {
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgb(0, 41, 87)",
  },
  documentList: {
    marginTop: 10,
  },
  documentItem: {
    marginBottom: 10,
  },
  documentName: {
    fontSize: 14,
    color: "rgb(0, 41, 87)",
  },
  documentText: {
    fontSize: 18,
    color: "black",
    marginTop: 10,
    marginBottom: 10,
    fontStyle: "italic",
  },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgb(0, 41, 87)",
    borderRadius: 50,
  },
});

export default LoanRequestForm;
