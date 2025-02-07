import * as React from "react";
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import PagerView from "react-native-pager-view";
import { useEffect, useState } from "react";
import { leaveHistoryPending } from "../../Services/Leave/Leave.service";

const LeaveRoute = ({ leaveType }) => {
  const [leaveData, setLeaveData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        setLoading(true);
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
      }
    };

    fetchLeaveData();
  }, [leaveType]);

  if (loading) {
    return (
      <ActivityIndicator size="large" color="purple" style={styles.loader} />
    );
  }

  if (error) {
    return <Text style={styles.errorText}>{error}</Text>;
  }

  return (
    <FlatList
      data={leaveData}
      keyExtractor={(item) => item.id.toString()}
      renderItem={({ item }) => {
        let itemTextStyle = [
          styles.itemText,
          leaveType === "Declined" && { color: "red" },
          leaveType === "approve" && { color: "green" },
          leaveType === "Pending" && { color: "#ff8600" },
        ];

        const isSameDate = item.leavestart === item.leaveend;
        const parseDate = (dateString) => {
          const [day, month, year] = dateString.split("/"); // Split the dd/mm/yyyy string
          return new Date(year, month - 1, day); // Create a Date object (month is 0-based)
        };
        return (
          <View style={styles.itemContainer}>
            <Text style={[{ fontWeight: "500", fontSize: 15 }]}>
              • {item.leavetype}
            </Text>
            <Text style={styles.durationText}>
              Applied From{" "}
              {isSameDate
                ? new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(parseDate(item.leavestart))
                : `${new Intl.DateTimeFormat("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  }).format(parseDate(item.leavestart))} to ${new Intl.DateTimeFormat(
                    "en-GB",
                    {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    }
                  ).format(parseDate(item.leaveend))}`}
            </Text>
            <Text
              style={[
                styles.dateText,
                leaveType === "Pending" && { color: "#ff8600" }, // Orange for Pending
                leaveType === "Approve" && { color: "green" }, // Green for Approved
                leaveType === "Decline" && { color: "red" }, // Red for Declined
              ]}
            >
              {new Intl.DateTimeFormat("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }).format(new Date(item.applydate))}
            </Text>
          </View>
        );
      }}
      contentContainerStyle={styles.contentContainer}
    />
  );
};

export default function TabViewExample() {
  const layout = useWindowDimensions();
  const [index, setIndex] = React.useState(0);

  const handleTabPress = (tabIndex) => {
    setIndex(tabIndex);
  };

  return (
    <View style={styles.container}>
      <PagerView
        style={styles.pagerView}
        initialPage={index}
        onPageSelected={(e) => setIndex(e.nativeEvent.position)}
      >
        <View key="1" style={styles.page}>
          <LeaveRoute leaveType="Pending" />
        </View>
        <View key="2" style={styles.page}>
          <LeaveRoute leaveType="Approve" />
        </View>
        <View key="3" style={styles.page}>
          <LeaveRoute leaveType="Decline" />
        </View>
      </PagerView>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, index === 0 && styles.activeTab]}
          onPress={() => handleTabPress(0)}
        >
          <Text style={[styles.tabText, index === 0 && styles.activeTabText]}>
            Pending
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, index === 1 && styles.activeTab]}
          onPress={() => handleTabPress(1)}
        >
          <Text style={[styles.tabText, index === 1 && styles.activeTabText]}>
            Approved
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, index === 2 && styles.activeTab]}
          onPress={() => handleTabPress(2)}
        >
          <Text style={[styles.tabText, index === 2 && styles.activeTabText]}>
            Declined
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  tabBar: {
    // flexDirection: "row",
    // justifyContent: "space-around",
    // backgroundColor: "#f0f0f0",
    // paddingVertical: 10,
    flexDirection: 'row',
    height: 66,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: 'rgb(0, 41, 87)', // Set background color
    paddingBottom: 8,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    justifyContent: 'space-around', // Spread tabs evenly
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  tabText: {
    fontSize: 16,
    color: "#555",
  },
  activeTab: {
    borderTopWidth: 3,
    borderTopColor: '#fff', // Active tab top border color
  },
  activeTabText: {
    color: '#ff9f43',
    fontWeight: "bold",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#007BFF",
    textAlign: "right",
    marginTop: 5,
  },
  itemContainer: {
    padding: 10,
    marginVertical: 7,
    marginHorizontal: 0,
    borderRadius: 12,
    backgroundColor: "#f9f9f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 0.5,
    borderColor: "#ccc",
  },
  durationText: {
    fontSize: 12,
    color: "#808080",
    fontWeight: "500",
    marginBottom: 10,
    lineHeight: 25,
  },
  itemText: {
    fontSize: 13,
    color: "#444",
    fontWeight: "600",
    lineHeight: 22,
  },
  contentContainer: {
    paddingBottom: 50,
    paddingHorizontal: 8,
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
  activeTabText: {
    borderTopWidth: 3,
    borderTopColor: '#ff9f43', // Active tab top border color
  },
});


// import * as React from "react";
// import {
//   FlatList,
//   View,
//   Text,
//   StyleSheet,
//   useWindowDimensions,
//   ActivityIndicator,
//   Alert,
//   TouchableOpacity,
// } from "react-native";

// import { TabView, SceneMap, TabBar } from "react-native-tab-view";
// import { useEffect, useState } from "react";
// import { leaveHistoryPending } from "../../Services/Leave/Leave.service";

