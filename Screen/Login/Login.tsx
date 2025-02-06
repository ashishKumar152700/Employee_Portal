import React, { useState } from 'react';
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
} from 'react-native';
import { TextInput } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import { RFPercentage } from 'react-native-responsive-fontsize';
import { RootStackParamList } from '../../Global/Types';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { loginservice } from '../../Services/Login/Login.service';
import { useDispatch } from 'react-redux';

const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'LoginScreen'>;

const LoginScreen = () => {
  const [employeecode, setemployeecode] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation<LoginScreenNavigationProp>();
  let dispatch = useDispatch()


  const handleLogin = async () => {
    if (!employeecode || !password) {
      Alert.alert('Error', 'Employee code and password are required');
      return;
    }
  
    setLoading(true);
  
    let postData = {
      employeecode: +employeecode,
      password,
    };
  
    try {
      const response = await loginservice.LoginApi(postData , dispatch);
  
      console.log(JSON.stringify(response));
  
      if (response.status === 200) {
        AsyncStorage.setItem('token', response.data.accessToken);
        AsyncStorage.setItem('punchInfo', JSON.stringify(response.data.user.punchInfo)); // Corrected here
        console.log("punchIn INfo : " , JSON.stringify(response.data.user.punchInfo) )
        navigation.navigate('Main');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  // const handleLogin = async () => {
   
  
  //       navigation.navigate('Main');
  
  // };
  

  const handleFingerprintLogin = async () => {
    const employeecode = '10156'; 
    const password = 'Kirti@123';
  
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  
      if (!hasHardware || !isEnrolled) {
        Alert.alert('Biometrics Not Available', 'Your device does not support biometric authentication.');
        return;
      }
  
      const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const isFaceID = authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
  
      const result = await LocalAuthentication.authenticateAsync({ 
        promptMessage: isFaceID ? 'Authenticate with Face ID' : 'Authenticate with fingerprint',
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
      });
  
      if (result.success) {
        Alert.alert('Authentication Successful', 'You have successfully logged in with biometrics');
  
        // Call your login function or API with the test credentials
        const postData = { employeecode: +employeecode, password };
        const response = await loginservice.LoginApi(postData, dispatch);
  
        if (response.status === 200) {
          AsyncStorage.setItem('token', response.data.accessToken);
          AsyncStorage.setItem('punchInfo', JSON.stringify(response.data.user.punchInfo));
          console.log('Punch Info:', response.data.user.punchInfo);
          navigation.navigate('Main');
        } else {
          Alert.alert('Login Failed', response.message || 'Unknown error occurred');
        }
      } else {
        Alert.alert('Authentication Failed', 'Biometric authentication was not successful');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An error occurred during biometric authentication');
    }
  };
  
  
  return (
    <LinearGradient colors={['rgb(0, 41,87)', 'white']} style={styles.container}>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Image
              source={{ uri: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU' }}
              style={styles.logo}
            />
            <View style={styles.titleContainer}>
              <Text style={styles.welcomeText}>Welcome To</Text>
              <Text style={styles.portalText}>Employee Self Service Portal</Text>
            </View>

            <TextInput
              label="Employee Code"
              value={employeecode}
              onChangeText={setemployeecode}
              style={styles.input}
              mode="outlined"
              autoComplete='off'
              activeOutlineColor="rgb(0, 41, 87)"
              outlineColor="rgb(0, 41, 87)"
              theme={{ colors: { background: 'white' } }}
            />

            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              mode="outlined"
              autoComplete='off'
              activeOutlineColor="rgb(0, 41, 87)"
              outlineColor="rgb(0, 41, 87)"
              theme={{ colors: { background: 'white' } }}
            />

            {loading ? (
              <ActivityIndicator size="large" color="rgb(0, 41, 87)" style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.orText}>or login with</Text>
            <TouchableOpacity onPress={handleFingerprintLogin} style={styles.fingerprintContainer}>
              <MaterialIcons name="fingerprint" size={64} color="rgb(0, 41, 87)" />
            </TouchableOpacity>

            <View style={styles.footerContainer}>
              <TouchableOpacity onPress={() => Alert.alert('Forgot Password')}>
                <Text style={styles.footerLink}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fingerprintContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    paddingVertical: Platform.OS === 'ios' ? 60 : 20,
  },
  card: {
    width: '100%',
    height:'90%',
    // paddingVertical: height * 0.25,
    paddingHorizontal: width * 0.05,
    borderRadius: 40,
    elevation: 5,
    backgroundColor: 'white',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 300,
  },
  logo: {
    width: width * 0.4,
    height: width * 0.4,
    marginBottom: 10,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: RFPercentage(3),
    fontWeight: 'bold',
    color: 'rgb(0, 41, 87)',
  },
  portalText: {
    fontSize: RFPercentage(2.5),
    color: '#555',
    textAlign: 'center',
    marginTop: 5,
  },
  input: {
    width: '100%',
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'rgb(0, 41, 87)',
    width: '100%',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: RFPercentage(2.2),
    fontWeight: '600',
  },
  orText: {
    fontSize: RFPercentage(2),
    color: 'rgb(0, 41, 87)',
    marginTop: 20,
  },
  fingerprintButton: {
    alignItems: 'center',
    marginVertical: 20,
  },
  fingerprintIcon: {
    width: 100,
    height: 100,
    // backgroundColor:'rgb(0, 41, 87)',
    
    
  },

  
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerLink: {
    color: 'rgb(0, 41, 87)',
    fontSize: RFPercentage(2),
    // marginVertical: 5,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;

