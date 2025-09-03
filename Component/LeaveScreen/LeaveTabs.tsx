import React, { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Easing,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome";
import { leaveHistoryPending } from "../../Services/Leave/Leave.service";

const { width } = Dimensions.get('window');
const Tab = createBottomTabNavigator();

// Format ISO date strings to a readable format
const formatDate = (dateString) => {
  if (!dateString) return "Invalid Date";
  
  try {
    // Parse ISO date string
    const date = new Date(dateString);
    
    if (isNaN(date.getTime())) return dateString;
    
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ];
    
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month}, ${year}`;
  } catch (error) {
    console.error("Date formatting error:", error);
    return dateString;
  }
};

const LeaveRoute = ({ leaveType, navigation }) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  const fetchLeaveData = async (isRefreshing = false) => {
    try {
      if (!isRefreshing) setLoading(true);
      setError(null);
      const response = await leaveHistoryPending(leaveType);
      if (response.status === 200) {
        setLeaveData(response.data.data);
      } else {
        setError("Failed to fetch data");
      }
    } catch (error) {
      setError("Error fetching data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLeaveData(true);
  }, []);

  useEffect(() => {
    fetchLeaveData();
  }, [leaveType]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, []);

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#002957" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={48} color="#dc3545" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={() => fetchLeaveData()}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return leaveData.length === 0 ? (
    <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
      <Icon name="inbox" size={64} color="#dee2e6" />
      <Text style={styles.emptyText}>No leave records available</Text>
    </Animated.View>
  ) : (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <FlatList
        data={leaveData}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.itemContainer}>
            <View style={styles.itemHeader}>
              <View style={[
                styles.statusIndicator,
                leaveType === "Pending" && styles.pendingIndicator,
                leaveType === "Approve" && styles.approvedIndicator,
                leaveType === "Decline" && styles.rejectedIndicator,
              ]} />
              <View style={styles.headerContent}>
                <Text style={styles.leaveTypeText}>{item.leavetype}</Text>
                <Text
                  style={[
                    styles.appliedDateText,
                    leaveType === "Pending" && { color: "#ff8600" },
                    leaveType === "Approve" && { color: "#28a745" },
                    leaveType === "Decline" && { color: "#dc3545" },
                  ]}
                >
                  Applied on {formatDate(item.applydate)}
                </Text>
              </View>
            </View>
            
            <View style={styles.dateRangeContainer}>
              <Icon name="calendar" size={14} color="#6c757d" />
              <Text style={styles.dateRangeText}>
                {formatDate(item.leavestart)} to {formatDate(item.leaveend)}
              </Text>
            </View>
            
            <View style={styles.detailsContainer}>
              <View style={styles.detailRow}>
                <Icon name="clock-o" size={14} color="#6c757d" />
                <Text style={styles.detailText}>{item.leavepart}</Text>
              </View>
              
              <View style={[styles.statusBadge, 
                leaveType === "Pending" && styles.pendingBadge,
                leaveType === "Approve" && styles.approvedBadge,
                leaveType === "Decline" && styles.rejectedBadge,
              ]}>
                <Text style={[
                  styles.statusText,
                  leaveType === "Pending" && styles.pendingText,
                  leaveType === "Approve" && styles.approvedText,
                  leaveType === "Decline" && styles.rejectedText,
                ]}>
                  {item.leavestatus || "Pending"}
                </Text>
              </View>
            </View>
            
            <View style={styles.reasonContainer}>
              <Icon name="comment" size={14} color="#6c757d" />
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>
          </View>
        )}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#002957"]}
            tintColor="#002957"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

// Header component with close button
const LeaveHistoryHeader = ({ navigation }) => {
  return (
    <View style={styles.headerContainer}>
      <Text style={styles.headerTitle}>Leave History</Text>
      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation.goBack()}
      >
        <Icon name="times" size={24} color="#002957" />
      </TouchableOpacity>
    </View>
  );
};

export default function LeaveTabNavigator({ navigation }) {
  return (
    <View style={styles.container}>
      <LeaveHistoryHeader navigation={navigation} />
      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: "#ffffff",
            height: 60,
            borderTopWidth: 1,
            borderTopColor: "#e9ecef",
            elevation: 8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          },
          tabBarActiveTintColor: "#002957",
          tabBarInactiveTintColor: "#6c757d",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "500",
          },
        }}
      >
        <Tab.Screen
          name="Pending"
          children={() => <LeaveRoute leaveType="Pending" navigation={navigation} />}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <View style={styles.tabIconContainer}>
                <Icon name="clock-o" color={color} size={size} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Approved"
          children={() => <LeaveRoute leaveType="Approve" navigation={navigation} />}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <View style={styles.tabIconContainer}>
                <Icon name="check" color={color} size={size} />
              </View>
            ),
          }}
        />
        <Tab.Screen
          name="Declined"
          children={() => <LeaveRoute leaveType="Decline" navigation={navigation} />}
          options={{
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <View style={styles.tabIconContainer}>
                <Icon name="times" color={color} size={size} />
              </View>
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#002957",
  },
  closeButton: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: "#dc3545",
    marginTop: 16,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#002957",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#6c757d",
    marginTop: 16,
  },
  itemContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  pendingIndicator: {
    backgroundColor: "#ffc107",
  },
  approvedIndicator: {
    backgroundColor: "#28a745",
  },
  rejectedIndicator: {
    backgroundColor: "#dc3545",
  },
  headerContent: {
    flex: 1,
  },
  leaveTypeText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#002957",
    marginBottom: 2,
  },
  appliedDateText: {
    fontSize: 14,
    fontWeight: "500",
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    // marginBottom: 6,
  },
  dateRangeText: {
    fontSize: 14,
    color: "#495057",
    marginLeft: 8,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    // marginBottom: 6,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: "#fff3cd",
  },
  approvedBadge: {
    backgroundColor: "#d4edda",
  },
  rejectedBadge: {
    backgroundColor: "#f8d7da",
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  pendingText: {
    color: "#856404",
  },
  approvedText: {
    color: "#155724",
  },
  rejectedText: {
    color: "#721c24",
  },
  reasonContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  reasonText: {
    fontSize: 14,
    color: "#6c757d",
    marginLeft: 8,
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
});

// import React, { useEffect, useState, useCallback } from "react";
// import {
//   FlatList,
//   View,
//   Text,
//   StyleSheet,
//   ActivityIndicator,
//   RefreshControl,
//   Animated,
//   Easing,
// } from "react-native";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Icon from "react-native-vector-icons/FontAwesome";
// import { leaveHistoryPending } from "../../Services/Leave/Leave.service";

// const Tab = createBottomTabNavigator();

// // Format ISO date strings to a readable format
// const formatDate = (dateString) => {
//   if (!dateString) return "Invalid Date";
  
//   try {
//     // Parse ISO date string
//     const date = new Date(dateString);
    
//     if (isNaN(date.getTime())) return dateString;
    
//     const months = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
//     ];
    
//     const day = date.getDate();
//     const month = months[date.getMonth()];
//     const year = date.getFullYear();
    
//     return `${day} ${month}, ${year}`;
//   } catch (error) {
//     console.error("Date formatting error:", error);
//     return dateString;
//   }
// };

// const LeaveRoute = ({ leaveType }) => {
//   const [leaveData, setLeaveData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [fadeAnim] = useState(new Animated.Value(0));

//   const fetchLeaveData = async (isRefreshing = false) => {
//     try {
//       if (!isRefreshing) setLoading(true);
//       setError(null);
//       const response = await leaveHistoryPending(leaveType);
//       if (response.status === 200) {
//         setLeaveData(response.data.data);
//       } else {
//         setError("Failed to fetch data");
//       }
//     } catch (error) {
//       setError("Error fetching data");
//     } finally {
//       setLoading(false);
//       setRefreshing(false);
//     }
//   };

//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchLeaveData(true);
//   }, []);

//   useEffect(() => {
//     fetchLeaveData();
//   }, [leaveType]);

//   useEffect(() => {
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 600,
//       easing: Easing.out(Easing.ease),
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   if (loading && !refreshing) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#002957" />
//       </View>
//     );
//   }

//   if (error) {
//     return (
//       <View style={styles.errorContainer}>
//         <Icon name="exclamation-triangle" size={48} color="#dc3545" />
//         <Text style={styles.errorText}>{error}</Text>
//         <TouchableOpacity 
//           style={styles.retryButton}
//           onPress={() => fetchLeaveData()}
//         >
//           <Text style={styles.retryButtonText}>Try Again</Text>
//         </TouchableOpacity>
//       </View>
//     );
//   }

//   return leaveData.length === 0 ? (
//     <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
//       <Icon name="inbox" size={64} color="#dee2e6" />
//       <Text style={styles.emptyText}>No leave records available</Text>
//     </Animated.View>
//   ) : (
//     <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
//       <FlatList
//         data={leaveData}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={({ item }) => (
//           <View style={styles.itemContainer}>
//             <View style={styles.itemHeader}>
//               <View style={[
//                 styles.statusIndicator,
//                 leaveType === "Pending" && styles.pendingIndicator,
//                 leaveType === "Approve" && styles.approvedIndicator,
//                 leaveType === "Decline" && styles.rejectedIndicator,
//               ]} />
//               <View style={styles.headerContent}>
//                 <Text style={styles.leaveTypeText}>{item.leavetype}</Text>
//                 <Text
//                   style={[
//                     styles.appliedDateText,
//                     leaveType === "Pending" && { color: "#ff8600" },
//                     leaveType === "Approve" && { color: "#28a745" },
//                     leaveType === "Decline" && { color: "#dc3545" },
//                   ]}
//                 >
//                   Applied on {formatDate(item.applydate)}
//                 </Text>
//               </View>
//             </View>
            
//             <View style={styles.dateRangeContainer}>
//               <Icon name="calendar" size={14} color="#6c757d" />
//               <Text style={styles.dateRangeText}>
//                 {formatDate(item.leavestart)} to {formatDate(item.leaveend)}
//               </Text>
//             </View>
            
//             <View style={styles.detailsContainer}>
//               <View style={styles.detailRow}>
//                 <Icon name="clock-o" size={14} color="#6c757d" />
//                 <Text style={styles.detailText}>{item.leavepart}</Text>
//               </View>
              
//               <View style={[styles.statusBadge, 
//                 leaveType === "Pending" && styles.pendingBadge,
//                 leaveType === "Approve" && styles.approvedBadge,
//                 leaveType === "Decline" && styles.rejectedBadge,
//               ]}>
//                 <Text style={[
//                   styles.statusText,
//                   leaveType === "Pending" && styles.pendingText,
//                   leaveType === "Approve" && styles.approvedText,
//                   leaveType === "Decline" && styles.rejectedText,
//                 ]}>
//                   {item.leavestatus || "Pending"}
//                 </Text>
//               </View>
//             </View>
            
//             <View style={styles.reasonContainer}>
//               <Icon name="comment" size={14} color="#6c757d" />
//               <Text style={styles.reasonText}>{item.reason}</Text>
//             </View>
//           </View>
//         )}
//         contentContainerStyle={styles.contentContainer}
//         refreshControl={
//           <RefreshControl
//             refreshing={refreshing}
//             onRefresh={onRefresh}
//             colors={["#002957"]}
//             tintColor="#002957"
//           />
//         }
//         showsVerticalScrollIndicator={false}
//       />
//     </Animated.View>
//   );
// };

// export default function LeaveTabNavigator() {
//   return (
//     <Tab.Navigator
//       screenOptions={{
//         tabBarStyle: {
//           backgroundColor: "#ffffff",
//           height: 70,
//           paddingBottom: 10,
//           borderTopWidth: 1,
//           borderTopColor: "#e9ecef",
//           elevation: 8,
//           shadowColor: "#000",
//           shadowOffset: { width: 0, height: -2 },
//           shadowOpacity: 0.1,
//           shadowRadius: 4,
//         },
//         tabBarActiveTintColor: "#002957",
//         tabBarInactiveTintColor: "#6c757d",
//         tabBarLabelStyle: {
//           fontSize: 12,
//           fontWeight: "500",
//         },
//       }}
//     >
//       <Tab.Screen
//         name="Pending"
//         children={() => <LeaveRoute leaveType="Pending" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size }) => (
//             <View style={styles.tabIconContainer}>
//               <Icon name="clock-o" color={color} size={size} />
//             </View>
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Approved"
//         children={() => <LeaveRoute leaveType="Approve" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size }) => (
//             <View style={styles.tabIconContainer}>
//               <Icon name="check" color={color} size={size} />
//             </View>
//           ),
//         }}
//       />
//       <Tab.Screen
//         name="Declined"
//         children={() => <LeaveRoute leaveType="Decline" />}
//         options={{
//           headerShown: false,
//           tabBarIcon: ({ color, size }) => (
//             <View style={styles.tabIconContainer}>
//               <Icon name="times" color={color} size={size} />
//             </View>
//           ),
//         }}
//       />
//     </Tab.Navigator>
//   );
// }

// const styles = StyleSheet.create({
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//   },
//   errorContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 20,
//   },
//   errorText: {
//     fontSize: 16,
//     color: "#dc3545",
//     marginTop: 16,
//     marginBottom: 20,
//     textAlign: "center",
//   },
//   retryButton: {
//     backgroundColor: "#002957",
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     borderRadius: 8,
//   },
//   retryButtonText: {
//     color: "#fff",
//     fontWeight: "600",
//   },
//   emptyContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 40,
//   },
//   emptyText: {
//     fontSize: 16,
//     color: "#6c757d",
//     marginTop: 16,
//   },
//   itemContainer: {
//     backgroundColor: "#ffffff",
//     borderRadius: 16,
//     padding: 16,
//     marginVertical: 8,
//     marginHorizontal: 16,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 8,
//     elevation: 3,
//   },
//   itemHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   statusIndicator: {
//     width: 8,
//     height: 8,
//     borderRadius: 4,
//     marginRight: 12,
//   },
//   pendingIndicator: {
//     backgroundColor: "#ffc107",
//   },
//   approvedIndicator: {
//     backgroundColor: "#28a745",
//   },
//   rejectedIndicator: {
//     backgroundColor: "#dc3545",
//   },
//   headerContent: {
//     flex: 1,
//   },
//   leaveTypeText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "#002957",
//     marginBottom: 4,
//   },
//   appliedDateText: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   dateRangeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   dateRangeText: {
//     fontSize: 14,
//     color: "#495057",
//     marginLeft: 8,
//   },
//   detailsContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     marginBottom: 12,
//   },
//   detailRow: {
//     flexDirection: "row",
//     alignItems: "center",
//   },
//   detailText: {
//     fontSize: 14,
//     color: "#6c757d",
//     marginLeft: 6,
//   },
//   statusBadge: {
//     paddingHorizontal: 12,
//     paddingVertical: 6,
//     borderRadius: 20,
//   },
//   pendingBadge: {
//     backgroundColor: "#fff3cd",
//   },
//   approvedBadge: {
//     backgroundColor: "#d4edda",
//   },
//   rejectedBadge: {
//     backgroundColor: "#f8d7da",
//   },
//   statusText: {
//     fontSize: 12,
//     fontWeight: "600",
//   },
//   pendingText: {
//     color: "#856404",
//   },
//   approvedText: {
//     color: "#155724",
//   },
//   rejectedText: {
//     color: "#721c24",
//   },
//   reasonContainer: {
//     flexDirection: "row",
//     alignItems: "flex-start",
//   },
//   reasonText: {
//     fontSize: 14,
//     color: "#6c757d",
//     marginLeft: 8,
//     flex: 1,
//   },
//   contentContainer: {
//     paddingBottom: 20,
//   },
//   tabIconContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//   },
// });

// // import React, { useEffect, useState } from "react";
// // import {
// //   FlatList,
// //   View,
// //   Text,
// //   StyleSheet,
// //   ActivityIndicator,
// //   Animated,
// //   Easing,
// // } from "react-native";
// // import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// // import Icon from "react-native-vector-icons/FontAwesome";
// // import { leaveHistoryPending } from "../../Services/Leave/Leave.service";

// // const Tab = createBottomTabNavigator();

// // // Format only the applied date to "26 Jan 2025"
// // const formatAppliedDate = (dateString) => {
// //   const date = new Date(dateString);
// //   // If the date is invalid, return the original string
// //   if (isNaN(date.getTime())) return dateString;
// //   const options = {
// //     day: "numeric" as const,
// //     month: "short" as const,
// //     year: "numeric" as const,
// //   };
// //   return date.toLocaleDateString("en-GB", options);
// // };

// // const LeaveRoute = ({ leaveType }) => {
// //   const [leaveData, setLeaveData] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const [error, setError] = useState(null);
// //   const [fadeAnim] = useState(new Animated.Value(0));

// //   useEffect(() => {
// //     const fetchLeaveData = async () => {
// //       try {
// //         setLoading(true);
// //         setError(null);
// //         const response = await leaveHistoryPending(leaveType);
// //         if (response.status === 200) {
// //           setLeaveData(response.data.data);
// //         } else {
// //           setError("Failed to fetch data");
// //         }
// //       } catch (error) {
// //         setError("Error fetching data");
// //       } finally {
// //         setLoading(false);
// //       }
// //     };
// //     fetchLeaveData();
// //   }, [leaveType]);

// //   useEffect(() => {
// //     Animated.timing(fadeAnim, {
// //       toValue: 1,
// //       duration: 600,
// //       easing: Easing.out(Easing.ease),
// //       useNativeDriver: true,
// //     }).start();
// //   }, []);

// //   if (loading) {
// //     return (
// //       <View style={styles.loaderContainer}>
// //         <ActivityIndicator size="large" color="#002957" />
// //       </View>
// //     );
// //   }

// //   if (error) {
// //     return <Text style={styles.errorText}>{error}</Text>;
// //   }

// //   return leaveData.length === 0 ? (
// //     <Animated.View style={[styles.emptyContainer, { opacity: fadeAnim }]}>
// //       <Icon name="inbox" size={64} color="#dee2e6" />
// //       <Text style={styles.emptyText}>No leave records available</Text>
// //     </Animated.View>
// //   ) : (
// //     <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
// //       <FlatList
// //         data={leaveData}
// //         keyExtractor={(item) => item.id.toString()}
// //         renderItem={({ item }) => (
// //           <View style={styles.itemContainer}>
// //             <View style={styles.itemHeader}>
// //               <View style={styles.leaveTypeBadge}>
// //                 <Text style={styles.leaveTypeText}>{item.leavetype}</Text>
// //               </View>
// //               <Text
// //                 style={[
// //                   styles.appliedDateText,
// //                   leaveType === "Pending" && { color: "#ff8600" },
// //                   leaveType === "Approve" && { color: "#28a745" },
// //                   leaveType === "Decline" && { color: "#dc3545" },
// //                 ]}
// //               >
// //                 {formatAppliedDate(item.applydate)}
// //               </Text>
// //             </View>
            
// //             <View style={styles.dateRange}>
// //               <Icon name="calendar" size={14} color="#6c757d" />
// //               <Text style={styles.dateRangeText}>
// //                 {item.leavestart} to {item.leaveend}
// //               </Text>
// //             </View>
            
// //             <View style={styles.reasonContainer}>
// //               <Icon name="comment" size={14} color="#6c757d" />
// //               <Text style={styles.reasonText}>{item.reason}</Text>
// //             </View>
            
// //             <View style={[
// //               styles.statusContainer,
// //               leaveType === "Pending" && { backgroundColor: "#fff3cd" },
// //               leaveType === "Approve" && { backgroundColor: "#d4edda" },
// //               leaveType === "Decline" && { backgroundColor: "#f8d7da" },
// //             ]}>
// //               <Text style={[
// //                 styles.statusText,
// //                 leaveType === "Pending" && { color: "#856404" },
// //                 leaveType === "Approve" && { color: "#155724" },
// //                 leaveType === "Decline" && { color: "#721c24" },
// //               ]}>
// //                 {item.status || "Pending"}
// //               </Text>
// //             </View>
// //           </View>
// //         )}
// //         contentContainerStyle={styles.contentContainer}
// //       />
// //     </Animated.View>
// //   );
// // };

// // export default function LeaveTabNavigator() {
// //   return (
// //     <Tab.Navigator
// //       screenOptions={{
// //         tabBarStyle: {
// //           backgroundColor: "#002957",
// //           height: 70,
// //           paddingBottom: 10,
// //         },
// //         tabBarActiveTintColor: "#ffd700",
// //         tabBarInactiveTintColor: "#fff",
// //         tabBarLabelStyle: {
// //           fontSize: 12,
// //           fontWeight: "500",
// //         },
// //       }}
// //     >
// //       <Tab.Screen
// //         name="Pending"
// //         children={() => <LeaveRoute leaveType="Pending" />}
// //         options={{
// //           headerShown: false,
// //           tabBarIcon: ({ color, size }) => (
// //             <Icon name="clock-o" color={color} size={size} />
// //           ),
// //           tabBarBadgeStyle: { backgroundColor: "#ffd700", color: "#002957" },
// //         }}
// //       />
// //       <Tab.Screen
// //         name="Approved"
// //         children={() => <LeaveRoute leaveType="Approve" />}
// //         options={{
// //           headerShown: false,
// //           tabBarIcon: ({ color, size }) => (
// //             <Icon name="check" color={color} size={size} />
// //           ),
// //         }}
// //       />
// //       <Tab.Screen
// //         name="Declined"
// //         children={() => <LeaveRoute leaveType="Decline" />}
// //         options={{
// //           headerShown: false,
// //           tabBarIcon: ({ color, size }) => (
// //             <Icon name="times" color={color} size={size} />
// //           ),
// //         }}
// //       />
// //     </Tab.Navigator>
// //   );
// // }

// // const styles = StyleSheet.create({
// //   emptyContainer: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //     padding: 40,
// //   },
// //   emptyText: {
// //     fontSize: 16,
// //     color: "#6c757d",
// //     marginTop: 16,
// //   },
// //   itemContainer: {
// //     backgroundColor: "#fff",
// //     borderRadius: 16,
// //     padding: 16,
// //     marginVertical: 8,
// //     marginHorizontal: 16,
// //     shadowColor: "#000",
// //     shadowOffset: { width: 0, height: 2 },
// //     shadowOpacity: 0.1,
// //     shadowRadius: 8,
// //     elevation: 3,
// //   },
// //   itemHeader: {
// //     flexDirection: "row",
// //     justifyContent: "space-between",
// //     alignItems: "center",
// //     marginBottom: 12,
// //   },
// //   leaveTypeBadge: {
// //     backgroundColor: "#e9f0f7",
// //     paddingHorizontal: 12,
// //     paddingVertical: 6,
// //     borderRadius: 16,
// //   },
// //   leaveTypeText: {
// //     fontSize: 14,
// //     fontWeight: "600",
// //     color: "#002957",
// //   },
// //   appliedDateText: {
// //     fontSize: 14,
// //     fontWeight: "600",
// //   },
// //   dateRange: {
// //     flexDirection: "row",
// //     alignItems: "center",
// //     marginBottom: 8,
// //   },
// //   dateRangeText: {
// //     fontSize: 14,
// //     color: "#495057",
// //     marginLeft: 8,
// //   },
// //   reasonContainer: {
// //     flexDirection: "row",
// //     alignItems: "flex-start",
// //     marginBottom: 12,
// //   },
// //   reasonText: {
// //     fontSize: 14,
// //     color: "#6c757d",
// //     marginLeft: 8,
// //     flex: 1,
// //   },
// //   statusContainer: {
// //     alignSelf: "flex-start",
// //     paddingHorizontal: 12,
// //     paddingVertical: 6,
// //     borderRadius: 16,
// //   },
// //   statusText: {
// //     fontSize: 12,
// //     fontWeight: "600",
// //   },
// //   contentContainer: {
// //     paddingBottom: 20,
// //   },
// //   loaderContainer: {
// //     flex: 1,
// //     justifyContent: "center",
// //     alignItems: "center",
// //   },
// //   errorText: {
// //     textAlign: "center",
// //     color: "#dc3545",
// //     fontSize: 16,
// //     fontWeight: "600",
// //     marginVertical: 20,
// //   },
// // });
