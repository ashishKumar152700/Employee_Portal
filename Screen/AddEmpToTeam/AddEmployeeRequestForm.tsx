import React, { useState } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { FAB, TextInput, RadioButton } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../Global/Types";

const AddEmployeeRequestForm: React.FC = () => {
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [numEmployees, setNumEmployees] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-Time");
  const [justification, setJustification] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const navigation =
    useNavigation<
      StackNavigationProp<RootStackParamList, "addMemberHistory">
    >();

  const handleSubmit = () => {
    console.log("Designation:", designation);
    console.log("Department:", department);
    console.log("Number of Employees:", numEmployees);
    console.log("Joining Date:", joiningDate);
    console.log("Employment Type:", employmentType);
    console.log("Justification:", justification);
    console.log("Additional Notes:", additionalNotes);
  };

  const HistoryPress = () => {
    navigation.navigate("addMemberHistory");
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Add Employee Request</Text>

        <TextInput
          label="Designation"
          value={designation}
          onChangeText={setDesignation}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Department"
          value={department}
          onChangeText={setDepartment}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Number of Employees"
          value={numEmployees}
          onChangeText={setNumEmployees}
          keyboardType="numeric"
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Joining Date (YYYY-MM-DD)"
          value={joiningDate}
          onChangeText={setJoiningDate}
          style={styles.input}
          mode="outlined"
        />

        <Text style={styles.radioTitle}>Employment Type</Text>
        <View style={styles.radioGroup}>
          <RadioButton.Group
            onValueChange={setEmploymentType}
            value={employmentType}
          >
            <View style={styles.radioRow}>
              <RadioButton value="Full-Time" />
              <Text style={styles.radioLabel}>Full-Time</Text>
              <RadioButton value="Part-Time" />
              <Text style={styles.radioLabel}>Part-Time</Text>
            </View>
          </RadioButton.Group>
        </View>

        <TextInput
          label="Justification"
          value={justification}
          onChangeText={setJustification}
          style={styles.input}
          mode="outlined"
          multiline
        />
        <TextInput
          label="Additional Notes"
          value={additionalNotes}
          onChangeText={setAdditionalNotes}
          style={styles.input}
          mode="outlined"
          multiline
        />

        <Button
          title="Submit Request"
          onPress={handleSubmit}
          color="rgb(0, 41, 87)"
        />
      </ScrollView>

      <FAB
        style={styles.fab}
        icon="history"
        label="Requests"
        color="white"
        onPress={HistoryPress}
      />
    </View>
  );
};

export default AddEmployeeRequestForm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  scrollView: { padding: 20, paddingBottom: 100 },
  title: {
    fontSize: 24,
    fontWeight: "600",
    color: "rgb(0, 41, 87)",
    marginBottom: 20,
    textAlign: "center",
  },
  input: { marginBottom: 15, backgroundColor: "white" },
  radioTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "rgb(0, 41, 87)",
    marginBottom: 10,
  },
  radioGroup: { marginBottom: 20 },
  radioRow: { flexDirection: "row", alignItems: "center" },
  radioLabel: { fontSize: 16, marginLeft: 5, marginRight: 20 },
  fab: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "rgb(0, 41, 87)",
    borderRadius: 50,
  },
});
