import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

class ManagerLeaveRequest {
    async LeaveRequestGet(id: Number) {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }
  
        const url = `${baseUrl}/api/v1/leaves/requests?approver=${id}`;
  
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        console.log("Leave Request Response:", response.data);
        return response.data;
      } catch (error: any) {
        console.error("Error during fetching leave requests:", error);
        
        const message =
          error.response?.data?.message || "Something went wrong. Please try again.";
        throw new Error(message);
      }
    }
  }
  
  export const managerLeaveRequestClass = new ManagerLeaveRequest();
  
