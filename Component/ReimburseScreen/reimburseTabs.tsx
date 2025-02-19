import React, { useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";

const Tab = createBottomTabNavigator();

const formatAppliedDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const hardcodedReimbursementData = {
  Pending: [
    { id: 1, category: "Travel", applydate: "2025-01-10", amount: 1500, reason: "Client visit" },
    { id: 2, category: "Food", applydate: "2025-01-15", amount: 500, reason: "Lunch meeting" },
  ],
  Approved: [
    { id: 3, category: "Accommodation", applydate: "2025-01-05", amount: 5000, reason: "Conference stay" },
    { id: 4, category: "Transport", applydate: "2025-01-08", amount: 1200, reason: "Taxi fare" },
  ],
  Declined: [
    { id: 5, category: "Miscellaneous", applydate: "2025-01-12", amount: 800, reason: "Personal expense" },
  ],
};

const ReimbursementRoute = ({ status }) => {
  const reimbursementData = hardcodedReimbursementData[status] || [];

  return reimbursementData.length === 0 ? (
    <Text style={styles.noDataText}>No reimbursement records available</Text>
  ) : (
    <FlatList
      data={reimbursementData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.itemText}>• {item.category}</Text>
            <Text
              style={[
                styles.appliedDateText,
                status === "Pending" && { color: "#ff8600" },
                status === "Approved" && { color: "green" },
                status === "Declined" && { color: "red" },
              ]}
            >
              {formatAppliedDate(item.applydate)}
            </Text>
          </View>
          <Text style={styles.amountText}>Amount: ₹{item.amount}</Text>
          <Text style={styles.reasonText}>Reason: {item.reason}</Text>
        </View>
      )}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

export default function ReimbursementTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "rgb(0, 41, 87)",
          height: 66,
          paddingBottom: 8,
          position: "absolute",
        },
        tabBarActiveTintColor: "#ff9f43",
        tabBarInactiveTintColor: "#fff",
      }}
    >
      <Tab.Screen
        name="Pending"
        children={() => <ReimbursementRoute status="Pending" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="clock-o" color={color} size={25} />,
        }}
      />
      <Tab.Screen
        name="Approved"
        children={() => <ReimbursementRoute status="Approved" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="check" color={color} size={25} />,
        }}
      />
      <Tab.Screen
        name="Declined"
        children={() => <ReimbursementRoute status="Declined" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="times" color={color} size={25} />,
        }}
      />
    </Tab.Navigator>
  );
}

export const styles = StyleSheet.create({
  noDataText: {
    textAlign: "center",
    marginTop: 20,
    fontSize: 16,
    color: "#555",
  },
  contentContainer: {
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  itemText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  appliedDateText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007bff",
    marginTop: 4,
  },
  reasonText: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
});


// import React, { useEffect, useState } from "react";
// import {
//   FlatList,
//   View,
//   Text,
//   ActivityIndicator,
//   StyleSheet,
// } from "react-native";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Icon from "react-native-vector-icons/FontAwesome";
// import { getReimbursementHistory } from "../../Services/Reimburse/Reimburse.service";

// const Tab = createBottomTabNavigator();

// // Format date function (e.g., "26 Jan 2025")
// const formatAppliedDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return isNaN(date.getTime())
//     ? dateString
//     : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
// };

// const ReimbursementRoute = ({ status }: { status: string }) => {
//   const [reimbursementData, setReimbursementData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchReimbursementData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await getReimbursementHistory(status);
//         if (response.status === 200) {
//           setReimbursementData(response.data.data);
//         } else {
//           setError("Failed to fetch data");
//         }
//       } catch (error) {
//         setError("Error fetching data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchReimbursementData();
//   }, [status]);

//   if (loading) {
//     return <ActivityIndicator size="large" color="#ff9f43" style={styles.loader} />;
//   }

//   if (error) {
//     return <Text style={styles.errorText}>{error}</Text>;
//   }

//   return reimbursementData.length === 0 ? (
//     <Text style={styles.noDataText}>No reimbursement records available</Text>
//   ) : (
//     <FlatList
//       data={reimbursementData}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={({ item }) => (
//         <View style={styles.itemContainer}>
//           <View style={styles.headerRow}>
//             <Text style={styles.itemText}>• {item.category}</Text>
//             <Text
//               style={[
//                 styles.appliedDateText,
//                 status === "Pending" && { color: "#ff8600" },
//                 status === "Approved" && { color: "green" },
//                 status === "Declined" && { color: "red" },
//               ]}
//             >
//               {formatAppliedDate(item.applydate)}
//             </Text>
//           </View>
//           <Text style={styles.amountText}>Amount: ₹{item.amount}</Text>
//           <Text style={styles.reasonText}>Reason: {item.reason}</Text>
//         </View>
//       )}
//       contentContainerStyle={styles.contentContainer}
//     />
//   );
// };

// export default function ReimbursementTabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarStyle: {
//           backgroundColor: "rgb(0, 41, 87)",
//           height: 66,
//           paddingBottom: 8,
//           position: "absolute",
//         },
//         tabBarActiveTintColor: "#ff9f43",
//         tabBarInactiveTintColor: "#fff",
//       }}
//     >
//       <Tab.Screen
//         name="Pending"
//         children={() => <ReimbursementRoute status="Pending" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="clock-o" color={color} size={25} />,
//         }}
//       />
//       <Tab.Screen
//         name="Approved"
//         children={() => <ReimbursementRoute status="Approved" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="check" color={color} size={25} />,
//         }}
//       />
//       <Tab.Screen
//         name="Declined"
//         children={() => <ReimbursementRoute status="Declined" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="times" color={color} size={25} />,
//         }}
//       />
//     </Tab.Navigator>
//   );
// }


// export const styles = StyleSheet.create({
//   loader: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   errorText: {
//     color: "red",
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//   },
//   noDataText: {
//     textAlign: "center",
//     marginTop: 20,
//     fontSize: 16,
//     color: "#555",
//   },
//   contentContainer: {
//     paddingBottom: 20,
//   },
//   itemContainer: {
//     backgroundColor: "#f9f9f9",
//     padding: 12,
//     borderRadius: 8,
//     marginVertical: 8,
//     marginHorizontal: 16,
//     elevation: 2,
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//   },
//   itemText: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#333",
//   },
//   appliedDateText: {
//     fontSize: 14,
//     fontWeight: "bold",
//   },
//   amountText: {
//     fontSize: 14,
//     fontWeight: "bold",
//     color: "#007bff",
//     marginTop: 4,
//   },
//   reasonText: {
//     fontSize: 14,
//     color: "#555",
//     marginTop: 4,
//   },
// });

