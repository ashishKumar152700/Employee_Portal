import React, { useEffect } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { RootStackParamList } from './Global/Types';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from "@react-native-async-storage/async-storage";

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<Login>();
  const fadeAnim = new Animated.Value(0);
  type Login = StackNavigationProp<RootStackParamList, 'Login'>;
  

  useEffect(() => {
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      navigation.navigate("Login");
    }, 3000);
  }, [navigation, fadeAnim]);

 
  

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        Welcome to MyApp
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#4c8bf5", // More vibrant blue color
    padding: 20, // Add padding for better spacing
  },
  text: {
    fontSize: 28,
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 1.5, // Add letter spacing for a smoother text appearance
  },
});

export default SplashScreen;