// const LeaveRoute = ({ leaveType }) => {
//   const [leaveData, setLeaveData] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchLeaveData = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         const response = await leaveHistoryPending(leaveType);
//         if (response.status === 200) {
//           setLeaveData(response.data.data);
//         } else {
//           setError("Failed to fetch data");
//         }
//       } catch (error) {
//         setError("Error fetching data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchLeaveData();
//   }, [leaveType]);

//   if (loading) {
//     return (
//       <ActivityIndicator size="large" color="purple" style={styles.loader} />
//     );
//   }

//   if (error) {
//     return <Text style={styles.errorText}>{error}</Text>;
//   }

//   return (
//     <FlatList
//       data={leaveData}
//       keyExtractor={(item) => item.id.toString()}
//       renderItem={({ item }) => {
//         let itemTextStyle = [
//           styles.itemText,
//           leaveType === "Declined" && { color: "red" },
//           leaveType === "approve" && { color: "green" },
//           leaveType === "Pending" && { color: "#ff8600" },
//         ];

//         // Check if leave start and leave end are the same
//         const isSameDate = item.leavestart === item.leaveend;
//         const parseDate = (dateString) => {
//           const [day, month, year] = dateString.split("/"); // Split the dd/mm/yyyy str ing
//           return new Date(year, month - 1, day); // Create a Date object (month is 0-based)
//         };
//         return (
//           <View style={styles.itemContainer}>
//             <Text
//               style={[
//                 { fontWeight: "500", fontSize: 15 },
               
//               ]}
//             >
//               • {item.leavetype}
//             </Text>
//             <Text style={styles.durationText}>
//               Applied From{" "}
//               {isSameDate
//                 ? new Intl.DateTimeFormat("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   }).format(parseDate(item.leavestart))
//                 : `${new Intl.DateTimeFormat("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   }).format(
//                     parseDate(item.leavestart)
//                   )} to ${new Intl.DateTimeFormat("en-GB", {
//                     day: "2-digit",
//                     month: "short",
//                     year: "numeric",
//                   }).format(parseDate(item.leaveend))}`}
//             </Text>
//             <Text
//               style={[
//                 styles.dateText,
//                 leaveType === "Pending" && { color: "#ff8600" }, // Orange for Pending
//                 leaveType === "Approve" && { color: "green" }, // Green for Approved
//                 leaveType === "Decline" && { color: "red" }, // Red for Declined
//               ]}
//             >
//               {new Intl.DateTimeFormat("en-GB", {
//                 day: "2-digit",
//                 month: "short",
//                 year: "numeric",
//               }).format(new Date(item.applydate))}
//             </Text>
//           </View>
//         );
        
//       }}
//       contentContainerStyle={styles.contentContainer}
//     />
//   );
// };

// const renderScene = SceneMap({
//   first: () => <LeaveRoute leaveType="Pending" />,
//   second: () => <LeaveRoute leaveType="Approve" />,
//   third: () => <LeaveRoute leaveType="Decline" />,
// });

// const routes = [
//   { key: "first", title: "Pending"},
//   { key: "second", title: "Approve" },
//   { key: "third", title: "Declined" },
// ];

// export default function TabViewExample() {
//   const layout = useWindowDimensions();
//   const [index, setIndex] = React.useState(0);

//   return (
//     <TabView
//       navigationState={{ index, routes }}
//       renderScene={renderScene}
//       onIndexChange={setIndex}
//       initialLayout={{ width: layout.width }}
//       renderTabBar={(props) => (
//         <TabBar
//           {...props}
//           style={styles.tabBar}
//           indicatorStyle={styles.indicator}
          
//         />
//       )}
//       style={styles.tabView}
//     />
//   );
// }

// const styles = StyleSheet.create({
//   tabView: {
//     backgroundColor: "white",
//   },
//   dateText: {
//     fontSize: 14, // Adjust font size
//     fontWeight: "bold", // Make the text bold
//     color: "#007BFF", // Choose a color (blue in this case)
//     textAlign: "right", // Align to the right if needed
//     marginTop: 5, // Add some spacing above
//   },
//   itemContainer: {
//     padding: 10,
//     marginVertical: 7,
//     marginHorizontal: 0,
//     borderRadius: 12,
//     backgroundColor: "#f9f9f9",
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 4 },
//     shadowOpacity: 0.1,
//     shadowRadius: 6,
//     elevation: 5,
//     borderWidth: 0.5,
//     borderColor: "#ccc",
//   },
//   durationText: {
//     fontSize: 12,
//     color: "#808080",
//     fontWeight: "500",
//     marginBottom: 10,
//     lineHeight: 25,
//   },
//   itemText: {
//     fontSize: 13,
//     color: "#444",
//     // marginBottom: 4,
//     fontWeight: "600",
//     lineHeight: 22,
    
//   },
//   contentContainer: {
//     paddingBottom: 50,
//     paddingHorizontal: 8,
//     backgroundColor: "white",
    
//   },
//   tabBar: {
//     // backgroundColor: "purple",
//     // backgroundColor: "#007BFF",
//     backgroundColor: "rgb(0, 41, 87)",

//       color:'red',
//     borderBottomWidth: 1,
//     borderBottomColor: "#e0e0e0",
//   },
//   label: {
//     color: "white",
//     fontWeight: "bold",
//     fontSize: 16,
//   },
//   indicator: {
//     backgroundColor: "#ff9f43",
//     height: 4,
//     borderRadius: 2,
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
