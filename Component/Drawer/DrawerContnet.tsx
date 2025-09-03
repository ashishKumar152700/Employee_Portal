import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { DrawerContentScrollView, useDrawerStatus } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

export const CustomDrawerContent = (props: any) => {
  const [submenuVisible, setSubmenuVisible] = useState({
    attendance: false,
    myLeave: false,
  });

  const isDrawerOpen = useDrawerStatus() === "open";
  const { navigation, state } = props;
  const [activeRoute, setActiveRoute] = useState('DashBoard');

  // Get current active route
  useFocusEffect(
    React.useCallback(() => {
      const currentRoute = state.routes[state.index].name;
      setActiveRoute(currentRoute);
    }, [state])
  );

  useEffect(() => {
    if (isDrawerOpen) {
      setSubmenuVisible({
        attendance: false,
        myLeave: false,
      });
    }
  }, [isDrawerOpen]);
  
  const userDetails = useSelector((state: any) => state.userDetails);
  
  const userInfo = {
    username: userDetails.user.name,
    email: userDetails.user.email,
    profilePic:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU",
  };

  const menuItems = [
    {
      name: 'Attendance',
      icon: 'fingerprint',
      route: 'Attendance'
    },
    {
      name: 'My Leaves',
      icon: 'assignment',
      route: 'MyLeaveScreen'
    },
    {
      name: 'Leave Request',
      icon: 'person',
      route: 'LeaveRequest'
    }
  ];

  const renderMenuItem = (item: any) => {
    const isActive = activeRoute === item.route;
    
    return (
      <TouchableOpacity
        key={item.route}
        style={[
          styles.menuItem,
          isActive && styles.activeMenuItem
        ]}
        onPress={() => props.navigation.navigate(item.route)}
        activeOpacity={0.7}
      >
        <View style={styles.menuItemContent}>
          <MaterialIcons 
            name={item.icon as any} 
            size={22} 
            color={isActive ? '#FFFFFF' : '#555555'} 
            style={styles.menuIcon} 
          />
          <Text style={[
            styles.menuText,
            isActive && styles.activeMenuText
          ]}>
            {item.name}
          </Text>
        </View>
        {isActive && <View style={styles.activeIndicator} />}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['rgba(0, 41, 87, 0.95)', 'rgba(0, 41, 87, 0.85)']}
        style={styles.headerGradient}
      >
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: userInfo.profilePic }} style={styles.profilePic} />
          <View style={styles.userTextContainer}>
            <Text style={styles.username}>{userInfo.username}</Text>
            <Text style={styles.userRole}>Employee</Text>
            <Text style={styles.email}>{userInfo.email}</Text>
          </View>
        </View>
      </LinearGradient>

      <DrawerContentScrollView {...props} style={styles.drawerContent}>
        <View style={styles.menuContainer}>
          {menuItems.map(item => renderMenuItem(item))}
        </View>
      </DrawerContentScrollView>

      <View style={styles.logoutContainer}>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            console.log("Logging out...");
            try {
              await AsyncStorage.clear();
              console.log("Local storage cleared");
            } catch (e) {
              console.error("Failed to clear local storage:", e);
            }
            props.navigation.navigate("Login");
          }}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={22} color="white" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerGradient: {
    paddingTop: 50,
    paddingBottom: 20,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  profilePic: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  userTextContainer: {
    marginLeft: 15,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  userRole: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 2,
  },
  email: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  drawerContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  menuContainer: {
    paddingTop: 10,
  },
  menuItem: {
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  activeMenuItem: {
    backgroundColor: 'rgb(0, 41, 87)',
    shadowColor: 'rgb(0, 41, 87)',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
    width: 22,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333333',
    flex: 1,
  },
  activeMenuText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 2,
    borderBottomLeftRadius: 2,
  },
  logoutContainer: {
    margin: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 41, 87, 0.95)',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginLeft: 12,
  },
});

export default CustomDrawerContent;


