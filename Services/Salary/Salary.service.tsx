import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

export const getSalaries = async (dispatch: any) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/salaries/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("[getSalaries] Fetch successful:", response.data.data);
      dispatch({ type: "salaryDetails", payload: response.data.data });
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch salary details");
    }
  } catch (error: any) {
    console.error("[getSalaries] Error occurred:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching salary details.");
  } finally {
    console.log("[getSalaries] API call completed.");
  }
};

export const requestSalaryAdvance = async (advanceDetails: any) => {
  console.log("Salary advance request payload:", advanceDetails);
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const data = JSON.stringify({
      amount: advanceDetails.amount,
      reason: advanceDetails.reason,
      approver: advanceDetails.approver,
    });

    console.log("Submitting salary advance request with payload:", data);

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${baseUrl}/api/v1/salaries/advance`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);

    if (response.status === 200) {
      console.log("Salary advance request successful:", response.data);
      return response.data;
    } else {
      console.error("Salary advance request failed:", response.data.message);
      throw new Error(response.data.message || "Salary advance request failed");
    }
  } catch (error) {
    console.error("Error submitting salary advance request:", error);
    throw error;
  }
};

export const getSalaryHistory = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/salaries/history`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("Salary history fetched:", response.data);
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch salary history");
    }
  } catch (error: any) {
    console.error("Error fetching salary history:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching salary history.");
  } finally {
    console.log("[Salary history API call completed]");
  }
};
