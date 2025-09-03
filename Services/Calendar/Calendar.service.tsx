import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

class CalendarServices {
async CalendarGet(
  selectedDate: string,
  currentDate: string,
  dispatch: any
): Promise<any> {
  try {
    const formatDateIST = (date: string) => {
      const d = new Date(date);
      const istDateString = d.toLocaleDateString("en-US", {
        timeZone: "Asia/Kolkata",
      });
      const [month, day, year] = istDateString.split("/");
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    };

    const formattedCurrentDate = formatDateIST(currentDate);
    const formattedSelectedDate = formatDateIST(selectedDate);

    const token = await AsyncStorage.getItem("accessToken");
    const empCode = await AsyncStorage.getItem("employeeCode");

    if (!token) throw new Error("No access token found");
    if (!empCode) throw new Error("Employee code not found");

    console.log("Calendar API call with IST dates:", {
      empCode,
      from: formattedSelectedDate,
      to: formattedCurrentDate,
      originalSelected: selectedDate,
      originalCurrent: currentDate,
    });

    const url = `${baseUrl}/api/v1/punch/list?from=${formattedSelectedDate}&to=${formattedCurrentDate}`;

    console.log("📡 Punch List API URL in Calendar service :", url);

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });
    
    console.log("response in calendar service :", response.data.data);

    // Handle null punchouttime values in the response
    const processedData = response.data.data.map((item: any) => ({
      ...item,
      punchouttime: item.punchouttime || "", // Convert null to empty string
    }));

    
    dispatch({ 
      type: "calendarData", 
      payload: { ...response.data, data: processedData } 
    });
    
    return processedData;
  } catch (error: any) {
    console.error(
      "Error in CalendarGet:",
      error.response?.data || error.message
    );
    throw error;
  }

}
}

export const calendarservice = new CalendarServices();
