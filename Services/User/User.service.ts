import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

export async function getUser() {
  console.log("[getUser] Starting API call to fetch user data.");

  try {
    const token = await AsyncStorage.getItem("token");
    // console.log(token);

    const userDetailsString = await AsyncStorage.getItem("user");
    // console.log(userDetailsString);

    const userDetails = JSON.parse(userDetailsString);
    // console.log(userDetails);

    const userId = userDetails.id;
    // console.log("userId to get id for profile : ", userId);

    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const response = await axios.get(`${baseUrl}/api/v1/user/get`, {
      params: {
        id: userId,
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log("resp @@@@@ : " , response);
    
    return response.data.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error("[getUser] Axios error occurred:", {
        message: error.message,
        response: error.response ? error.response.data : "No response",
        status: error.response?.status,
      });
    } else {
      console.error("[getUser] Non-Axios error occurred:", error);
    }
    throw error;
  } finally {
    // console.log("[getUser] API call completed.");
  }
}

export async function changePassword(
  oldPassword: string,
  newPassword: string,
  confirmpassword: string
): Promise<string> {
  console.log("[DEBUG] changePassword: Function invoked");

  try {
    const accessToken = await AsyncStorage.getItem("token");
    console.log("[DEBUG] AccessToken:", accessToken);

    if (!accessToken) {
      throw new Error("User is not authenticated. Please log in again.");
    }

    const payload = { oldpassword :oldPassword, newpassword: newPassword, confirmpassword };
    console.log("[DEBUG] Payload to be sent:", payload);


    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };
    console.log("[DEBUG] Headers:", headers);

    const response = await axios.post(
      `${baseUrl}/api/v1/auth/changepassword`,
      payload,
      { headers : headers }
    );

    console.log("[DEBUG] Response Data:", response.data);

    if (response.data.status === 200) {
      console.log("[DEBUG] Password change success:", response.data.message);
      return response.data.message || "Password updated successfully!";
    } else {
      console.error("[DEBUG] API returned error status:", response.data);
      throw new Error(response.data.message || "Failed to update password.");
    }
  } catch (error: any) {
    console.error("[DEBUG] Error during password change:", error);

    const errorMessage =
      error.response?.data?.message || "Something went wrong. Please try again.";
    console.error("[DEBUG] Extracted Error Message:", errorMessage);

    throw new Error(errorMessage);
  }
}