// import React, { useEffect, useState } from "react";
// import { View, Image, StyleSheet, Text, TouchableOpacity } from "react-native";
// import { DrawerContentScrollView, useDrawerStatus } from "@react-navigation/drawer";
// import { MaterialIcons } from "@expo/vector-icons";
// import { useSelector } from "react-redux";
// import AsyncStorage from "@react-native-async-storage/async-storage";
// import { LinearGradient } from "expo-linear-gradient";
// import { useFocusEffect } from "@react-navigation/native";

// export const CustomDrawerContent = (props: any) => {
//   const [submenuVisible, setSubmenuVisible] = useState({
//     attendance: false,
//     myLeave: false,
//   });

//   const isDrawerOpen = useDrawerStatus() === "open";
//    const { navigation, state } = props;
//   const [activeRoute, setActiveRoute] = useState('DashBoard');

//   // Get current active route
//   useFocusEffect(
//     React.useCallback(() => {
//       const currentRoute = state.routes[state.index].name;
//       setActiveRoute(currentRoute);
//     }, [state])
//   );

//   useEffect(() => {
//     if (isDrawerOpen) {
//       setSubmenuVisible({
//         attendance: false,
//         myLeave: false,
//       });
//     }
//   }, [isDrawerOpen]);
  
//   const userDetails = useSelector((state: any) => state.userDetails);
//   // console.log('----------------------',userDetails);
  
//   const userInfo = {
//     username: userDetails.user.name,
//     // username: "fsdf",
//     // email: 'dsad',
//     email: userDetails.user.email,
//     profilePic:
//       "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU",
//   };

//   return (
//     <View style={styles.container}>
//       <LinearGradient
//         colors={['rgba(0, 41, 87, 0.95)', 'rgba(0, 41, 87, 0.85)']}
//         style={styles.headerGradient}
//       >
//         <View style={styles.userInfoContainer}>
//           <Image source={{ uri: userInfo.profilePic }} style={styles.profilePic} />
//           <View style={styles.userTextContainer}>
//             <Text style={styles.username}>{userInfo.username}</Text>
//             <Text style={styles.userRole}>Employee</Text>
//           <Text style={styles.email}>{userInfo.email}</Text>
//           </View>
//         </View>
//       </LinearGradient>

//       <DrawerContentScrollView {...props} style={styles.drawerContent}>
      

//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("Attendance")}
//         >
//           <MaterialIcons name="fingerprint" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Attendance</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("MyLeaveScreen")}
//         >
//           <MaterialIcons name="assignment" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>My Leaves</Text>
//         </TouchableOpacity>

    

//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("LeaveRequest")}
//         >
//           <MaterialIcons name="person" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Leave Request</Text>
//         </TouchableOpacity>

//             {/* <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("Timesheet")}
//         >
//           <MaterialIcons name="keyboard" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Timesheet</Text>
//         </TouchableOpacity> */}

//         {/* <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("AssetModule")}
//         >
//           <MaterialIcons name="mouse" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Asset Master</Text>
//         </TouchableOpacity> */}

//         {/* <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("LoanRequest")}
//         >
//           <MaterialIcons name="account-balance" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Loan Request</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("SalaryAdvanceRequest")}
//         >
//           <MaterialIcons name="attach-money" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Salary Advance Request</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("Reimbursement")}
//         >
//           <MaterialIcons name="receipt" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Reimbursement</Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("TaxModule")}
//         >
//           <MaterialIcons name="money" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Tax Module</Text>
//         </TouchableOpacity>
      
//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("AddMember")}
//         >
//           <MaterialIcons name="add" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Add a Member</Text>
//         </TouchableOpacity>
      
//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("OvertimeRequest")}
//         >
//           <MaterialIcons name="lock-clock" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Overtime Request</Text>
//         </TouchableOpacity>
      
//         <TouchableOpacity
//           style={styles.submenuButton}
//           onPress={() => props.navigation.navigate("SeparationRequest")}
//         >
//           <MaterialIcons name="skip-next" size={24} color="#555" style={styles.iconStyle} />
//           <Text style={styles.submenuButtonText}>Separation Request</Text>
//         </TouchableOpacity> */}
      

