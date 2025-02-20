import React, { useState } from "react";
import { View, Text, Button, StyleSheet, ScrollView } from "react-native";
import { FAB, TextInput } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../Global/Types";

const ResignationForm: React.FC = () => {
  const [lastWorkingDay, setLastWorkingDay] = useState("");
  const [noticePeriodServed, setNoticePeriodServed] = useState("");
  const [handoverStatus, setHandoverStatus] = useState("");
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const navigation = useNavigation();

  const userDetails = useSelector((state: any) => state.userDetails);
  const managerDetails = useSelector((state: any) => state.managerInfo);

  type resignHistory = StackNavigationProp<RootStackParamList, 'resignHistory'>;

  
  const HistoryPress = () => {
    navigation.navigate('resignHistory');
  };


  const handleSubmit = () => {
    console.log("Last Working Day:", lastWorkingDay);
    console.log("Notice Period Served:", noticePeriodServed);
    console.log("Handover Status:", handoverStatus);
    console.log("Reason:", reason);
    console.log("Additional Comments:", comments);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Text style={styles.title}>Resignation Form</Text>

        <View style={styles.row}>
        <TextInput label="Name" value={userDetails.user.name} disabled  style={[styles.input, styles.halfInput]} mode="outlined" />
        <TextInput label="Employee Code" value={String(userDetails.user.employeecode)} disabled  style={[styles.input, styles.halfInput]} mode="outlined" />
        </View>
        <TextInput
          label="Approver Name"
          value={managerDetails.name}
          disabled
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Last Working Day"
          value={lastWorkingDay}
          onChangeText={setLastWorkingDay}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Notice Period Served"
          value={noticePeriodServed}
          onChangeText={setNoticePeriodServed}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Handover Status"
          value={handoverStatus}
          onChangeText={setHandoverStatus}
          style={styles.input}
          mode="outlined"
        />
        <TextInput
          label="Reason for Resignation"
          value={reason}
          onChangeText={setReason}
          style={styles.input}
          mode="outlined"
          multiline
        />
        <TextInput
          label="Additional Comments"
          value={comments}
          onChangeText={setComments}
          style={styles.input}
          mode="outlined"
          multiline
        />

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

export default ResignationForm;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "white" },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgb(0, 41, 87)',
    borderRadius: 50,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInput: {
    flex: 1,
    marginRight: 10,
  },
  scrollView: { padding: 20, paddingBottom: 100 },
  title: {
    fontSize: 28,
    fontWeight: "600",
    color: "rgb(0, 41, 87)",
    marginBottom: 30,
    textAlign: "center",
  },
  input: { marginBottom: 20, backgroundColor: "white" },
});
