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

const { width } = Dimensions.get("window");
const Tab = createBottomTabNavigator();

const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    } catch {
        return dateString;
    }
};

const LeaveRoute = ({ leaveType, navigation }) => {
    const [leaveData, setLeaveData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fadeAnim = new Animated.Value(0);
    const scaleAnim = new Animated.Value(0.9);
    const slideAnim = new Animated.Value(20);

    const runAnimations = () => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 600,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
            }),
        ]).start();
    };

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
        } catch (err) {
            setError("Error fetching data");
        } finally {
            setLoading(false);
            setRefreshing(false);
            runAnimations();
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchLeaveData(true);
    }, []);

    useEffect(() => {
        fetchLeaveData();
    }, [leaveType]);

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
        <Animated.View
            style={[
                styles.emptyContainer,
                { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
            ]}
        >
            <Icon name="inbox" size={64} color="#dee2e6" />
            <Text style={styles.emptyText}>No leave records available</Text>
        </Animated.View>
    ) : (
        <Animated.View
            style={{
                flex: 1,
                opacity: fadeAnim,
                transform: [
                    { scale: scaleAnim },
                    { translateY: slideAnim },
                ],
            }}
        >
            <FlatList
                data={leaveData}
                keyExtractor={(item) => item.id.toString()}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={["#002957"]}
                    />
                }
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                    <Animated.View style={[styles.card]}>
                        {/* Header */}
                        <View style={styles.cardHeader}>
                            <View
                                style={[
                                    styles.statusDot,
                                    leaveType === "Pending" && styles.pendingIndicator,
                                    leaveType === "Approve" && styles.approvedIndicator,
                                    leaveType === "Decline" && styles.rejectedIndicator,
                                ]}
                            />

                            <View style={{ flex: 1 }}>
                                <Text style={styles.cardTitle}>{item.leavetype}</Text>

                                <View style={styles.row}>
                                    <Icon name="calendar-plus-o" size={14} color="#6c757d" />
                                    <Text style={styles.labelText}>Applied On: </Text>
                                    <Text style={styles.valueText}>
                                        {formatDate(item.applydate)}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Dates */}
                        <View style={styles.row}>
                            <Icon name="calendar" size={16} color="#495057" />
                            <Text style={styles.labelText}>From: </Text>
                            <Text style={styles.valueText}>{formatDate(item.leavestart)}</Text>
                        </View>

                        <View style={styles.row}>
                            <Icon name="calendar" size={16} color="#495057" />
                            <Text style={styles.labelText}>To: </Text>
                            <Text style={styles.valueText}>{formatDate(item.leaveend)}</Text>
                        </View>

                        {/* Leave Part */}
                        <View style={styles.row}>
                            <Icon name="clock-o" size={16} color="#6c757d" />
                            <Text style={styles.labelText}>Day Type: </Text>
                            <Text style={styles.valueText}>{item.leavepart}</Text>
                        </View>

                        {/* Status */}
                        <View style={styles.rowBetween}>
                            <View style={[styles.statusTag,
                                leaveType === "Pending" && styles.pendingBadge,
                                leaveType === "Approve" && styles.approvedBadge,
                                leaveType === "Decline" && styles.rejectedBadge,
                            ]}>
                                <Icon
                                    name={
                                        leaveType === "Approve"
                                            ? "check"
                                            : leaveType === "Decline"
                                                ? "times"
                                                : "clock-o"
                                    }
                                    size={12}
                                    style={{ marginRight: 5 }}
                                />
                                <Text style={styles.statusTagText}>
                                    {item.leavestatus || "Pending"}
                                </Text>
                            </View>
                        </View>

                        {/* Reason */}
                        <View style={styles.rowTop}>
                            <Icon name="commenting-o" size={16} color="#6c757d" />
                            <Text style={styles.labelText}>Reason: </Text>
                            <Text style={styles.reason}>{item.reason}</Text>
                        </View>
                    </Animated.View>
                )}
            />
        </Animated.View>
    );
};

const LeaveHistoryHeader = ({ navigation }) => (
    <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Leave History</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="times" size={24} color="#002957" />
        </TouchableOpacity>
    </View>
);

