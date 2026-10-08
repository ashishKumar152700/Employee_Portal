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
  // Never log the token, the request payload/headers, or a raw axios error
  // here: they carry the bearer token and the plain-text passwords.
  try {
    const accessToken = await AsyncStorage.getItem("token");

    if (!accessToken) {
      throw new Error("User is not authenticated. Please log in again.");
    }

    const payload = { oldpassword :oldPassword, newpassword: newPassword, confirmpassword };

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    };

    const response = await axios.post(
      `${baseUrl}/api/v1/auth/changepassword`,
      payload,
      { headers : headers }
    );

    if (response.data.status === 200) {
      return response.data.message || "Password updated successfully!";
    } else {
      console.error(
        "[changePassword] API returned error status:",
        response.data?.status,
        response.data?.message
      );
      throw new Error(response.data.message || "Failed to update password.");
    }
  } catch (error: any) {
    console.error(
      "[changePassword] Request failed:",
      error?.response?.status ?? "",
      error?.message
    );

    // Keep messages thrown above (e.g. "not authenticated") instead of
    // replacing them with the generic fallback.
    const errorMessage =
      error.response?.data?.message ||
      (!axios.isAxiosError(error) && error?.message) ||
      "Something went wrong. Please try again.";

    throw new Error(errorMessage);
  }
}
