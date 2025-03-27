import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import { punchService } from "../../Services/Punch/Punch.service";
import { useSelector } from "react-redux";
import ClockComponent from "./ClockComponent";
import Toast from "react-native-toast-message";
import { WebView } from "react-native-webview"; // Add WebView import
import { useFocusEffect } from "@react-navigation/native";

const { width } = Dimensions.get("window");
const scaleFont = (size: any) => Math.round(size * (width / 375));
const scaleSize = (size: any) => Math.round(size * (width / 375));

interface ClockButtonProps {
  time: string;
  date: string;
  type: "in" | "out";
  onPress: () => void;
  isLoading: boolean;
  disabled?: boolean;
}

const ClockButton: React.FC<ClockButtonProps> = ({
  time,
  date,
  type,
  onPress,
  isLoading,
  disabled = false,
}) => {
  const gradientColors = disabled
    ? ["#b0b0b0", "#d3d3d3"]
    : type === "in"
    ? ["#3481ed", "#c087e6"]
    : ["#98309c", "#d93473"];

  const handlePress = () => {
    if (isLoading) return;
    if (disabled && type === "in") {
      Toast.show({
        type: "info",
        position: "top",
        text1: "Already Punched In",
        text2: "You have already punched in.",
        visibilityTime: 3000,
        autoHide: true,
      });
      return;
    }
    onPress();
  };

  return (
    <View>
      <LinearGradient colors={gradientColors} style={styles.gradientButton}>
        <TouchableOpacity
          onPress={handlePress}
          style={[styles.button, disabled && styles.disabledButton]}
        >
          {isLoading ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <>
              <MaterialIcons
                name="touch-app"
                size={scaleSize(50)}
                color="white"
              />
              <Text style={styles.buttonText}>
                {type === "in" ? "CLOCK IN" : "CLOCK OUT"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const PunchScreen: React.FC = () => {
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState<string | null>(null);
  const [clockInDate, setClockInDate] = useState<Date | null>(null);
  const [isClockInLoading, setIsClockInLoading] = useState(false);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [punchType, setPunchType] = useState<"in" | "out" | null>(null);

  const punchInforSelector = useSelector((state: any) => state.punchInfo);
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      const fetchPunchInfo = async () => {
        try {
          const punchInfo = punchInforSelector;
          if (punchInfo.length > 0 && punchInfo[0].punchintime) {
            setClockInTime(punchInfo[0].punchintime);
            setClockOutTime(punchInfo[0].punchouttime);
            const totalSeconds = punchInfo[0].duration;
            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            setTotalTime(`${hours}h ${minutes}m`);
          }
        } catch (error) {
          if (error.name === "AbortError") {
            console.log("API request aborted");
          } else {
            console.error("Error fetching punch info:", error);
          }
        }
      };
      fetchPunchInfo();
  
      return () => {
        controller.abort(); // Cancel API request when screen is unfocused
      };
    }, [punchInforSelector])
  );
  

  useEffect(() => {
    const fetchPunchInfo = async () => {
      try {
        const punchInfo = punchInforSelector;
        if (punchInfo.length > 0 && punchInfo[0].punchintime) {
          setClockInTime(punchInfo[0].punchintime);
          setClockOutTime(punchInfo[0].punchouttime);
          const totalSeconds = punchInfo[0].duration;
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          setTotalTime(`${hours}h ${minutes}m`);
        }
      } catch (error) {
        console.error("Error fetching punch info:", error);
      }
    };
    fetchPunchInfo();
  }, [punchInforSelector]);

  const requestLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      await showLocationAlert();
      return false;
    }
    return true;
  };

  const showLocationAlert = () =>
    new Promise<boolean>((resolve) => {
      Toast.show({
        type: "error",
        position: "top",
        text1: "Location Disabled",
        text2: "Please enable location services to proceed.",
        visibilityTime: 3000,
        autoHide: true,
        onPress: () => resolve(false),
      });
    });

    const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
      try {
        let response = await Location.reverseGeocodeAsync({ latitude, longitude });
        console.log("checking log:", response);
    
        if (response.length > 0) {
          let addressData = response[0];
    
          let fullAddress =
            addressData.formattedAddress ||
            `${addressData.name ? addressData.name + ", " : ""}${
              addressData.street ? addressData.street + ", " : ""
            }${addressData.city ? addressData.city + ", " : ""}${
              addressData.region ? addressData.region + ", " : ""
            }${addressData.country || ""}`;
    
          console.log("Fetched Address:", fullAddress);
          setAddress(fullAddress);
        } else {
          console.warn("No address found");
          setAddress("Address not found");
        }
      } catch (error) {
        console.error("Geocoding Error:", error);
        setAddress("Unable to fetch address");
      }
    };
    

  const getLocation = async () => {
    const permissionGranted = await requestLocationPermission();
    if (!permissionGranted) return undefined;

    try {
      const locResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (!locResult || !locResult.coords) {
        throw new Error("Invalid location data received");
      }

      const { latitude, longitude } = locResult.coords;
      setLocation({ latitude, longitude });

      await getAddressFromCoordinates(latitude, longitude);

      return locResult;
    } catch (error) {
      console.error("Location Error:", error);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Location Error",
        text2: "Unable to fetch location. Please check GPS settings.",
        visibilityTime: 3000,
        autoHide: true,
      });
      return undefined;
    }
  };

  const handleClockIn = async () => {
    if (clockInTime) {
      Toast.show({
        type: "info",
        position: "top",
        text1: "Already Punched In",
        text2: "You have already punched in.",
        visibilityTime: 6000,
        autoHide: true,
      });
      return;
    }
  
    setIsClockInLoading(true);
    const loc = await getLocation();
    if (loc) {
      setPunchType("in");
      setIsMapVisible(true);
      setClockInDate(new Date());
  
      const controller = new AbortController(); // Abort controller instance
      try {
        const response = await punchService.PunchInApi(loc, { signal: controller.signal });
        if (response.message === "Already Puched In!") {
          setClockInTime(response.data.punchintime);
          Toast.show({ type: "info", text1: "Info", text2: response.message });
        } else {
          setClockInTime(response.data.punchintime);
          Toast.show({ type: "success", text1: "Success", text2: response.message });
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Punch In Error:", error);
          Toast.show({ type: "error", text1: "Error", text2: "An error occurred while clocking in." });
        }
      }
  
      return () => controller.abort(); // Cancel API request when screen is unfocused
    }
    setIsClockInLoading(false);
  };
  

  const handleClockOut = async () => {
    setIsClockOutLoading(true);
    const loc = await getLocation();
    console.log("Location:", loc);  // Logs the location object
    if (loc) {
      setPunchType("out");
      setIsMapVisible(true);
      try {
        const response = await punchService.PunchOutApi(loc);
        setTotalTime(response.formattedDuration);
        setClockOutTime(response.punchouttime);
        Toast.show({
          type: "success",
          position: "top",
          text1: "Success",
          text2: response.punchOutMessage,
          visibilityTime: 6000,
          autoHide: true,
        });
      } catch (error) {
        console.error("Punch Out Error:", error);
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: "An error occurred while clocking out.",
          visibilityTime: 3000,
          autoHide: true,
        });
      }
    }
    setIsClockOutLoading(false);
  };

  // Function to generate Leaflet map HTML
  const generateMapHTML = (latitude: number, longitude: number) => {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Map</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
          <style>
              #map { 
                height: 100%; 
                width: 100%; 
              }
              body, html { 
                height: 100%; 
                margin: 0; 
                padding: 0; 
              }
          </style>
      </head>
      <body>
          <div id="map"></div>
          <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
          <script>
              document.addEventListener("DOMContentLoaded", function() {
                  var map = L.map('map').setView([${latitude}, ${longitude}], 16);
                  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                      attribution: '&copy; OpenStreetMap contributors'
                  }).addTo(map);
                  L.marker([${latitude}, ${longitude}]).addTo(map)
                      .bindPopup("Your Punch Location")
                      .openPopup();
              });
          </script>
      </body>
      </html>
    `;
  };
  

  let htmlContent: any;

  if (location) {
    htmlContent = generateMapHTML(location.latitude, location.longitude);
    // console.log(htmlContent); // Logs the generated HTML
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
          <ClockComponent />
          <ClockButton
            time={clockInTime || "00:00 AM"}
            date="March 19, 2024 - Friday"
            type="in"
            onPress={handleClockIn}
            isLoading={isClockInLoading}
            disabled={!!clockInTime}
          />
        </View>

        <View style={styles.card}>
          <ClockButton
            time={clockOutTime || "00:00 PM"}
            date="March 19, 2024 - Friday"
            type="out"
            onPress={handleClockOut}
            isLoading={isClockOutLoading}
          />
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Feather
                name="clock"
                size={scaleSize(20)}
                color="rgb(0, 41, 87)"
              />
              <Text style={{ marginTop: 5 }}>{clockInTime || "Punch In"}</Text>
              <Text style={styles.footerText}>Clock In</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather
                name="clock"
                size={scaleSize(20)}
                color="rgb(0, 41, 87)"
              />
              <Text style={{ marginTop: 5 }}>
                {clockOutTime || "Punch Out"}
              </Text>
              <Text style={styles.footerText}>Clock Out</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather
                name="bar-chart-2"
                size={scaleSize(20)}
                color="rgb(0, 41, 87)"
              />
              <Text style={{ marginTop: 5 }}>{totalTime || "0h 0m"}</Text>
              <Text style={styles.footerText}>Totals</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal visible={isMapVisible} animationType="slide" transparent={true}>
  <View style={styles.modalContainer}>
    <View style={styles.mapContainer}>
      <View style={styles.webviewWrapper}>
        {location ? (
          <WebView
            originWhitelist={["*"]}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            mixedContentMode="always"
            source={{ html: generateMapHTML(location.latitude, location.longitude) }}
            style={styles.webview}
          />
        ) : (
          <ActivityIndicator size="large" color="blue" />
        )}
      </View>
      <View style={styles.addressContainer}>
        <Text style={styles.addressText}>
          {address || "Fetching address..."}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          setIsMapVisible(false);
          setLocation(null);
          setAddress("");
        }}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  </View>
</Modal>

      <Toast />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: scaleSize(13),
    alignItems: "center",
    paddingBottom: scaleSize(5),
    marginBottom: scaleSize(55),
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0.5,
    borderColor: "#ced4da",
    borderRadius: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    padding: scaleSize(15),
    width: "100%",
    marginBottom: scaleSize(10),
    flexGrow: 1,
    minHeight: scaleSize(100),
    justifyContent: "center",
  },
  buttonText: {
    fontSize: scaleFont(20),
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
  },
  gradientButton: {
    width: scaleSize(170),
    height: scaleSize(170),
    borderRadius: scaleSize(85),
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  button: {
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    height: "100%",
  },
  disabledButton: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: scaleSize(30),
  },
  footerItem: {
    alignItems: "center",
    width: "33%",
  },
  footerText: {
    fontSize: scaleFont(12),
    color: "rgb(0, 41, 87)",
    marginTop: scaleSize(4),
    fontWeight: "bold",
  },
 
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  
  addressText: {
    fontSize: scaleFont(14),
    color: "black",
    textAlign:"center"
  },

  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    width: "90%",
    height: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
  },
  webviewWrapper: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
  addressContainer: {
    padding: scaleSize(10),
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  closeButton: {
    padding: 15,
    backgroundColor: "rgb(0, 41, 87)",
    alignItems: "center",
  },
});

export default PunchScreen;
