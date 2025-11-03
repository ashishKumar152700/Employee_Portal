import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Dimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../Global/Types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { loginservice } from '../../Services/Login/Login.service';
import { useDispatch } from 'react-redux';
import { scale } from "react-native-size-matters";

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [employeecode, setEmployeecode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  // Simple logo scale animation
  const logoScaleAnim = new Animated.Value(1);
  const buttonScaleAnim = new Animated.Value(1);

  useEffect(() => {
    startLogoScale();
  }, []);

  const startLogoScale = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoScaleAnim, {
          toValue: 1.1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoScaleAnim, {
          toValue: 0.9,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const animateButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleLogin = async () => {
    if (!employeecode || !password) {
      Alert.alert('Error', 'Employee code and password are required');
      return;
    }

    animateButtonPress();
    setLoading(true);

    try {
      const response = await loginservice.LoginApi({ employeecode: +employeecode, password }, dispatch);
      if (response.status === 200) {
        await AsyncStorage.setItem('token', response.data.accessToken);
        
        const userData = await AsyncStorage.getItem('user');
        if (userData) {
          // Navigation will be handled automatically by the conditional rendering in App.tsx
          // The Redux state change will trigger the navigation stack switch
        } else {
          throw new Error('User data not found after login');
        }
      }
    } catch (error) {
      let errorMessage = 'Login failed';
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      <LinearGradient 
        colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)', '#FFFFFF']} 
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <KeyboardAvoidingView 
          style={styles.keyboardContainer} 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: logoScaleAnim }]
                  }
                ]}
              >
                <Image
                  source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU' }}
                  style={styles.logo}
                />
              </Animated.View>
              <View style={styles.headerTextContainer}>
                <Text style={styles.companyName}>RKT-ESS</Text>
                <Text style={styles.tagline}>Employee Self Service Portal</Text>
              </View>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              <LinearGradient
                colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.welcomeText}>Welcome Back!</Text>
                  <Text style={styles.subtitleText}>Please sign in to continue</Text>
                </View>

                <View style={styles.formContainer}>
                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Employee Code"
                      placeholder="Enter your employee code"
                      value={employeecode}
                      onChangeText={setEmployeecode}
                      style={styles.input}
                      mode="outlined"
                      activeOutlineColor="rgb(0, 41, 87)"
                      outlineColor="#E0E0E0"
                      theme={{ 
                        colors: { 
                          background: '#FFFFFF',
                          onSurfaceVariant: '#999',
                          outline: '#E0E0E0',
                          primary: 'rgb(0, 41, 87)',
                          placeholder: '#999',
                          onSurface: '#000',
                          surface: '#FFFFFF',
                        } 
                      }}
                      left={<TextInput.Icon icon="badge-account" color="rgb(0, 41, 87)" />}
                      keyboardType="numeric"
                      contentStyle={styles.inputContent}
                      outlineStyle={styles.inputOutline}
                    />
                  </View>

                  <View style={styles.inputContainer}>
                    <TextInput
                      label="Password"
                      placeholder="Enter your password"
                      value={password}
                      onChangeText={setPassword}
                      secureTextEntry={secureTextEntry}
                      style={styles.input}
                      mode="outlined"
                      activeOutlineColor="rgb(0, 41, 87)"
                      outlineColor="#E0E0E0"
                      theme={{ 
                        colors: { 
                          background: '#FFFFFF',
                          onSurfaceVariant: '#999',
                          outline: '#E0E0E0',
                          primary: 'rgb(0, 41, 87)',
                          placeholder: '#999',
                          onSurface: '#000',
                          surface: '#FFFFFF',
                        } 
                      }}
                      left={<TextInput.Icon icon="lock-outline" color="rgb(0, 41, 87)" />}
                      right={
                        <TextInput.Icon
                          icon={secureTextEntry ? "eye-off-outline" : "eye-outline"}
                          color="rgb(0, 41, 87)"
                          onPress={togglePasswordVisibility}
                        />
                      }
                      contentStyle={styles.inputContent}
                      outlineStyle={styles.inputOutline}
                    />
                  </View>

                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="large" color="rgb(0, 41, 87)" />
                      <Text style={styles.loadingText}>Signing you in...</Text>
                    </View>
                  ) : (
                    <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                      <TouchableOpacity 
                        style={styles.loginButton} 
                        onPress={handleLogin}
                        activeOpacity={0.8}
                      >
                        <LinearGradient
                          colors={['rgb(0, 41, 87)', 'rgba(0, 41, 87, 0.8)']}
                          style={styles.buttonGradient}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                        >
                          <MaterialIcons name="login" size={20} color="white" style={styles.buttonIcon} />
                          <Text style={styles.buttonText}>Sign In</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    </Animated.View>
                  )}
                </View>
              </LinearGradient>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Secure & Protected by{' '}
                <Text style={styles.footerHighlight}>HRMS Security</Text>
              </Text>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 40,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 16,
    
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerTextContainer: {
    alignItems: 'center',
  },
  companyName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  loginCard: {
    borderRadius: 24,

    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  cardGradient: {
    borderRadius: 24,
    padding: 30,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'rgb(0, 41, 87)',
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    // backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  inputContent: {
    // backgroundColor: '#FFFFFF',
    color: '#000',
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 12,
    color: 'rgb(0, 41, 87)',
    fontSize: 16,
    fontWeight: '500',
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 40,
    shadowColor: 'rgb(0, 41, 87)',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
  footerHighlight: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default LoginScreen;
