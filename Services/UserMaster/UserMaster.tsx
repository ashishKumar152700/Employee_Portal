import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

// Fetch Users
export const getUser = async () => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const { data, status } = await axios.get(`${baseUrl}/api/v1/user/get`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (status === 200) {
      console.log("[getUser] Fetch successful:", data.data);
      return data;
    } else {
      throw new Error(data?.message || "Failed to fetch user details.");
    }
  } catch (error: any) {
    console.error("[getUser] Error occurred:", error);
    throw new Error(error.response?.data?.message || "An error occurred while fetching user details.");
  } finally {
    console.log("[getUser] API call completed.");
  }
};

// Delete User
export const deleteUserApi = async (userId: number) => {
  try {
    const token = await AsyncStorage.getItem("accessToken");

    if (!token) {
      throw new Error("No access token found. Please log in again.");
    }

    const { status } = await axios.delete(`${baseUrl}/api/v1/user/delete/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (status === 200) {
      console.log(`[deleteUserApi] User with ID ${userId} deleted successfully.`);
      return true;
    } else {
      throw new Error("Failed to delete user.");
    }
  } catch (error: any) {
    console.error(`[deleteUserApi] Error occurred:`, error);
    throw new Error(error.response?.data?.message || "An error occurred while deleting user.");
  } finally {
    console.log("[deleteUserApi] API call completed.");
  }
};
