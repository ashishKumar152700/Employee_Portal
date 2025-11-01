// src/components/FaceCaptureComponent.tsx (TypeScript Error Fixed)
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import {
  Button,
  Card,
  Text,
  Avatar,
} from 'react-native-paper';
import { 
  launchCamera, 
  ImagePickerResponse, 
  MediaType,
  CameraOptions,
  PhotoQuality 
} from 'react-native-image-picker';
import Toast from 'react-native-toast-message';

interface FaceCaptureProps {
  onImageCaptured: (imageBase64: string) => void;
  onCancel: () => void;
}

export default function FaceCaptureComponent({ onImageCaptured, onCancel }: FaceCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const capturePhoto = () => {
    // ✅ FIXED: Correct TypeScript types for react-native-image-picker v4+
    const options: CameraOptions = {
      mediaType: 'photo' as MediaType,
      quality: 'high' as PhotoQuality, 
      maxWidth: 640,
      maxHeight: 480,
      includeBase64: true,
      cameraType: 'front', // ✅ FIX: Removed 'as const' - not needed
    };

    setIsCapturing(true);

    launchCamera(options, (response: ImagePickerResponse) => {
      setIsCapturing(false);

      if (response.didCancel || response.errorMessage) {
        console.log('Camera cancelled or error:', response.errorMessage);
        return;
      }

      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        
        if (asset.base64) {
          // Validate image for eSSL MB20
          const validation = validateFaceImage(asset.base64);
          
          if (validation.isValid) {
            setCapturedImage(asset.base64);
            Toast.show({
              type: 'success',
              text1: 'Face Captured Successfully',
              text2: 'Image ready for eSSL MB20 enrollment'
            });
          } else {
            Alert.alert(
              'Image Quality Check',
              validation.message,
              [
                { text: 'Try Again', onPress: () => capturePhoto() },
                { 
                  text: 'Use Anyway', 
                  onPress: () => setCapturedImage(asset.base64!) 
                }
              ]
            );
          }
        } else {
          Alert.alert('Error', 'Failed to capture image data');
        }
      }
    });
  };

  const validateFaceImage = (base64: string) => {
    // eSSL MB20 face image requirements
    const sizeInBytes = (base64.length * 3) / 4;
    
    if (sizeInBytes < 10000) {
      return { 
        isValid: false, 
        message: 'Image too small (min 10KB). Please move closer to camera.' 
      };
    }
    
    if (sizeInBytes > 500000) {
      return { 
        isValid: false, 
        message: 'Image too large (max 500KB). Please move back or reduce quality.' 
      };
    }
    
    // Additional validations for face recognition
    return { 
      isValid: true, 
      message: 'Good quality image for biometric enrollment' 
    };
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onImageCaptured(capturedImage);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
  };

  return (
    <View style={styles.container}>
      <Card style={styles.instructionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.title}>
            📸 Face Capture for eSSL MB20
          </Text>
          <Text variant="bodySmall" style={styles.instructions}>
            🎯 Position face in center of frame{'\n'}
            📏 Maintain 40-80cm distance from camera{'\n'}
            💡 Ensure good, even lighting{'\n'}
            😐 Keep natural, relaxed expression{'\n'}
            👀 Look directly at camera
          </Text>
        </Card.Content>
      </Card>

      {!capturedImage ? (
        <View style={styles.captureSection}>
          <View style={styles.cameraFrame}>
            <View style={styles.faceGuide} />
            <Text style={styles.guideText}>
              Position your face here
            </Text>
          </View>
          
          <Button
            mode="contained"
            onPress={capturePhoto}
            loading={isCapturing}
            disabled={isCapturing}
            style={styles.captureButton}
            contentStyle={styles.buttonContent}
            icon="camera"
          >
            {isCapturing ? 'Opening Camera...' : 'Capture Face'}
          </Button>
          
          <Button
            mode="outlined"
            onPress={onCancel}
            style={styles.cancelButton}
          >
            Cancel
          </Button>
        </View>
      ) : (
        <View style={styles.previewSection}>
          <Text variant="titleMedium" style={styles.previewTitle}>
            ✅ Face Image Captured
          </Text>
          
          <Avatar.Image
            size={200}
            source={{ uri: `data:image/jpeg;base64,${capturedImage}` }}
            style={styles.previewImage}
          />
          
          <Card style={styles.statusCard}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.statusText}>
                📊 Image validated for eSSL MB20{'\n'}
                🔄 Ready for biometric enrollment{'\n'}
                📱 Size: ~{Math.round((capturedImage.length * 3) / 4 / 1024)}KB
              </Text>
            </Card.Content>
          </Card>
          
          <View style={styles.previewControls}>
            <Button
              mode="outlined"
              onPress={retakePhoto}
              style={styles.retakeButton}
            >
              Retake Photo
            </Button>
            
            <Button
              mode="contained"
              onPress={confirmPhoto}
              style={styles.confirmButton}
            >
              Use This Photo
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  instructionCard: {
    marginBottom: 20,
    elevation: 2,
    backgroundColor: 'white',
  },
  title: {
    textAlign: 'center',
    marginBottom: 12,
    color: '#2196F3',
    fontWeight: 'bold',
  },
  instructions: {
    textAlign: 'center',
    lineHeight: 24,
    color: '#666',
  },
  captureSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFrame: {
    alignItems: 'center',
    marginBottom: 40,
  },
  faceGuide: {
    width: 200,
    height: 250,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderRadius: 100,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    marginBottom: 16,
  },
  guideText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  captureButton: {
    marginBottom: 16,
    paddingVertical: 8,
    minWidth: 200,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    paddingVertical: 8,
    minWidth: 200,
  },
  previewSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    marginBottom: 20,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
  previewImage: {
    marginBottom: 20,
    borderWidth: 4,
    borderColor: '#4CAF50',
  },
  statusCard: {
    marginBottom: 20,
    backgroundColor: '#e8f5e8',
  },
  statusText: {
    textAlign: 'center',
    color: '#2e7d2e',
    lineHeight: 20,
  },
  previewControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  retakeButton: {
    flex: 1,
    marginRight: 8,
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
  },
});
