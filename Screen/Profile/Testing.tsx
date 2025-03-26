import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { changePassword } from "../../Services/User/User.service";



const ProfilePage = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const userDetailsSelector = useSelector((state: any) => state.userDetails);

  const handleSavePassword = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match!");
      return;
    }

    try {
      const responseMessage = await changePassword(
        currentPassword,
        newPassword,
        confirmPassword
      );
      Alert.alert("Success", responseMessage);
      setModalVisible(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <Icon name="account-circle" size={120} color="gray" />
          <Text style={styles.nameText}>{userDetailsSelector.user.name}</Text>
          <Text style={styles.employeeCodeText}>
            {userDetailsSelector.user.employeecode}
          </Text>
        </View>

        <View style={styles.infoSection}>
          <InfoRow label="Email" value={userDetailsSelector.user.email} />
          <InfoRow label="Phone Number" value={userDetailsSelector.user.phone} />
          <InfoRow label="Department" value={userDetailsSelector.user.department} />
          <InfoRow label="Reporting To" value={userDetailsSelector.user.manager?.name} />
        </View>

        <TouchableOpacity
          style={styles.changePasswordButton}
          onPress={() => setModalVisible(true)}
        >
          <Text onPress={()=>{
            console.log("Change Password Clicked",userDetailsSelector.user);
          }} style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current Password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm New Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSavePassword}
              >
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// Reusable Component for Info Rows
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0f4f8" },
  scrollContent: { padding: 20, paddingBottom: 80 },
  profileHeader: { alignItems: "center", marginBottom: 20 },
  nameText: { fontSize: 24, fontWeight: "bold", color: "black" },
  employeeCodeText: {
    fontSize: 16,
    color: "black",
    fontWeight: "500",
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  infoSection: { marginTop: 20, paddingHorizontal: 10 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#dee2e6",
  },
  infoLabel: { fontSize: 16, color: "#495057", fontWeight: "bold" },
  infoValue: { fontSize: 16, color: "#002957", textAlign: "right" },
  changePasswordButton: {
    marginTop: 20,
    alignItems: "center",
    padding: 15,
    backgroundColor: "#002957",
    borderRadius: 10,
  },
  changePasswordText: { fontSize: 16, color: "#fff", fontWeight: "bold" },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#002957",
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
  },
  modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
  button: {
    flex: 1,
    marginHorizontal: 5,
    padding: 10,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: { backgroundColor: "#ba181b" },
  saveButton: { backgroundColor: "#002957" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ProfilePage;
