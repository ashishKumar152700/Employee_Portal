import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";
import { differenceInSeconds } from "date-fns";
import { parse, isValid } from "date-fns";

class PunchServices {


  async PunchInApi(location: any) {
    try {
      console.log("Punch In Location:", location);
  
      const payload = {
        coords: {
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
        },
        mocked: location.mocked ?? false,
        timestamp: location.timestamp,
      };
  
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }
  
      console.log("Token:", token);
  
      const response = await axios.post(`${baseUrl}/api/v1/punch/in`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      if (response.status === 200) {
        console.log("Punch In Response:", response.data);
        return response.data;
      } else {
        throw new Error(response.data.message || "Punch In failed");
      }
    } catch (error: any) {
      console.error("Error during Punch In:", error);
  
      // Handling different error cases
      if (error.response) {
        // Server responded with a status code out of the 2xx range
        console.error("Server Error Response:", error.response.data);
        console.error("Status Code:", error.response.status);
  
        if (error.response.status === 500) {
          throw new Error("Server is currently unavailable. Please try again later.");
        } else {
          throw new Error(error.response.data.message || "Unexpected error occurred.");
        }
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        throw new Error("Network error. Please check your internet connection.");
      } else {
        // Something else happened
        throw new Error(error.message || "Something went wrong. Please try again.");
      }
    }
  }
  
  async PunchOutApi(location: any) {
    try {
      console.log("Punch Out Location:", location);
      const payload = {
        coords: {
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
        },
        mocked: location.mocked ?? false,
        timestamp: location.timestamp,
      };
      console.log("Payload:", payload);
  
      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }
  
      const response = await axios.patch(`${baseUrl}/api/v1/punch/out`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
  
      console.log("Punch Out Response:", response.status);
  
      if (response.status === 200) {
        const punchOutData = response.data.data;
        const punchOutMessage = response.data.message;
  
        let { punchintime, punchouttime } = punchOutData;
  
        if (!punchintime || !punchouttime) {
          throw new Error("Punch In or Punch Out time is missing.");
        }
  
        let changedParsedPunchInTime: Date = parse(punchintime, "HH:mm:ss", new Date());
        let changedParsedPunchOutTime: Date = parse(punchouttime, "HH:mm:ss", new Date());
  
        console.log("parsedPunchInTime : ", changedParsedPunchInTime);
        console.log("parsedPunchOutTime : ", changedParsedPunchOutTime);
  
        if (!isValid(changedParsedPunchInTime) || !isValid(changedParsedPunchOutTime)) {
          throw new Error("Invalid Punch In or Punch Out time format.");
        }
  
        const durationSeconds = differenceInSeconds(
          changedParsedPunchOutTime,
          changedParsedPunchInTime
        );
  
        console.log("durationSeconds : ", durationSeconds);
  
        const formattedDuration = `${Math.floor(durationSeconds / 3600)}h ${Math.floor(
          (durationSeconds % 3600) / 60
        )}m`;
  
        console.log("Total Duration:", formattedDuration);
  
        return { ...punchOutData, formattedDuration, punchOutMessage };
      } else {
        throw new Error(response.data.message || "Punch Out failed");
      }
    } catch (error: any) {
      console.error("Error during Punch Out:", error);
  
      if (error.response) {
        console.error("Server Error Response:", error.response.data);
        console.error("Status Code:", error.response.status);
  
        if (error.response.status === 500) {
          throw new Error("Server is currently facing issues. Please try again later.");
        } else {
          throw new Error(error.response.data.message || "Unexpected error occurred.");
        }
      } else if (error.request) {
        console.error("No response received:", error.request);
        throw new Error("Network error. Please check your internet connection.");
      } else {
        throw new Error(error.message || "Something went wrong. Please try again.");
      }
    }
  }
  

}

export const punchService = new PunchServices();
