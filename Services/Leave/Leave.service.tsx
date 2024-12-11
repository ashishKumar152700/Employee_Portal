import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

// class LeaveServices {
  // Fetch leaves for the user
  export const getLeaves = async (dispatch: any) => {
    console.log("[getLeaves] Starting API call to fetch user leaves");

    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (!token) {
        throw new Error("No access token found. Please log in again.");
      }

      const response = await axios.get(`${baseUrl}/api/v1/leaves/get`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        console.log("[getLeaves] Fetch successful:", response.data.data);
        dispatch({ type: "leaveDetails", payload: response.data.data });
        return response.data;
      } else {
        throw new Error(response.data.message || "Failed to fetch leave details");
      }
    } catch (error: any) {
      console.error("[getLeaves] Error occurred:", error);
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("An error occurred while fetching leave details.");
      }
    } finally {
      console.log("[getLeaves] API call completed.");
    }
  }

  
export const submitLeaveApplication = async (leaveDetails : any) => {

  console.log("leave details payload : " , leaveDetails);
  
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No access token found. Please log in again.');
    }

    const data = JSON.stringify({
      leavetype: leaveDetails.leavetype || '',
      leavestart: leaveDetails.leavestart,
      leaveend: leaveDetails.leaveend,
      leavepart: leaveDetails.leavepart || '',
      reason: leaveDetails.reason,
      approver: leaveDetails.approver,
    });

    console.log('Submitting leave application with payload:', data);

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: `${baseUrl}/api/v1/leaves/apply`,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      data: data,
    };

    const response = await axios.request(config);

    if (response.status === 200) {
      console.log('Leave application successful:', response.data);
      return response.data;
    } else {
      console.error('Leave application failed:', response.data.message);
      throw new Error(response.data.message || 'Leave application failed');
    }
  } catch (error) {
    console.error('Error submitting leave application:', error);
    throw error;
  }
};

