import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { DrawerContentScrollView, useDrawerStatus } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";
import { useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const CustomDrawerContent = (props: any) => {
  const [submenuVisible, setSubmenuVisible] = useState({
    attendance: false,
    myLeave: false,
  });

  const isDrawerOpen = useDrawerStatus() === "open";

  useEffect(()=>{

  },[])

  useEffect(() => {
    if (isDrawerOpen) {
      setSubmenuVisible({
        attendance: false,
        myLeave: false,
      });
    }
  }, [isDrawerOpen]);
  
  const userDetails = useSelector((state: any) => state.userDetails);
  // console.log('----------------------',userDetails);
  
  const userInfo = {
    username: userDetails.user.name,
    // username: "fsdf",
    // email: 'dsad',
    email: userDetails.user.email,
    profilePic:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU",
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} style={styles.drawerContent}>
      
        <View style={styles.userInfoContainer}>
          <Image source={{ uri: userInfo.profilePic }} style={styles.profilePic} />
          <Text style={styles.username}>{userInfo.username}</Text>
          <Text style={styles.email}>{userInfo.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("DashBoard")}
        >
          <MaterialIcons name="dashboard" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>DashBoard</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("Attendance")}
        >
          <MaterialIcons name="fingerprint" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Attendance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("MyLeaves")}
        >
          <MaterialIcons name="assignment" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>My Leaves</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("Timesheet")}
        >
          <MaterialIcons name="keyboard" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Timesheet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("AssetModule")}
        >
          <MaterialIcons name="mouse" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Asset Master</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("LeaveRequest")}
        >
          <MaterialIcons name="person" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Leave Request</Text>
        </TouchableOpacity>

        

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("LoanRequest")}
        >
          <MaterialIcons name="account-balance" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Loan Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("SalaryAdvanceRequest")}
        >
          <MaterialIcons name="attach-money" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Salary Advance Request</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("Reimbursement")}
        >
          <MaterialIcons name="receipt" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Reimbursement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("TaxModule")}
        >
          <MaterialIcons name="money" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Tax Module</Text>
        </TouchableOpacity>
      
        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("AddMember")}
        >
          <MaterialIcons name="add" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Add a Member</Text>
        </TouchableOpacity>
      
        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("OvertimeRequest")}
        >
          <MaterialIcons name="lock-clock" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Overtime Request</Text>
        </TouchableOpacity>
      
        <TouchableOpacity
          style={styles.submenuButton}
          onPress={() => props.navigation.navigate("SeparationRequest")}
        >
          <MaterialIcons name="skip-next" size={24} color="#555" style={styles.iconStyle} />
          <Text style={styles.submenuButtonText}>Separation Request</Text>
        </TouchableOpacity>
      

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
  >
    <MaterialIcons name="logout" size={24} color="white" />
    <Text style={styles.logoutButtonText}>Logout</Text>
  </TouchableOpacity>
</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerContent: {
    flex: 1,
    paddingVertical: 10,
  },
  userInfoContainer: {
    alignItems: "flex-start",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    marginBottom: 10,
  },
  profilePic: {
    width: 100,
    height: 100,
    borderRadius: 40,
    alignSelf: "flex-start",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "#555",
    marginTop: 2,
  },
  submenuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginHorizontal: 10,
    borderRadius: 10,
    // marginBottom: 5,
  },
  submenuButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "black",
    flex: 1,
    marginLeft: 10,
  },
  iconStyle: {
    marginRight: 15,
    color: "black",
  },
  logoutContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    backgroundColor: "#003151",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginLeft: 10,
  },
});

export default CustomDrawerContent;