export default function LeaveTabNavigator({ navigation }) {
    return (
        <View style={styles.container}>
            <LeaveHistoryHeader navigation={navigation} />

            <Tab.Navigator
                screenOptions={{
                    tabBarStyle: {
                        backgroundColor: "#FFF",
                        height: 60,
                        borderTopWidth: 1,
                        borderTopColor: "#e9ecef",
                    },
                    tabBarActiveTintColor: "#002957",
                    tabBarInactiveTintColor: "#6c757d",
                }}
            >
                <Tab.Screen
                    name="Pending"
                    children={() => (
                        <LeaveRoute leaveType="Pending" navigation={navigation} />
                    )}
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="clock-o" color={color} size={size} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="Approved"
                    children={() => (
                        <LeaveRoute leaveType="Approve" navigation={navigation} />
                    )}
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="check" color={color} size={size} />
                        ),
                    }}
                />

                <Tab.Screen
                    name="Declined"
                    children={() => (
                        <LeaveRoute leaveType="Decline" navigation={navigation} />
                    )}
                    options={{
                        headerShown: false,
                        tabBarIcon: ({ color, size }) => (
                            <Icon name="times" color={color} size={size} />
                        ),
                    }}
                />
            </Tab.Navigator>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#f8f9fa" },

    headerContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#fff",
        borderBottomWidth: 1,
        borderBottomColor: "#e9ecef",
        flexDirection: "row",
        justifyContent: "space-between",
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#002957",
    },

    loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    errorContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    retryButton: {
        backgroundColor: "#002957",
        padding: 10,
        borderRadius: 8,
        marginTop: 10,
    },
    retryButtonText: { color: "#fff" },

    emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center" },

    card: {
        backgroundColor: "#ffffff",
        borderRadius: 16,
        padding: 18,
        marginHorizontal: 16,
        marginVertical: 10,
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
    },

    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },

    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 12,
    },

    pendingIndicator: { backgroundColor: "#ffc107" },
    approvedIndicator: { backgroundColor: "#28a745" },
    rejectedIndicator: { backgroundColor: "#dc3545" },

    cardTitle: { fontSize: 17, fontWeight: "700", color: "#002957" },

    row: { flexDirection: "row", alignItems: "center", marginBottom: 8 },

    rowTop: { flexDirection: "row", alignItems: "flex-start", marginTop: 5 },

    rowBetween: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginVertical: 10,
    },

    labelText: { fontSize: 13, color: "#6c757d", marginLeft: 6 },

    valueText: { fontSize: 14, color: "#333", fontWeight: "600" },

    statusTag: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 14,
    },

    pendingBadge: { backgroundColor: "#fff3cd" },
    approvedBadge: { backgroundColor: "#d4edda" },
    rejectedBadge: { backgroundColor: "#f8d7da" },

    statusTagText: { fontSize: 12, fontWeight: "700" },

    reason: {
        marginLeft: 8,
        fontSize: 14,
        color: "#6c757d",
        flex: 1,
        lineHeight: 18,
        fontStyle: "italic",
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
//   TouchableOpacity,
//   Dimensions,
// } from "react-native";
// import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
// import Icon from "react-native-vector-icons/FontAwesome";
// import { leaveHistoryPending } from "../../Services/Leave/Leave.service";
//
// const { width } = Dimensions.get('window');
// const Tab = createBottomTabNavigator();
//
// // Format ISO date strings to a readable format
// const formatDate = (dateString) => {
//   if (!dateString) return "Invalid Date";
//
//   try {
//     // Parse ISO date string
//     const date = new Date(dateString);
//
//     if (isNaN(date.getTime())) return dateString;
//
//     const months = [
//       "Jan", "Feb", "Mar", "Apr", "May", "Jun",
//       "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
//     ];
//
//     const day = date.getDate();
//     const month = months[date.getMonth()];
//     const year = date.getFullYear();
//
//     return `${day} ${month}, ${year}`;
//   } catch (error) {
//     console.error("Date formatting error:", error);
//     return dateString;
//   }
// };
//
// const LeaveRoute = ({ leaveType, navigation }) => {
//   const [leaveData, setLeaveData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [refreshing, setRefreshing] = useState(false);
//   const [error, setError] = useState(null);
//   const [fadeAnim] = useState(new Animated.Value(0));
//
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
//
//   const onRefresh = useCallback(() => {
//     setRefreshing(true);
//     fetchLeaveData(true);
//   }, []);
//
//   useEffect(() => {
//     fetchLeaveData();
//   }, [leaveType]);
//
//   useEffect(() => {
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 600,
//       easing: Easing.out(Easing.ease),
//       useNativeDriver: true,
//     }).start();
//   }, []);
//
//   if (loading && !refreshing) {
//     return (
//       <View style={styles.loaderContainer}>
//         <ActivityIndicator size="large" color="#002957" />
//       </View>
//     );
//   }
//
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
//
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
//
//             <View style={styles.dateRangeContainer}>
//               <Icon name="calendar" size={14} color="#6c757d" />
//               <Text style={styles.dateRangeText}>
//                 {formatDate(item.leavestart)} to {formatDate(item.leaveend)}
//               </Text>
//             </View>
//
//             <View style={styles.detailsContainer}>
//               <View style={styles.detailRow}>
//                 <Icon name="clock-o" size={14} color="#6c757d" />
//                 <Text style={styles.detailText}>{item.leavepart}</Text>
//               </View>
//
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
//
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
//
// // Header component with close button
// const LeaveHistoryHeader = ({ navigation }) => {
//   return (
//     <View style={styles.headerContainer}>
//       <Text style={styles.headerTitle}>Leave History</Text>
//       <TouchableOpacity
//         style={styles.closeButton}
//         onPress={() => navigation.goBack()}
//       >
//         <Icon name="times" size={24} color="#002957" />
//       </TouchableOpacity>
//     </View>
//   );
// };
//
// export default function LeaveTabNavigator({ navigation }) {
//   return (
//     <View style={styles.container}>
//       <LeaveHistoryHeader navigation={navigation} />
//       <Tab.Navigator
//         screenOptions={{
//           tabBarStyle: {
//             backgroundColor: "#ffffff",
//             height: 60,
//             borderTopWidth: 1,
//             borderTopColor: "#e9ecef",
//             elevation: 8,
//             shadowColor: "#000",
//             shadowOffset: { width: 0, height: -2 },
//             shadowOpacity: 0.1,
//             shadowRadius: 4,
//           },
//           tabBarActiveTintColor: "#002957",
//           tabBarInactiveTintColor: "#6c757d",
//           tabBarLabelStyle: {
//             fontSize: 12,
//             fontWeight: "500",
//           },
//         }}
//       >
//         <Tab.Screen
//           name="Pending"
//           children={() => <LeaveRoute leaveType="Pending" navigation={navigation} />}
//           options={{
//             headerShown: false,
//             tabBarIcon: ({ color, size }) => (
//               <View style={styles.tabIconContainer}>
//                 <Icon name="clock-o" color={color} size={size} />
//               </View>
//             ),
//           }}
//         />
//         <Tab.Screen
//           name="Approved"
//           children={() => <LeaveRoute leaveType="Approve" navigation={navigation} />}
//           options={{
//             headerShown: false,
//             tabBarIcon: ({ color, size }) => (
//               <View style={styles.tabIconContainer}>
//                 <Icon name="check" color={color} size={size} />
//               </View>
//             ),
//           }}
//         />
//         <Tab.Screen
//           name="Declined"
//           children={() => <LeaveRoute leaveType="Decline" navigation={navigation} />}
//           options={{
//             headerShown: false,
//             tabBarIcon: ({ color, size }) => (
//               <View style={styles.tabIconContainer}>
//                 <Icon name="times" color={color} size={size} />
//               </View>
//             ),
//           }}
//         />
//       </Tab.Navigator>
//     </View>
//   );
// }
//
// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: "#f8f9fa",
//   },
//   headerContainer: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: "#ffffff",
//     borderBottomWidth: 1,
//     borderBottomColor: "#e9ecef",
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: "bold",
//     color: "#002957",
//   },
//   closeButton: {
//     padding: 4,
//   },
//   loaderContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//
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
//     marginBottom: 14,
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
//     marginBottom: 2,
//   },
//   appliedDateText: {
//     fontSize: 14,
//     fontWeight: "500",
//   },
//   dateRangeContainer: {
//     flexDirection: "row",
//     alignItems: "center",
//     // marginBottom: 6,
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
//     // marginBottom: 6,
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
