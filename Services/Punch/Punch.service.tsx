import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";
import { differenceInSeconds } from "date-fns";
import { parse, isValid } from "date-fns";

class PunchServices {


  async PunchInApi(location: any) {
    try {
      console.log("Punch In Location:", location);

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await axios.post(
        `${baseUrl}/api/v1/punch/in`,
        location,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        console.log("Punch In Response:", response.data);
        return response.data;
      } else {
        console.error("Punch In Error:", response.data.message);
        throw new Error(response.data.message || "Punch In failed");
      }
    } catch (error) {
      console.error("Error during Punch In:", error);
      throw error;
    }
  }

  async PunchOutApi(location: any) {
    try {
      console.log("Punch Out Location:", location);

      const token = await AsyncStorage.getItem("accessToken");
      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await axios.patch(
        `${baseUrl}/api/v1/punch/out`,
        location,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Punch Out Response:", response.status);

      if (response.status === 200) {
        const punchOutData = response.data.data;
        const punchOutMessage = response.data.message;

        let { punchintime, punchouttime } = punchOutData;

        if (!punchintime || !punchouttime) {
          throw new Error("Punch In or Punch Out time is missing.");
        }

        // Removing the unnecessary time formatting
        punchOutData.punchintime = punchintime;
        punchOutData.punchouttime = punchouttime;

        // Calculate duration in seconds
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

        // Format duration (hours, minutes, seconds)
        const formattedDuration = `${Math.floor(
          durationSeconds / 3600
        )}h ${Math.floor((durationSeconds % 3600) / 60)}m`;

        console.log("Total Duration:", formattedDuration);

        return { ...punchOutData, formattedDuration, punchOutMessage };
      } else {
        console.error("Punch Out Error:", response.data.message);
        throw new Error(response.data.message || "Punch Out failed");
      }
    } catch (error) {
      console.error("Error during Punch Out:", error.message);
      throw error;
    }
}

}

export const punchService = new PunchServices();
