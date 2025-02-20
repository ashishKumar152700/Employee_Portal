import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

export const getReimbursements = async (dispatch: any) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/reimbursements/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("[getReimbursements] Fetch successful:", response.data.data);
      dispatch({ type: "reimbursementDetails", payload: response.data.data });
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch reimbursements");
    }
  } catch (error: any) {
    console.error("[getReimbursements] Error:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching reimbursements.");
  } finally {
    console.log("[getReimbursements] API call completed.");
  }
};

export const requestReimbursement = async (reimbursementDetails: any) => {
  console.log("Reimbursement request payload:", reimbursementDetails);
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const data = JSON.stringify({
      category: reimbursementDetails.category || "",
      amount: reimbursementDetails.amount,
      reason: reimbursementDetails.reason,
      date: reimbursementDetails.date,
      approver: reimbursementDetails.approver,
    });

    console.log("Submitting reimbursement request with payload:", data);

    const config = {
      method: "post",
      url: `${baseUrl}/api/v1/reimbursements/request`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);

    if (response.status === 200) {
      console.log("Reimbursement request successful:", response.data);
      return response.data;
    } else {
      throw new Error(response.data.message || "Reimbursement request failed");
    }
  } catch (error) {
    console.error("Error submitting reimbursement request:", error);
    throw error;
  }
};

export const getReimbursementHistory = async (status: string) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/reimbursements/history?status=${status}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("Reimbursement history fetched:", response.data);
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch reimbursement history");
    }
  } catch (error: any) {
    console.error("Error fetching reimbursement history:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching reimbursement history.");
  } finally {
    console.log("[Reimbursement history API call completed]");
  }
};
