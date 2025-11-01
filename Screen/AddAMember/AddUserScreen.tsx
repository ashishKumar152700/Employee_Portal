// src/screens/AddUserScreen.tsx (Camera/Fingerprint issues fixed)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  Text,
  RadioButton,
  Switch,
  Avatar,
  ActivityIndicator,
} from 'react-native-paper';
import Toast from 'react-native-toast-message';
import { BiometricUserService } from '../../Services/BiometricService/BiometricUserService';
import { CreateUserRequest } from '../../Global/BiometricUser';
import FaceCaptureComponent from '../../Component/AddMemberScreen/FaceCaptureComponent';


interface FormData {
  userId: string;
  name: string;
  role: 'Normal User' | 'Super Admin';
  password: string;
  confirmPassword: string;
  badgeNumber: string;
  enableFingerprint: boolean;
  enableFace: boolean;
  enablePassword: boolean;
  enableBadge: boolean;
  faceImage: string | null;
}

export default function AddUserScreen() {
  const [formData, setFormData] = useState<FormData>({
    userId: '',
    name: '',
    role: 'Normal User',
    password: '',
    confirmPassword: '',
    badgeNumber: '',
    enableFingerprint: false,
    enableFace: false,
    enablePassword: false,
    enableBadge: false,
    faceImage: null,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showFaceCapture, setShowFaceCapture] = useState(false);

  const handleFaceCapture = (imageBase64: string) => {
    setFormData(prev => ({ 
      ...prev, 
      faceImage: imageBase64,
      enableFace: true
    }));
    setShowFaceCapture(false);
    setErrors(prev => ({ ...prev, faceImage: '' }));
    
    Toast.show({
      type: 'success',
      text1: 'Face Captured',
      text2: 'Ready for enrollment'
    });
  };


  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields
    if (!formData.userId.trim()) {
      newErrors.userId = 'User ID is required';
    }
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

     

    // Password validation
    if (formData.enablePassword) {
      if (!formData.password) {
        newErrors.password = 'Password is required when enabled';
      } else if (formData.password.length < 1 || formData.password.length > 8) {
        newErrors.password = 'Password must be 1-8 digits';
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    // Badge validation
    if (formData.enableBadge && !formData.badgeNumber.trim()) {
      newErrors.badgeNumber = 'Badge number is required when badge is enabled';
    }

    // At least one verification method
    const hasVerificationMethod = formData.enableFingerprint || 
                                  formData.enableFace || 
                                  formData.enablePassword || 
                                  formData.enableBadge;
    
    if (!hasVerificationMethod) {
      newErrors.verification = 'At least one verification method must be enabled';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Validation Error',
        text2: 'Please fix the errors and try again',
      });
      return;
    }

    try {
      setLoading(true);
      
      const userData: CreateUserRequest = {
        userId: parseInt(formData.userId),
        name: formData.name,
        role: formData.role,
        verificationMethods: {
          fingerprint: formData.enableFingerprint,
          face: formData.enableFace,
          password: formData.enablePassword,
          badge: formData.enableBadge,
        },
        password: formData.enablePassword ? formData.password : undefined,
        badgeNumber: formData.enableBadge ? formData.badgeNumber : undefined,
        faceImage: formData.enableFace ? formData.faceImage : undefined,
      };

      const response = await BiometricUserService.createUser(userData);
      
      if (response.success) {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: response.message || 'User created successfully',
        });
        
        // Reset form
        setFormData({
          userId: '',
          name: '',
          role: 'Normal User',
          password: '',
          confirmPassword: '',
          badgeNumber: '',
          enableFingerprint: false,
          enableFace: false,
          enablePassword: false,
          enableBadge: false,
          faceImage: null,
        });
        setErrors({});

        // Show additional instructions if needed
        if (response.nextStep === 'BIOMETRIC_ENROLLMENT') {
          Alert.alert(
            'Next Step',
            'User created successfully! Please complete biometric enrollment on the device.',
            [{ text: 'OK' }]
          );
        }
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: response.error || 'Failed to create user',
        });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to create user',
      });
    } finally {
      setLoading(false);
    }
  };

  // TEMPORARY: Mock image selection (camera issues fixed)
  const selectImage = () => {
    // Mock base64 image data for testing
    const mockBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=';
    
    setFormData(prev => ({ ...prev, faceImage: mockBase64 }));
    setErrors(prev => ({ ...prev, faceImage: '' }));
    
    Toast.show({
      type: 'info',
      text1: 'Mock Image Selected',
      text2: 'Camera functionality will be implemented later',
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.formCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.title}>
            Register New User
          </Text>

          {/* Basic Information */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Basic Information
          </Text>

          <TextInput
            label="Employee Code *"
            value={formData.userId}
            onChangeText={(text) => setFormData(prev => ({ ...prev, userId: text }))}
            keyboardType="numeric"
            style={styles.input}
            error={!!errors.userId}
          />
          {errors.userId && <Text style={styles.errorText}>{errors.userId}</Text>}

          <TextInput
            label="Full Name *"
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            style={styles.input}
            error={!!errors.name}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          {/* User Role */}
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

          {/* Verification Methods */}
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Verification Methods
          </Text>
          {errors.verification && <Text style={styles.errorText}>{errors.verification}</Text>}

          {/* Fingerprint - DISABLED FOR NOW */}
          <View style={styles.switchRow}>
            <Text style={styles.disabledText}>Enable Fingerprint (Coming Soon)</Text>
            <Switch
              value={false}
              disabled={true}
              onValueChange={() => {}}
            />
          </View>
          <Text style={styles.helperText}>
            Note: Fingerprint enrollment will be available in future updates
          </Text>

          {/* Face Recognition - MOCK IMPLEMENTATION */}
          <View style={styles.switchRow}>
            <Text>Enable Face Recognition (Mock)</Text>
            <Switch
              value={formData.enableFace}
              onValueChange={(value) => setFormData(prev => ({ ...prev, enableFace: value }))}
            />
          </View>

          {formData.enableFace && !showFaceCapture && (
    <View style={styles.faceSection}>
      <Button
        mode="contained"
        onPress={() => setShowFaceCapture(true)}
        style={styles.imageButton}
        icon="camera"
      >
        {formData.faceImage ? 'Change Face Photo' : 'Capture Face Photo'}
      </Button>
      {formData.faceImage && (
        <Avatar.Image
          size={120}
          source={{ uri: `data:image/jpeg;base64,${formData.faceImage}` }}
          style={styles.previewImage}
        />
      )}
    </View>
  )}

  {showFaceCapture && (
    <FaceCaptureComponent
      onImageCaptured={handleFaceCapture}
      onCancel={() => setShowFaceCapture(false)}
    />
  )}


          {/* Password */}
          <View style={styles.switchRow}>
            <Text>Enable Password</Text>
            <Switch
              value={formData.enablePassword}
              onValueChange={(value) => setFormData(prev => ({ ...prev, enablePassword: value }))}
            />
          </View>
          {formData.enablePassword && (
            <View>
              <TextInput
                label="Password (1-8 digits)"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry
                keyboardType="numeric"
                maxLength={8}
                style={styles.input}
                error={!!errors.password}
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
              
              <TextInput
                label="Confirm Password"
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                secureTextEntry
                keyboardType="numeric"
                maxLength={8}
                style={styles.input}
                error={!!errors.confirmPassword}
              />
              {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
            </View>
          )}

          {/* Badge */}
          <View style={styles.switchRow}>
            <Text>Enable Badge/Card</Text>
            <Switch
              value={formData.enableBadge}
              onValueChange={(value) => setFormData(prev => ({ ...prev, enableBadge: value }))}
            />
          </View>
          {formData.enableBadge && (
            <View>
              <TextInput
                label="Badge Number"
                value={formData.badgeNumber}
                onChangeText={(text) => setFormData(prev => ({ ...prev, badgeNumber: text }))}
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.badgeNumber}
              />
              {errors.badgeNumber && <Text style={styles.errorText}>{errors.badgeNumber}</Text>}
              <Text style={styles.helperText}>
                Note: Badge enrollment requires swiping the physical card on the device
              </Text>
            </View>
          )}

          {/* Submit Button */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
          >
            {loading ? 'Creating User...' : 'Create User'}
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  formCard: {
    margin: 16,
    elevation: 2,
  },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 12,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    marginBottom: 8,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#f44336',
    fontSize: 12,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  disabledText: {
    color: '#999',
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
  },
  faceSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageButton: {
    marginBottom: 12,
  },
  previewImage: {
    marginBottom: 8,
    backgroundColor: '#4CAF50',
  },
  submitButton: {
    marginTop: 24,
    paddingVertical: 8,
  },
});