//       </DrawerContentScrollView>

// <View style={styles.logoutContainer}>
//   <TouchableOpacity
//     style={styles.logoutButton}
//     onPress={async () => {
//       console.log("Logging out...");
//       try {
//         await AsyncStorage.clear();
//         console.log("Local storage cleared");
//       } catch (e) {
//         console.error("Failed to clear local storage:", e);
//       }
//       props.navigation.navigate("Login");
//     }}
//   >
//      <MaterialIcons name="logout" size={22} color="white" />
//     <Text style={styles.logoutButtonText}>Logout</Text>
//   </TouchableOpacity>
// </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
  

//   container: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },

//   headerGradient: {
//     paddingTop: 50,
//     paddingBottom: 20,
//   },
//   userInfoContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//   },
//   profilePic: {
//     width: 60,
//     height: 60,
//     borderRadius: 30,
//     borderWidth: 3,
//     borderColor: 'rgba(255, 255, 255, 0.3)',
//   },
//   userTextContainer: {
//     marginLeft: 15,
//     flex: 1,
//   },
//   username: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#FFFFFF',
//     marginBottom: 2,
//   },
//   userRole: {
//     fontSize: 14,
//     color: 'rgba(255, 255, 255, 0.8)',
//   },
//   drawerContent: {
//     flex: 1,
//     backgroundColor: '#FFFFFF',
//   },
//   menuContainer: {
//     paddingTop: 10,
//   },
//   menuItem: {
//     marginHorizontal: 12,
//     marginVertical: 2,
//     borderRadius: 12,
//     overflow: 'hidden',
//     position: 'relative',
//   },
//   activeMenuItem: {
//     backgroundColor: 'rgb(0, 41, 87)',
//     shadowColor: 'rgb(0, 41, 87)',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   expandedMenuItem: {
//     backgroundColor: 'rgba(0, 41, 87, 0.05)',
//   },
//   menuItemContent: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 15,
//     paddingHorizontal: 16,
//   },
//   menuIcon: {
//     marginRight: 12,
//     width: 22,
//   },
//   menuText: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#333333',
//     flex: 1,
//   },
//   activeMenuText: {
//     color: '#FFFFFF',
//     fontWeight: '600',
//   },
//   activeIndicator: {
//     position: 'absolute',
//     right: 0,
//     top: 0,
//     bottom: 0,
//     width: 4,
//     backgroundColor: '#FFFFFF',
//     borderTopLeftRadius: 2,
//     borderBottomLeftRadius: 2,
//   },
//   submenuContainer: {
//     backgroundColor: 'rgba(0, 41, 87, 0.02)',
//     marginHorizontal: 12,
//     borderRadius: 8,
//     marginBottom: 4,
//   },
//   submenuItem: {
//     marginHorizontal: 0,
//     marginVertical: 1,
//     paddingLeft: 20,
//   },
//   submenuText: {
//     fontSize: 15,
//     color: '#555555',
//   },
//   logoutContainer: {
//     margin: 12,
//     borderRadius: 12,
//     overflow: 'hidden',
//     backgroundColor: 'rgba(0, 41, 87, 0.95)',
//   },
//   logoutButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//   },
//   logoutButtonText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: 'white',
//     marginLeft: 12,
//   },

//   email: {
//     fontSize: 14,
//     color: "#555",
//     marginTop: 2,
//   },
//   submenuButton: {
//     flexDirection: "row",
//     alignItems: "center",
//     padding: 15,
//     marginHorizontal: 10,
//     borderRadius: 10,
//     // marginBottom: 5,
//   },
//   submenuButtonText: {
//     fontSize: 16,
//     fontWeight: "600",
//     color: "black",
//     flex: 1,
//     marginLeft: 10,
//   },
//   iconStyle: {
//     marginRight: 15,
//     color: "black",
//   },

// });

// export default CustomDrawerContent;
