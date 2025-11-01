import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { baseUrl } from "../../Global/Config";

// const baseUrl = "http://103.41.100.83:8000";

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



    async LeaveStatusUpdate(id: number, status: string) {
      try {
        // Retrieve the token from AsyncStorage
        const token = await AsyncStorage.getItem("accessToken");
        if (!token) {
          throw new Error("No access token found. Please log in again.");
        }
    
        // Construct the URL dynamically
        const url = `${baseUrl}/api/v1/leaves/update/status?id=${id}`;
    
        // Define the payload
        const payload = {
          leavestatus: status
        };
    
        // Make the API call with headers and payload
        const response = await axios.patch(
          url,
          payload, // Sending the payload here
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
    
        console.log("Leave Request Response:", response.data);
        return response.data; // Return the response data
      } catch (error: any) {
        console.error("Error during fetching leave requests:", error);
    
        // Handle error message safely
        const message =
          error.response?.data?.message || "Something went wrong. Please try again.";
        throw new Error(message);
      }
    }
    
    
  }
  
  export const managerLeaveRequestClass = new ManagerLeaveRequest();
  
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import axios from "axios";
// import { baseUrl } from "../../Global/Config";

// class ManagerLeaveRequest {
//     async LeaveRequestGet(id: Number) {
//       try {
//         const token = await AsyncStorage.getItem("accessToken");
//         if (!token) {
//           throw new Error("No access token found. Please log in again.");
//         }
  
//         const url = `${baseUrl}/api/v1/leaves/requests?approver=${id}`;
  
//         const response = await axios.get(url, {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             "Content-Type": "application/json",
//           },
//         });
  
//         console.log("Leave Request Response:", response.data);
//         return response.data;
//       } catch (error: any) {
//         console.error("Error during fetching leave requests:", error);
        
//         const message =
//           error.response?.data?.message || "Something went wrong. Please try again.";
//         throw new Error(message);
//       }
//     }



//     async LeaveStatusUpdate(id: number, status: string) {
//       try {
//         // Retrieve the token from AsyncStorage
//         const token = await AsyncStorage.getItem("accessToken");
//         if (!token) {
//           throw new Error("No access token found. Please log in again.");
//         }
    
//         // Construct the URL dynamically
//         const url = `${baseUrl}/api/v1/leaves/update/status?id=${id}`;
    
//         // Define the payload
//         const payload = {
//           leavestatus: status
//         };
    
//         // Make the API call with headers and payload
//         const response = await axios.patch(
//           url,
//           payload, // Sending the payload here
//           {
//             headers: {
//               Authorization: `Bearer ${token}`,
//               "Content-Type": "application/json",
//             },
//           }
//         );
    
//         console.log("Leave Request Response:", response.data);
//         return response.data; // Return the response data
//       } catch (error: any) {
//         console.error("Error during fetching leave requests:", error);
    
//         // Handle error message safely
//         const message =
//           error.response?.data?.message || "Something went wrong. Please try again.";
//         throw new Error(message);
//       }
//     }
    
    
//   }
  
//   export const managerLeaveRequestClass = new ManagerLeaveRequest();
  
