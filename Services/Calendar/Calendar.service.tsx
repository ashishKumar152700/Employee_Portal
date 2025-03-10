import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { format } from 'date-fns';
import { baseUrl } from "../../Global/Config";
 
class CalendarServices {
  async CalendarGet(selectedDate: string, currentDate: string , dispatch : any): Promise<any> {
 
 
const formattedCurrentDate = format(new Date(currentDate), 'dd/MM/yyyy');
const formattedSelectedDate = format(new Date(selectedDate), 'dd/MM/yyyy');
 
 
    try {
      const token = await AsyncStorage.getItem("accessToken");
 
      const response = await axios.get(
        `${baseUrl}/api/v1/punch/list?from=${formattedSelectedDate}&to=${formattedCurrentDate}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
 
      dispatch({type : "calendarData" , payload : response.data})
 
      if (response.status === 200) {
        // console.log(response.data);
 
        return response.data;
      } else {
        throw new Error(
          response.data.message || "Failed to retrieve punch data"
        );
      }
    } catch (error) {
      console.error(
        "Error in CalendarGet:",
        error instanceof Error ? error.message : error
      );
      throw new Error(
        `Error fetching punch data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
 
}
 
export const calendarservice = new CalendarServices();