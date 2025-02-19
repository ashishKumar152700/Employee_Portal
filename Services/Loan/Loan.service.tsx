import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

export const getLoans = async (dispatch: any) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/loans/get`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("[getLoans] Fetch successful:", response.data.data);
      dispatch({ type: "loanDetails", payload: response.data.data });
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch loan details");
    }
  } catch (error: any) {
    console.error("[getLoans] Error occurred:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching loan details.");
  } finally {
    console.log("[getLoans] API call completed.");
  }
};

export const applyForLoan = async (loanDetails: any) => {
  console.log("Loan details payload:", loanDetails);
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const data = JSON.stringify({
      loanType: loanDetails.loanType || "",
      loanAmount: loanDetails.loanAmount,
      tenure: loanDetails.tenure,
      interestRate: loanDetails.interestRate,
      reason: loanDetails.reason,
      approver: loanDetails.approver,
    });

    console.log("Submitting loan application with payload:", data);

    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${baseUrl}/api/v1/loans/apply`,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: data,
    };

    const response = await axios.request(config);

    if (response.status === 200) {
      console.log("Loan application successful:", response.data);
      return response.data;
    } else {
      console.error("Loan application failed:", response.data.message);
      throw new Error(response.data.message || "Loan application failed");
    }
  } catch (error) {
    console.error("Error submitting loan application:", error);
    throw error;
  }
};

export const getLoanHistory = async (loanStatus: string) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");
    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/loans/history?status=${loanStatus}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 200) {
      console.log("Loan history fetched:", response.data);
      return response.data;
    } else {
      throw new Error(response.data.message || "Failed to fetch loan history");
    }
  } catch (error: any) {
    console.error("Error fetching loan history:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching loan history.");
  } finally {
    console.log("[Loan history API call completed]");
  }
};
