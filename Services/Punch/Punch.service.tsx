import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";
import { add } from "date-fns";

class PunchServices {
  async PunchInApi(location: any, address?: string) {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const empCode = await AsyncStorage.getItem("employeeCode");

      if (!token)
        throw new Error("No access token found. Please log in again.");
      if (!empCode)
        throw new Error("Employee code not found. Please log in again.");

      const payload = {
        empCode,
        coords: {
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
        },
        address: address,
        mocked: location.mocked || false,
        timestamp: Date.now(),
        deviceIp: "0",
        source: "MOBILE",
      };

      console.log("Punch In Payload:", payload);

      const response = await axios.post(`${baseUrl}/api/v1/punch/in`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Punch In Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Punch In Error:", error.response?.data || error.message);
      throw error;
    }
  }

  async PunchOutApi(location: any, address?: string) {
    try {
      const token = await AsyncStorage.getItem("accessToken");
      const empCode = await AsyncStorage.getItem("employeeCode");

      if (!token)
        throw new Error("No access token found. Please log in again.");
      if (!empCode)
        throw new Error("Employee code not found. Please log in again.");

      const payload = {
        empCode,
        coords: {
          accuracy: location.coords.accuracy,
          altitude: location.coords.altitude,
          altitudeAccuracy: location.coords.altitudeAccuracy,
          heading: location.coords.heading,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          speed: location.coords.speed,
        },
        address: address,
        mocked: location.mocked || false,
        timestamp: Date.now(),
        deviceIp: "0",
        source: "MOBILE",
      };

      console.log("Punch Out Payload:", payload);

      const response = await axios.patch(
        `${baseUrl}/api/v1/punch/out`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Punch Out Response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Punch Out Error:", error.response?.data || error.message);
      throw error;
    }
  }

  async GetTodayPunchAndUpdateRedux(dispatch: any) {
    try {
      console.log("GetTodayPunchAndUpdateRedux - Start");
      const todayPunch = await this.GetTodayPunchApi();
      console.log("GetTodayPunchAndUpdateRedux - Response:", todayPunch);

      // Store in Redux
      dispatch({ type: "todayPunch", payload: todayPunch });

      return todayPunch;
    } catch (error: any) {
      console.error("GetTodayPunchAndUpdateRedux Error:", error);
      return null;
    }
  }
  
  async GetTodayPunchApi() {
    try {
      console.log("GetTodayPunch - Start");

      const token = await AsyncStorage.getItem("accessToken");
      const empCode = await AsyncStorage.getItem("employeeCode");

      if (!token)
        throw new Error("No access token found. Please log in again.");
      if (!empCode)
        throw new Error("Employee code not found. Please log in again.");

      const now = new Date();
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      const formattedDate = `${day}/${month}/${year}`;

      console.log("SERVICE GetTodayPunch - Date:", formattedDate);

      const response = await axios.get(
        `${baseUrl}/api/v1/punch/list?from=${formattedDate}&to=${formattedDate}&empCode=${empCode}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("GetTodayPunch - Response:", response.data);

      // Handle case where first punch is from biometrics (no data initially)
      if (!response.data.data || response.data.data.length === 0) {
        // If no data, check if there might be a biometric entry with null punchouttime
        try {
          // Try a different endpoint or approach to get today's punch data
          const fallbackResponse = await axios.get(
            `${baseUrl}/api/v1/punch/today?empCode=${empCode}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log(
            "GetTodayPunch - Fallback Response:",
            fallbackResponse.data
          );
          return fallbackResponse.data.data || null;
        } catch (fallbackError) {
          console.log("GetTodayPunch - No data available for today");
          return null;
        }
      }

      return response.data.data[0];
    } catch (error: any) {
      console.error(
        "Get Today Punch Error:",
        error.response?.data || error.message
      );

      // If the list endpoint fails, try the today endpoint
      try {
        const token = await AsyncStorage.getItem("accessToken");
        const empCode = await AsyncStorage.getItem("employeeCode");

        const fallbackResponse = await axios.get(
          `${baseUrl}/api/v1/punch/today?empCode=${empCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log(
          "GetTodayPunch - Fallback Response:",
          fallbackResponse.data
        );
        return fallbackResponse.data.data || null;
      } catch (fallbackError: any) {
        console.error(
          "Get Today Punch Fallback Error:",
          fallbackError.response?.data || fallbackError.message
        );
        return null;
      }
    }
  }
}

export const punchService = new PunchServices();
