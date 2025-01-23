import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, Dimensions } from 'react-native';
import React, { useEffect, useState } from 'react';
import { changePassword, getUser } from '../../Services/User/User.service';
import { useSelector } from 'react-redux';

const { width, height } = Dimensions.get('window');

// Function to scale sizes based on device width
const scaleSize = (size) => (width / 375) * size;

const Profile = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [currentField, setCurrentField] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmpassword, setconfirmpassword] = useState('');
  const [user, setUser] = useState(null);

  const userDetailsSelector = useSelector((state:any) => state.userDetails);

  console.log("userDetailsSelector :- ", userDetailsSelector);

  useEffect(() => {
    getUserDetails();
  }, []);

  async function getUserDetails() {
    try {
      console.log('[ProfileUI] Fetching user details...');
      const userDetails = await getUser();

      if (userDetails) {
        console.log('[ProfileUI] User details fetched successfully:', userDetails);
        setUser(userDetails);
      } else {
        console.warn('[ProfileUI] No user details found.');
      }
    } catch (error) {
      console.error('[ProfileUI] Error retrieving user details:', error);
    }
  }

  const profileData = user
    ? {
        name: user.name || "",
        employeeCode: user.employeecode || "",
        email: user.email || "",
        phone: user.phone || "N/A",
        department: user.department || "Engineering", 
        reporting: user.manager?.name || "N/A",
      }
    : {};

  const handleSubmit = () => {
    console.log(`${currentField}: ${currentValue}`);
    setModalVisible(false);
  };

  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmpassword) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      const message = await changePassword(oldPassword, newPassword, confirmpassword);
      alert(message);
      setPasswordModalVisible(false);
      setOldPassword('');
      setNewPassword('');
      setconfirmpassword('');
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {Object.entries(profileData).map(([key, value]) => (
          <View style={styles.profileInfo} key={key}>
            <Text style={styles.info}>{key} :: {value}</Text>
          </View>
        ))}

        <TouchableOpacity onPress={() => setPasswordModalVisible(true)} style={styles.changePasswordButton}>
          <Text style={styles.changePasswordText}>Change Password</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={passwordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalView}>
            <Text style={styles.modalHeader}>Change Password</Text>

            <TextInput
              placeholder="Enter old password"
              secureTextEntry
              style={styles.input}
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              placeholder="Enter new password"
              secureTextEntry
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              placeholder="Confirm new password"
              secureTextEntry
              style={styles.input}
              value={confirmpassword}
              onChangeText={setconfirmpassword}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={handleChangePassword} style={styles.submitButton}>
                <Text style={styles.submitButtonText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPasswordModalVisible(false)} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9faff',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: scaleSize(20),
  },
  profileInfo: {
    flexDirection: 'column',
    padding: scaleSize(15),
    marginVertical: scaleSize(8),
    borderRadius: scaleSize(10),
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: scaleSize(14),
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },
  info: {
    fontSize: scaleSize(14),
    color: '#333',
    fontWeight: '500',
  },
  changePasswordButton: {
    marginTop: scaleSize(20),
    backgroundColor: '#002957',
    paddingVertical: scaleSize(12),
    borderRadius: scaleSize(8),
    alignItems: 'center',
  },
  changePasswordText: {
    color: '#fff',
    fontSize: scaleSize(16),
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalView: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: scaleSize(10),
    padding: scaleSize(20),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  modalHeader: {
    fontSize: scaleSize(18),
    fontWeight: 'bold',
    marginBottom: scaleSize(10),
    textAlign: 'center',
    color: '#002957',
  },
  input: {
    height: scaleSize(40),
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: scaleSize(6),
    paddingHorizontal: scaleSize(10),
    marginBottom: scaleSize(12),
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#002957',
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(15),
    borderRadius: scaleSize(6),
    flex: 1,
    marginRight: scaleSize(5),
  },
  submitButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: scaleSize(10),
    paddingHorizontal: scaleSize(15),
    borderRadius: scaleSize(6),
    flex: 1,
    marginLeft: scaleSize(5),
  },
  cancelButtonText: {
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default Profile;
