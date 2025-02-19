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

const hardcodedLoanData = {
  Pending: [
    { id: 1, loantype: "Personal Loan", applydate: "2025-01-10", amount: 50000, reason: "Medical emergency" },
    { id: 2, loantype: "Car Loan", applydate: "2025-01-12", amount: 300000, reason: "Car purchase" },
    { id: 3, loantype: "Home Loan", applydate: "2025-01-15", amount: 2000000, reason: "New house purchase" },
    { id: 4, loantype: "Education Loan", applydate: "2025-01-18", amount: 800000, reason: "Higher studies" },
  ],
  Approved: [
    { id: 5, loantype: "Personal Loan", applydate: "2024-12-20", amount: 75000, reason: "Wedding expenses" },
    { id: 6, loantype: "Car Loan", applydate: "2024-12-25", amount: 400000, reason: "Car upgrade" },
    { id: 7, loantype: "Home Loan", applydate: "2024-12-30", amount: 2500000, reason: "House renovation" },
    { id: 8, loantype: "Education Loan", applydate: "2025-01-05", amount: 900000, reason: "MBA tuition" },
  ],
  Declined: [
    { id: 9, loantype: "Personal Loan", applydate: "2024-11-15", amount: 60000, reason: "Vacation trip" },
    { id: 10, loantype: "Car Loan", applydate: "2024-11-18", amount: 350000, reason: "Luxury car" },
    { id: 11, loantype: "Home Loan", applydate: "2024-11-22", amount: 1800000, reason: "Second home" },
    { id: 12, loantype: "Education Loan", applydate: "2024-11-25", amount: 700000, reason: "Study abroad" },
  ],
};

const LoanRoute = ({ loanType }) => {
  const loanData = hardcodedLoanData[loanType] || [];

  return loanData.length === 0 ? (
    <Text style={styles.noDataText}>No loan records available</Text>
  ) : (
    <FlatList
      data={loanData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.itemText}>• {item.loantype}</Text>
            <Text
              style={[
                styles.appliedDateText,
                loanType === "Pending" && { color: "#ff8600" },
                loanType === "Approved" && { color: "green" },
                loanType === "Declined" && { color: "red" },
              ]}
            >
              {formatAppliedDate(item.applydate)}
            </Text>
          </View>
          <Text style={styles.durationText}>Amount: ₹{item.amount}</Text>
          <Text style={styles.durationText}>Reason: {item.reason}</Text>
        </View>
      )}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

export default function LoanTabNavigator() {
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
        children={() => <LoanRoute loanType="Pending" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="clock-o" color={color} size={25} />,
        }}
      />
      <Tab.Screen
        name="Approved"
        children={() => <LoanRoute loanType="Approved" />}
        options={{
          headerShown: false,
          tabBarIcon: ({ color }) => <Icon name="check" color={color} size={25} />,
        }}
      />
      <Tab.Screen
        name="Declined"
        children={() => <LoanRoute loanType="Declined" />}
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
  durationText: {
    fontSize: 12,
    marginBottom: 4,
    color: "#808080",
    fontWeight: "500",
  },
  contentContainer: {
    paddingBottom: 50,
    backgroundColor: "white",
    height: "100%",
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
// import { getLoanHistory } from "../../Services/Loan/Loan.service";

// const Tab = createBottomTabNavigator();

// // Format date function (e.g., "26 Jan 2025")
// const formatAppliedDate = (dateString: string) => {
//   const date = new Date(dateString);
//   return isNaN(date.getTime())
//     ? dateString
//     : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
// };

// const LoanRoute = ({ loanType }: { loanType: string }) => {
//   const [loanData, setLoanData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchLoanData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await getLoanHistory(loanType);
//         if (response.status === 200) {
//           setLoanData(response.data.data);
//         } else {
//           setError("Failed to fetch data");
//         }
//       } catch (error) {
//         setError("Error fetching data");
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchLoanData();
//   }, [loanType]);

//   if (loading) {
//     return <ActivityIndicator size="large" color="#ff9f43" style={styles.loader} />;
//   }

//   if (error) {
//     return <Text style={styles.errorText}>{error}</Text>;
//   }

//   return loanData.length === 0 ? (
//     <Text style={styles.noDataText}>No loan records available</Text>
//   ) : (
//     <FlatList
//       data={loanData}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={({ item }) => (
//         <View style={styles.itemContainer}>
//           <View style={styles.headerRow}>
//             <Text style={styles.itemText}>• {item.loantype}</Text>
//             <Text
//               style={[
//                 styles.appliedDateText,
//                 loanType === "Pending" && { color: "#ff8600" },
//                 loanType === "Approved" && { color: "green" },
//                 loanType === "Declined" && { color: "red" },
//               ]}
//             >
//               {formatAppliedDate(item.applydate)}
//             </Text>
//           </View>
//           <Text style={styles.durationText}>Amount: ₹{item.amount}</Text>
//           <Text style={styles.durationText}>Reason: {item.reason}</Text>
//         </View>
//       )}
//       contentContainerStyle={styles.contentContainer}
//     />
//   );
// };

// export default function LoanTabNavigator() {
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
//         children={() => <LoanRoute loanType="Pending" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="clock-o" color={color} size={25} />,
//         }}
//       />
//       <Tab.Screen
//         name="Approved"
//         children={() => <LoanRoute loanType="Approved" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color }) => <Icon name="check" color={color} size={25} />,
//         }}
//       />
//       <Tab.Screen
//         name="Declined"
//         children={() => <LoanRoute loanType="Declined" />}
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
//   durationText: {
//     fontSize: 12,
//     marginBottom: 4,
//     color: "#808080",
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
