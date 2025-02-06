import React, { useEffect, useState } from "react";
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
import MapView, { Marker } from "react-native-maps";

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
              <MaterialIcons name="touch-app" size={scaleSize(50)} color="white" />
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
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [address, setAddress] = useState<string>("");
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [punchType, setPunchType] = useState<"in" | "out" | null>(null);
  // State variable to force re-render MapView
  const [mapKey, setMapKey] = useState<number>(0);

  const punchInforSelector = useSelector((state: any) => state.punchInfo);

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

  const getLocation = async () => {
    const permissionGranted = await requestLocationPermission();
    if (!permissionGranted) return undefined;
    try {
      const locResult = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,  // High accuracy
        maximumAge: 0,                    // Ensure fresh data
      });
      const { latitude, longitude } = locResult.coords;
      console.log("Fetched location:", latitude, longitude);
      const addressResponse = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (addressResponse && addressResponse.length > 0) {
        const addr = addressResponse[0];
        const formattedAddress = `${addr.name ? addr.name + ", " : ""}${
          addr.street ? addr.street + ", " : ""
        }${addr.city ? addr.city + ", " : ""}${
          addr.region ? addr.region + ", " : ""
        }${addr.country ? addr.country : ""}`;
        setAddress(formattedAddress);
      }
      setLocation({ latitude, longitude });
      // Update mapKey to force MapView re-render
      setMapKey((prev) => prev + 1);
      return locResult;
    } catch (error) {
      console.error("Location Error:", error);
      Toast.show({
        type: "error",
        position: "top",
        text1: "Location Error",
        text2: "Unable to fetch location.",
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
      try {
        const response = await punchService.PunchInApi(loc);
        if (response.message === "Already Puched In!") {
          setClockInTime(response.data.punchintime);
          Toast.show({
            type: "info",
            position: "top",
            text1: "Info",
            text2: response.message,
            visibilityTime: 3000,
            autoHide: true,
          });
        } else {
          setClockInTime(response.data.punchintime);
          Toast.show({
            type: "success",
            position: "top",
            text1: "Success",
            text2: response.message,
            visibilityTime: 3000,
            autoHide: true,
          });
        }
      } catch (error) {
        console.error("Punch In Error:", error);
        Toast.show({
          type: "error",
          position: "top",
          text1: "Error",
          text2: "An error occurred while clocking in.",
          visibilityTime: 3000,
          autoHide: true,
        });
      }
    }
    setIsClockInLoading(false);
  };

  const handleClockOut = async () => {
    setIsClockOutLoading(true);
    const loc = await getLocation();
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
              <Feather name="clock" size={scaleSize(20)} color="rgb(0, 41, 87)" />
              <Text style={{ marginTop: 5 }}>{clockInTime || "Punch In"}</Text>
              <Text style={styles.footerText}>Clock In</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather name="clock" size={scaleSize(20)} color="rgb(0, 41, 87)" />
              <Text style={{ marginTop: 5 }}>{clockOutTime || "Punch Out"}</Text>
              <Text style={styles.footerText}>Clock Out</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather name="bar-chart-2" size={scaleSize(20)} color="rgb(0, 41, 87)" />
              <Text style={{ marginTop: 5 }}>{totalTime || "0h 0m"}</Text>
              <Text style={styles.footerText}>Totals</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal Dialog for Map with Address */}
      <Modal visible={isMapVisible} animationType="slide" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.mapContainer}>
            {location ? (
              <>
                <MapView
                  key={mapKey} // Force re-render on each update
                  style={styles.map}
                  region={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title={`Punch ${punchType?.toUpperCase()}`}
                  />
                </MapView>
                <View style={styles.addressContainer}>
                  <Text style={styles.addressText}>
                    {address || "Fetching address..."}
                  </Text>
                </View>
              </>
            ) : (
              <ActivityIndicator size="large" color="blue" />
            )}
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
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  mapContainer: {
    width: "90%",
    height: "50%",
    backgroundColor: "white",
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
  },
  map: {
    flex: 1,
    width: "100%",
  },
  addressContainer: {
    padding: scaleSize(10),
    backgroundColor: "#fff",
    alignItems: "center",
  },
  addressText: {
    fontSize: scaleFont(14),
    color: "black",
  },
  closeButton: {
    padding: 15,
    backgroundColor: "rgb(0, 41, 87)",
    alignItems: "center",
    width: "100%",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default PunchScreen;
