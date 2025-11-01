// src/components/EditUserModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Card,
  TextInput,
  Button,
  Text,
  RadioButton,
  Switch,
  IconButton,
} from 'react-native-paper';
import { BiometricUser } from '../../Global/BiometricUser';
;

interface EditUserModalProps {
  visible: boolean;
  user: BiometricUser | null;
  onClose: () => void;
  onUpdate: (user: BiometricUser) => void;
}

export default function EditUserModal({ visible, user, onClose, onUpdate }: EditUserModalProps) {
  const [formData, setFormData] = useState<Partial<BiometricUser>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({ ...user });
      setErrors({});
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdate = () => {
    if (!validateForm() || !user) return;

    const updatedUser: BiometricUser = {
      ...user,
      ...formData,
    };

    onUpdate(updatedUser);
  };

  if (!user) return null;

  return (
    <Modal visible={visible} animationType="slide">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineSmall" style={styles.title}>
            Edit User
          </Text>
          <IconButton icon="close" onPress={onClose} />
        </View>

        <ScrollView style={styles.content}>
          <Card style={styles.formCard}>
            <Card.Content>
              <TextInput
                label="User ID"
                value={formData.userId?.toString()}
                disabled
                style={styles.input}
              />

              <TextInput
                label="Full Name *"
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                style={styles.input}
                error={!!errors.name}
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

              <Text variant="titleMedium" style={styles.sectionTitle}>
                User Role
              </Text>
              <View style={styles.radioGroup}>
                <View style={styles.radioOption}>
                  <RadioButton
                    value="Normal User"
                    status={formData.role === 'Normal User' ? 'checked' : 'unchecked'}
                    onPress={() => setFormData(prev => ({ ...prev, role: 'Normal User' }))}
                  />
                  <Text>Normal User</Text>
                </View>
                <View style={styles.radioOption}>
                  <RadioButton
                    value="Super Admin"
                    status={formData.role === 'Super Admin' ? 'checked' : 'unchecked'}
                    onPress={() => setFormData(prev => ({ ...prev, role: 'Super Admin' }))}
                  />
                  <Text>Super Admin</Text>
                </View>
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Enrolled Biometrics (Read-only)
              </Text>
              <View style={styles.biometricStatus}>
                <Text>Fingerprint: {formData.hasFingerprint ? '✓ Enrolled' : '✗ Not Enrolled'}</Text>
                <Text>Face: {formData.hasFace ? '✓ Enrolled' : '✗ Not Enrolled'}</Text>
                <Text>Password: {formData.hasPassword ? '✓ Set' : '✗ Not Set'}</Text>
                <Text>Badge: {formData.badgeNumber ? `✓ ${formData.badgeNumber}` : '✗ Not Set'}</Text>
              </View>

              <View style={styles.buttons}>
                <Button
                  mode="outlined"
                  onPress={onClose}
                  style={[styles.button, styles.cancelButton]}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleUpdate}
                  style={styles.button}
                >
                  Update User
                </Button>
              </View>
            </Card.Content>
          </Card>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 16,
    backgroundColor: '#2196F3',
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  formCard: {
    margin: 16,
    elevation: 2,
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 12,
    color: '#333',
    fontWeight: '600',
  },
  radioGroup: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  biometricStatus: {
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    borderColor: '#666',
  },
});
