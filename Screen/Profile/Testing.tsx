// WE ARE USING THIS FILE AS PROFILE.TSX NOW

import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Animated,
  Easing,
} from "react-native";
import React, { useEffect, useState } from "react";
import { changePassword, getUser } from "../../Services/User/User.service";
import Icon from "react-native-vector-icons/MaterialIcons";

import { useSelector, shallowEqual } from "react-redux";
import moment from "moment";
const { width } = Dimensions.get("window");

// Function to scale sizes based on device width
const scaleSize = (size) => (width / 375) * size;

const ProfilePage = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState("");
  const [currentValue, setCurrentValue] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");
  const user = useSelector(
    (state: any) => state.userDetails.user,
    shallowEqual
  );
  const [fadeAnim] = useState(new Animated.Value(0));

  console.log("user from Redux → ", user);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  const profileData = user
    ? {
        "Personal Information": [
          { label: "Name", value: user.name ?? "N/A", icon: "person" },
          {
            label: "Employee Code",
            value: user.employeecode ?? "N/A",
            icon: "badge",
          },
          { label: "Email", value: user.email ?? "N/A", icon: "email" },
          { label: "Phone", value: user.phone ?? "N/A", icon: "phone" },
          {
            label: "Age",
            value: user.age ? `${user.age} yrs` : "N/A",
            icon: "cake",
          },
          { label: "Role", value: user.role ?? "N/A", icon: "work" },
          {
            label: "Joining Date",
            value: user.joiningdate
              ? moment(user.joiningdate).format("DD MMM YYYY")
              : "N/A",
            icon: "event",
          },
        ],
        "Reporting Information": [
          {
            label: "Reporting To",
            value: user.manager?.name ?? "N/A",
            icon: "supervisor-account",
          },
          {
            label: "Manager Email",
            value: user.manager?.email ?? "N/A",
            icon: "email",
          },
          {
            label: "Manager Phone",
            value: user.manager?.phone ?? "N/A",
            icon: "phone",
          },
        ],
      }
    : {};

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmpassword) {
      alert("Please fill in all fields.");
      return;
    }

    if (newPassword !== confirmpassword) {
      alert("New password and confirmation don't match.");
      return;
    }

    try {
      const message = await changePassword(
        oldPassword,
        newPassword,
        confirmpassword
      );
      alert(message);
      setPasswordModalVisible(false);
      setOldPassword("");
      setNewPassword("");
      setconfirmpassword("");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Icon name="person" size={32} color="#002957" />
          </View>
          <Text style={styles.userName}>{user?.name || "User Name"}</Text>
          <Text style={styles.userRole}>
            {user?.role || "Role"} • {user?.department || "Department"}
          </Text>
          <Text style={styles.userCode}>
            EMP: {user?.employeecode || "N/A"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setPasswordModalVisible(true)}
          style={styles.changePasswordButton}
        >
          <Icon name="lock" size={20} color="#fff" />
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>

        {Object.entries(profileData).map(([sectionTitle, sectionData]) => (
          <View style={styles.section} key={sectionTitle}>
            <Text style={styles.sectionTitle}>{sectionTitle}</Text>
            {sectionData.map((item, index) => (
              <View
                style={[
                  styles.infoItem,
                  index === sectionData.length - 1 && styles.lastInfoItem,
                ]}
                key={item.label}
              >
                <View style={styles.infoLabelContainer}>
                  <Icon
                    name={item.icon}
                    size={18}
                    color="#002957"
                    style={styles.infoIcon}
                  />
                  <Text style={styles.infoLabel}>{item.label}</Text>
                </View>
                <Text
                  style={styles.infoValue}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#002957" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Icon
                name="lock-outline"
                size={20}
                color="#6c757d"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Current Password"
                secureTextEntry
                style={styles.input}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon
                name="lock"
                size={20}
                color="#6c757d"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="New Password"
                secureTextEntry
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon
                name="lock"
                size={20}
                color="#6c757d"
                style={styles.inputIcon}
              />
              <TextInput
                placeholder="Confirm New Password"
                secureTextEntry
                style={styles.input}
                value={confirmpassword}
                onChangeText={setconfirmpassword}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setPasswordModalVisible(false)}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleChangePassword}
                style={styles.submitButton}
              >
                <Text style={styles.submitButtonText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollContainer: {
    flexGrow: 1,
    padding: scaleSize(16),
  },
  header: {
    alignItems: "center",
    marginBottom: scaleSize(10),
    padding: scaleSize(20),
    backgroundColor: "#fff",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    width: scaleSize(290),
    height: scaleSize(80),
    borderRadius: scaleSize(40),
    backgroundColor: "#e9f0f7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: scaleSize(2),
  },
  userName: {
    fontSize: scaleSize(20),
    fontWeight: "bold",
    color: "#002957",
    marginBottom: scaleSize(4),
    textAlign: "center",
  },
  userRole: {
    fontSize: scaleSize(14),
    color: "#6c757d",
    marginBottom: scaleSize(4),
  },
  userCode: {
    fontSize: scaleSize(12),
    color: "#002957",
    fontWeight: "500",
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: scaleSize(20),
    marginBottom: scaleSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: scaleSize(18),
    fontWeight: "600",
    color: "#002957",
    marginBottom: scaleSize(4),
    paddingBottom: scaleSize(8),
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: scaleSize(8),
    borderBottomWidth: 1,
    borderBottomColor: "#f1f3f5",
  },
  lastInfoItem: {
    borderBottomWidth: 0,
  },
  infoLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoIcon: {
    marginRight: scaleSize(10),
  },
  infoLabel: {
    fontSize: scaleSize(14),
    fontWeight: "500",
    color: "#495057",
  },
  infoValue: {
    fontSize: scaleSize(14),
    color: "#002957",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    marginLeft: scaleSize(10),
  },
  changePasswordButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#002957",
    paddingVertical: scaleSize(16),
    borderRadius: 12,
    marginBottom: scaleSize(8),
  },
  changePasswordText: {
    color: "#fff",
    fontSize: scaleSize(16),
    fontWeight: "600",
    marginLeft: scaleSize(8),
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalView: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: scaleSize(20),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: scaleSize(20),
  },
  modalTitle: {
    fontSize: scaleSize(20),
    fontWeight: "bold",
    color: "#002957",
  },
  closeButton: {
    padding: scaleSize(4),
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 8,
    marginBottom: scaleSize(16),
    paddingHorizontal: scaleSize(12),
  },
  inputIcon: {
    marginRight: scaleSize(10),
  },
  input: {
    flex: 1,
    height: scaleSize(48),
    fontSize: scaleSize(16),
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scaleSize(16),
  },
  cancelButton: {
    flex: 1,
    paddingVertical: scaleSize(12),
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    marginRight: scaleSize(8),
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dee2e6",
  },
  cancelButtonText: {
    color: "#6c757d",
    fontWeight: "600",
  },
  submitButton: {
    flex: 1,
    paddingVertical: scaleSize(12),
    borderRadius: 8,
    backgroundColor: "#002957",
    marginLeft: scaleSize(8),
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});

export default ProfilePage;
