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

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const handleLogin = async () => {
    if (!employeecode || !password) {
      Alert.alert('Error', 'Employee code and password are required');
      return;
    }
    setLoading(true);
    try {
      const response = await loginservice.LoginApi({ employeecode: +employeecode, password }, dispatch);
      if (response.status === 200) {
        await AsyncStorage.setItem('token', response.data.accessToken);
        await AsyncStorage.setItem('punchInfo', JSON.stringify(response.data.user.punchInfo));
        navigation.navigate('Main');
      }
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
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
            <Text style={styles.welcomeText}>Welcome To</Text>
            <Text style={styles.portalText}>Employee Self Service Portal</Text>
            <TextInput
              label="Employee Code"
              value={employeecode}
              onChangeText={setEmployeecode}
              style={styles.input}
              mode="outlined"
              activeOutlineColor="rgb(0, 41, 87)"
              outlineColor="rgb(0, 41, 87)"
              theme={{ colors: { background: 'white' } }}
              left={<TextInput.Icon icon="account-circle" color="rgb(0, 41, 87)" />}
            />
            <TextInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={secureTextEntry}
              style={styles.input}
              mode="outlined"
              activeOutlineColor="rgb(0, 41, 87)"
              outlineColor="rgb(0, 41, 87)"
              theme={{ colors: { background: 'white' } }}
              left={<TextInput.Icon icon="lock" color="rgb(0, 41, 87)" />}
              right={
                <TextInput.Icon
                  icon={secureTextEntry ? "eye-off" : "eye"}
                  color="rgb(0, 41, 87)"
                  onPress={togglePasswordVisibility}
                />
              }
            />
            {loading ? (
              <ActivityIndicator size="large" color="rgb(0, 41, 87)" style={{ marginVertical: 20 }} />
            ) : (
              <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Login</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.orText}>or login with</Text>
            <TouchableOpacity style={styles.fingerprintContainer}>
              <MaterialIcons name="fingerprint" size={64} color="rgb(0, 41, 87)" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 20 },
  card: { width: '100%', height: '90%', paddingHorizontal: width * 0.05, borderRadius: 40, backgroundColor: 'white', alignItems: 'center', marginTop: 300 },
  logo: { width: width * 0.4, height: width * 0.4, marginBottom: 10 },
  welcomeText: { fontSize: scale(18), fontWeight: 'bold', color: 'rgb(0, 41, 87)' },
  portalText: { fontSize: scale(16), color: '#555', textAlign: 'center', marginTop: 5 },
  input: { width: '100%', marginBottom: 10 },
  button: { backgroundColor: 'rgb(0, 41, 87)', width: '100%', padding: 14, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  buttonText: { color: 'white', fontSize: scale(14), fontWeight: '600' },
  orText: { fontSize: scale(12), color: 'rgb(0, 41, 87)', marginTop: 20 },
  fingerprintContainer: { marginTop: 15, alignItems: 'center' },
  footerLink: { color: 'rgb(0, 41, 87)', fontSize: scale(12), textDecorationLine: 'underline' },
});

export default LoginScreen;