import React, { useState, useEffect, useRef } from "react";
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
  StatusBar,
  Animated,
  Easing,
} from "react-native";
import { TextInput } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { RootStackParamList } from "../../Global/Types";
import { StackNavigationProp } from "@react-navigation/stack";
import { MaterialIcons } from "@expo/vector-icons";
import { loginservice } from "../../Services/Login/Login.service";
import { useDispatch } from "react-redux";
import { scale } from "react-native-size-matters";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

const LoginScreen = () => {
  const [employeecode, setEmployeecode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const dispatch = useDispatch();

  // Animation refs
  const logoScaleAnim = new Animated.Value(1);
  const buttonScaleAnim = new Animated.Value(1);
  const welcomeAnimationRef = useRef<LottieView>(null);
  const loadingOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startLogoScale();
    welcomeAnimationRef.current?.play();
  }, []);

  useEffect(() => {
    if (loading) {
      // Fade in over 1000ms (1 second - much smoother)
      Animated.timing(loadingOpacity, {
        toValue: 1,
        duration: 1000,
        easing: Easing.bezier(0.4, 0.0, 0.2, 1), // Material design ease-out
        useNativeDriver: true,
      }).start();
    } else {
      // Wait 800ms, then fade out over 1200ms (total ~2 seconds before disappearing)
      Animated.sequence([
        Animated.delay(1500), // Hold the loading screen for a bit
        Animated.timing(loadingOpacity, {
          toValue: 0,
          duration: 1200,
          easing: Easing.bezier(0.0, 0.0, 0.2, 1), // Material design ease-in
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

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
      Alert.alert("Error", "Employee code and password are required");
      return;
    }

    animateButtonPress();
    setLoading(true);

    // Start timer to ensure minimum 2 seconds of loading display
    const startTime = Date.now();
    const minLoadingTime = 20000;

    try {
      const response = await loginservice.LoginApi(
        { employeecode: +employeecode, password },
        dispatch
      );

      // Calculate remaining time to reach minimum loading duration
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      // Wait for remaining time if needed
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      if (response.status === 200) {
        await AsyncStorage.setItem("token", response.data.accessToken);

        const userData = await AsyncStorage.getItem("user");
        if (userData) {
          // Navigation will be handled automatically by the conditional rendering in App.tsx
        } else {
          throw new Error("User data not found after login");
        }
      }
    } catch (error) {
      // Calculate remaining time even in error case
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadingTime - elapsedTime);

      // Wait for remaining time if needed
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      let errorMessage = "Login failed";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      Alert.alert("Login Failed", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <StatusBar backgroundColor="rgb(0, 41, 87)" barStyle="light-content" />
      <LinearGradient
        colors={["rgb(0, 41, 87)", "rgba(0, 41, 87, 0.8)", "#FFFFFF"]}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces={false}
            scrollEnabled={!loading}
          >
            <View style={styles.headerSection}>
              <View style={styles.lottieContainer}>
                <LottieView
                  ref={welcomeAnimationRef}
                  source={require("../../assets/animations/success.json")}
                  autoPlay
                  loop
                  style={styles.welcomeLottie}
                />
              </View>

              <Animated.View
                style={[
                  styles.logoContainer,
                  {
                    transform: [{ scale: logoScaleAnim }],
                  },
                ]}
              >
                <Image
                  source={{
                    uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU",
                  }}
                  style={styles.logo}
                />
              </Animated.View>

              <View style={styles.headerTextContainer}>
                <Text style={styles.companyName}>RKT ESS</Text>
                <Text style={styles.tagline}>Employee Self Service Portal</Text>
              </View>
            </View>

            {/* Login Card */}
            <View style={styles.loginCard}>
              <LinearGradient
                colors={[
                  "rgba(255, 255, 255, 0.95)",
                  "rgba(255, 255, 255, 0.9)",
                ]}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.welcomeText}>Welcome Back!</Text>
                  <Text style={styles.subtitleText}>
                    Please sign in to continue
                  </Text>
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
                          background: "#FFFFFF",
                          onSurfaceVariant: "#999",
                          outline: "#E0E0E0",
                          primary: "rgb(0, 41, 87)",
                          placeholder: "#999",
                          onSurface: "#000",
                          surface: "#FFFFFF",
                        },
                      }}
                      left={
                        <TextInput.Icon
                          icon="badge-account"
                          color="rgb(0, 41, 87)"
                        />
                      }
                      keyboardType="numeric"
                      contentStyle={styles.inputContent}
                      outlineStyle={styles.inputOutline}
                      editable={!loading}
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
                          background: "#FFFFFF",
                          onSurfaceVariant: "#999",
                          outline: "#E0E0E0",
                          primary: "rgb(0, 41, 87)",
                          placeholder: "#999",
                          onSurface: "#000",
                          surface: "#FFFFFF",
                        },
                      }}
                      left={
                        <TextInput.Icon
                          icon="lock-outline"
                          color="rgb(0, 41, 87)"
                        />
                      }
                      right={
                        <TextInput.Icon
                          icon={
                            secureTextEntry ? "eye-off-outline" : "eye-outline"
                          }
                          color="rgb(0, 41, 87)"
                          onPress={togglePasswordVisibility}
                        />
                      }
                      contentStyle={styles.inputContent}
                      outlineStyle={styles.inputOutline}
                      editable={!loading}
                    />
                  </View>

                  <Animated.View
                    style={{ transform: [{ scale: buttonScaleAnim }] }}
                  >
                    <TouchableOpacity
                      style={styles.loginButton}
                      onPress={handleLogin}
                      activeOpacity={0.8}
                      disabled={loading}
                    >
                      <LinearGradient
                        colors={["rgb(0, 41, 87)", "rgba(0, 41, 87, 0.8)"]}
                        style={styles.buttonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <MaterialIcons
                          name="login"
                          size={20}
                          color="white"
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.buttonText}>Sign In</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              </LinearGradient>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Loading Overlay with Blur - FIXED */}
        {loading && (
          <Animated.View
            style={[
              styles.loadingOverlay,
              {
                opacity: loadingOpacity,
              },
            ]}
          >
            <View style={styles.blurBackground} />
            <View style={styles.loadingCard}>
              <LottieView
                source={require("../../assets/animations/loading.json")}
                autoPlay
                loop
                style={styles.loadingLottie}
              />
              <Text style={styles.loadingText}>Signing you in...</Text>
              <Text style={styles.loadingSubtext}>Please wait</Text>
            </View>
          </Animated.View>
        )}
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
    alignItems: "center",
    marginBottom: 40,
    paddingTop: 20,
  },
  lottieContainer: {
    position: "absolute",
    top: -66,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 0,
  },
  welcomeLottie: {
    width: 260,
    height: 200,
    opacity: 0.6,
  },
  logoContainer: {
    marginBottom: 16,
    marginTop: 106,
    zIndex: 1,
  },
  logo: {
    width: 90,
    height: 90,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  headerTextContainer: {
    alignItems: "center",
    zIndex: 1,
  },
  companyName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  tagline: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  loginCard: {
    borderRadius: 24,
    marginBottom: 10,
    shadowColor: "#000",
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
  cardLogoContainer: {
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 41, 87, 0.1)",
  },
  cardLogo: {
    width: 100,
    height: 45,
    backgroundColor: "transparent",
  },
  cardHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "rgb(0, 41, 87)",
    marginBottom: 8,
  },
  subtitleText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    fontSize: 14,
  },
  inputContent: {
    color: "#000",
  },
  inputOutline: {
    borderRadius: 12,
    borderWidth: 1.5,
  },
  loginButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 20,
    shadowColor: "rgb(0, 41, 87)",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  // Loading Overlay Styles
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  blurBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  },
  loadingCard: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderRadius: 24,
    padding: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    minWidth: 280,
  },
  loadingLottie: {
    width: 180,
    height: 180,
  },
  loadingText: {
    marginTop: 20,
    color: "rgb(0, 41, 87)",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  loadingSubtext: {
    marginTop: 8,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
});

export default LoginScreen;
