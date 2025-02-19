import React, { useState } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";

const Tab = createBottomTabNavigator();

// Format date function (e.g., "26 Jan 2025")
const formatAppliedDate = (dateString: string) => {
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? dateString
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const SalaryAdRoute = ({ status }: { status: string }) => {
  const [salaryData, setSalaryData] = useState([
    {
      id: 1,
      salarytype: "Advance Salary",
      applydate: "2023-10-01",
      amount: 5000,
      reason: "Medical emergency",
      status: "Pending",
    },
    {
      id: 2,
      salarytype: "Advance Salary",
      applydate: "2023-09-15",
      amount: 3000,
      reason: "Child education fees",
      status: "Approved",
    },
    {
      id: 3,
      salarytype: "Advance Salary",
      applydate: "2023-08-20",
      amount: 2000,
      reason: "Home repair",
      status: "Declined",
    },
    {
      id: 4,
      salarytype: "Advance Salary",
      applydate: "2023-10-01",
      amount: 5000,
      reason: "Medical emergency",
      status: "Pending",
    },
    {
      id: 5,
      salarytype: "Advance Salary",
      applydate: "2023-09-15",
      amount: 3000,
      reason: "Child education fees",
      status: "Approved",
    },
    {
      id: 6,
      salarytype: "Advance Salary",
      applydate: "2023-08-20",
      amount: 2000,
      reason: "Home repair",
      status: "Declined",
    },
    {
      id: 7,
      salarytype: "Advance Salary",
      applydate: "2023-10-01",
      amount: 5000,
      reason: "Medical emergency",
      status: "Pending",
    },
    {
      id: 8,
      salarytype: "Advance Salary",
      applydate: "2023-09-15",
      amount: 3000,
      reason: "Child education fees",
      status: "Approved",
    },
    {
      id: 9,
      salarytype: "Advance Salary",
      applydate: "2023-08-20",
      amount: 2000,
      reason: "Home repair",
      status: "Declined",
    },
  ]);

  const filteredData = salaryData.filter((item) => item.status === status);

  return filteredData.length === 0 ? (
    <Text style={styles.noDataText}>No salary advance records available</Text>
  ) : (
    <FlatList
      data={filteredData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.itemText}>• {item.salarytype}</Text>
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

export default function SalaryAdTabNavigator() {
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
        children={() => <SalaryAdRoute status="Pending" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="clock-o" color={color} size={25} />,
        }}
      />
      <Tab.Screen
        name="Approved"
        children={() => <SalaryAdRoute status="Approved" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="check" color={color} size={25} />,
        }}
      />
      <Tab.Screen
        name="Declined"
        children={() => <SalaryAdRoute status="Declined" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="times" color={color} size={25} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  noDataText: {
    textAlign: "center",
    color: "gray",
    fontSize: 16,
    marginTop: 20,
  },
  itemContainer: {
    padding: 15,
    marginVertical: 10,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itemText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
  },
  appliedDateText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  amountText: {
    fontSize: 12,
    marginBottom: 4,
    color: "#808080",
    fontWeight: "500",
  },
  reasonText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  contentContainer: {
    paddingBottom: 50,
    backgroundColor: "white",
    height: "100%",
  },
  loader: {
    marginTop: 20,
    alignSelf: "center",
  },
  errorText: {
    textAlign: "center",
    color: "#d9534f",
    fontSize: 18,
    fontWeight: "600",
    marginVertical: 20,
  },
});

// import React, { useEffect, useState } from "react";
// import {
//   FlatList,
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
// } from "react-native";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Icon from "react-native-vector-icons/FontAwesome";
// import { getSalaryHistory } from "../../Services/Salary/Salary.service";

// const Tab = createBottomTabNavigator();

// // Format date function (e.g., "26 Jan 2025")
// const formatAppliedDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return isNaN(date.getTime())
//     ? dateString
//     : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
// };

// const SalaryAdRoute = ({ status }: { status: string }) => {
//   const [salaryData, setSalaryData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchSalaryData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await getSalaryHistory();
//         if (response.status === 200) {
//           setSalaryData(response.data.data);
//         } else {
//           setError("Failed to fetch data");
//         }
//       } catch (error) {
//         setError("Error fetching data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchSalaryData();
//   }, [status]);

//   if (loading) {
//     return <ActivityIndicator size="large" color="#ff9f43" style={styles.loader} />;
//   }

//   if (error) {
//     return <Text style={styles.errorText}>{error}</Text>;
//   }

//   return salaryData.length === 0 ? (
//     <Text style={styles.noDataText}>No salary advance records available</Text>
//   ) : (
//     <FlatList
//       data={salaryData}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={({ item }) => (
//         <View style={styles.itemContainer}>
//           <View style={styles.headerRow}>
//             <Text style={styles.itemText}>• {item.salarytype}</Text>
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

// export default function SalaryAdTabNavigator() {
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
//         children={() => <SalaryAdRoute status="Pending" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="clock-o" color={color} size={25} />,
//         }}
//       />
//       <Tab.Screen
//         name="Approved"
//         children={() => <SalaryAdRoute status="Approved" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="check" color={color} size={25} />,
//         }}
//       />
//       <Tab.Screen
//         name="Declined"
//         children={() => <SalaryAdRoute status="Declined" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="times" color={color} size={25} />,
//         }}
//       />
//     </Tab.Navigator>
//   );
// }

// const styles = StyleSheet.create({
//   noDataText: {
//     textAlign: "center",
//     color: "gray",
//     fontSize: 16,
//     marginTop: 20,
//   },
//   itemContainer: {
//     padding: 15,
//     marginVertical: 10,
//     marginHorizontal: 8,
//     borderRadius: 12,
//     backgroundColor: "#fff",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 5,
//     borderWidth: 0.5,
//     borderColor: "#ccc",
//   },
//   headerRow: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 5,
//   },
//   itemText: {
//     fontSize: 13,
//     fontWeight: "600",
//     color: "#444",
//   },
//   appliedDateText: {
//     fontSize: 14,
//     fontWeight: "bold",
//   },
//   amountText: {
//     fontSize: 12,
//     marginBottom: 4,
//     color: "#808080",
//     fontWeight: "500",
//   },
//   reasonText: {
//     fontSize: 12,
//     color: "#666",
//     fontWeight: "500",
//   },
//   contentContainer: {
//     paddingBottom: 50,
//     backgroundColor: "white",
//     height: "100%",
//   },
//   loader: {
//     marginTop: 20,
//     alignSelf: "center",
//   },
//   errorText: {
//     textAlign: "center",
//     color: "#d9534f",
//     fontSize: 18,
//     fontWeight: "600",
//     marginVertical: 20,
//   },
// });
