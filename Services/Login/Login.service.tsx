import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

class LoginServices {
  async LoginApi(post: any, dispatch: any) {
    try {
      const response = await axios.post(`${baseUrl}/api/v1/auth/login`, post, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.status === 200) {
        // Don't log response.data: it contains the access token.
        const { accessToken, user } = response.data.data;

        await AsyncStorage.setItem("accessToken", accessToken);
        await AsyncStorage.setItem("user", JSON.stringify(user));
        await AsyncStorage.setItem("userId", JSON.stringify(user.id));

        await AsyncStorage.setItem("employeeCode", String(user.employeecode));

        await dispatch({ type: "userDetails", payload: response.data.data });

        if (user.manager) {
          dispatch({ type: "managerInfo", payload: user.manager });
          const managerDetails = user.manager;
          await AsyncStorage.setItem(
            "managerDetails",
            JSON.stringify(managerDetails)
          );
        }

        return response.data;
      } else {
        throw new Error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      // Log only status + message: the raw axios error includes the request
      // body, i.e. the user's plain-text password.
      console.error(
        "Error during login:",
        error?.response?.status ?? "",
        error?.message
      );
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else {
        throw new Error("Something went wrong. Please try again.");
      }
    }
  }
}

export const loginservice = new LoginServices();
