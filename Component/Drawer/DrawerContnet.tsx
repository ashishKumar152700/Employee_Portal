import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet, Text, TouchableOpacity } from "react-native";
import { DrawerContentScrollView, useDrawerStatus } from "@react-navigation/drawer";
import { MaterialIcons } from "@expo/vector-icons";

export const CustomDrawerContent = (props: any) => {
  const [submenuVisible, setSubmenuVisible] = useState({
    attendance: false,
    myLeave: false,
  });

  const toggleSubmenu = (menu: string) => {
    setSubmenuVisible((prevState) => ({
      ...prevState,
      [menu]: !prevState[menu],
    }));
  };

  const isDrawerOpen = useDrawerStatus() === 'open';

  useEffect(() => {
    if (isDrawerOpen) {
      setSubmenuVisible({
        attendance: false,
        myLeave: false,
      });
    }
  }, [isDrawerOpen]);

  return (
  
    <DrawerContentScrollView {...props} style={styles.drawerContent}>
      <View style={styles.logoContainer}>
        <Image
          source={{
            uri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsGAgOHc7MixFJidTH-Ng1Z_y-iq_w82rGIt93WsTFMRTsmwZtuCgTgAh1KE5uDMzOjPk&usqp=CAU",
          }}
          style={styles.logo}
        />
      </View>

      <TouchableOpacity
        style={styles.submenuButton}
        onPress={() => toggleSubmenu("attendance")}
      >
        <MaterialIcons name="access-time" size={24} color="#555" style={styles.iconStyle} />
        <Text style={styles.submenuButtonText}>Attendance</Text>
        <MaterialIcons
          name={submenuVisible.attendance ? "expand-less" : "expand-more"}
          size={24}
          color="black"
        />
      </TouchableOpacity>

      {submenuVisible.attendance && (
        <View style={styles.submenuContainer}>
          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => props.navigation.navigate("Punch")}
          >
            <MaterialIcons name="fingerprint" size={20} color="#333" style={styles.subsectionIcon} />
            <Text style={styles.submenuItemText}>Punch IN/OUT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => props.navigation.navigate("Calander")}
          >
            <MaterialIcons name="calendar-today" size={20} color="#333" style={styles.subsectionIcon} />
            <Text style={styles.submenuItemText}>Calendar</Text>
          </TouchableOpacity>
        </View>
      )}
{/* 7284 */}
      <TouchableOpacity
        style={styles.submenuButton}
        onPress={() => props.navigation.navigate("MyLeaveScreen")}
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
        onPress={() => toggleSubmenu("asset")}
      >
        <MaterialIcons name="mouse" size={24} color="#555" style={styles.iconStyle} />
        <Text style={styles.submenuButtonText}>Asset Manager</Text>
        <MaterialIcons
          name={submenuVisible.attendance ? "expand-less" : "expand-more"}
          size={24}
          color="black"
        />
      </TouchableOpacity>

      {submenuVisible.asset && (
        <View style={styles.submenuContainer}>
          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => props.navigation.navigate("AssetModule")}
          >
            <MaterialIcons name="monitor" size={20} color="#333" style={styles.subsectionIcon} />
            <Text style={styles.submenuItemText}>Assets</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.submenuItem}
            onPress={() => props.navigation.navigate("MyTickets")}
          >
            <MaterialIcons name="confirmation-number" size={20} color="#333" style={styles.subsectionIcon} />
            <Text style={styles.submenuItemText}>My Tickets</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        style={styles.submenuButton}
        onPress={() => props.navigation.navigate("Profile")}
      >
        <MaterialIcons name="person" size={24} color="#555" style={styles.iconStyle} />
        <Text style={styles.submenuButtonText}>User Details</Text>
      </TouchableOpacity>

      


    </DrawerContentScrollView>

  );
};

const styles = StyleSheet.create({
  drawerContent: {
    // backgroundColor: "#f8f9fa",
    backgroundColor: "rgb(40,47,81)",
    // borderTopRightRadius:25:25,
  },
  logoContainer: {
    alignItems: "center",
    padding: 50,
    // backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  logo: {
    width: 140,
    height: 140,
    borderRadius: 70,
    resizeMode: "cover",
  },
  submenuButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#e0e0e0",
    borderBottomWidth: 1,
    // borderBottomColor: "#d0d0d0",
    borderBottomColor: "rgb(40,47,81)",
    
  },
  submenuButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginLeft: 10,
  },
  submenuContainer: {
    paddingLeft: 25,
    paddingVertical: -10,
    // borderBottomWidth: 1,
    // borderTopColor: "#fff",
  },
  submenuItem: {
    flexDirection: "row",
    // alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: "#fff",
  },
  submenuItemText: {
    fontSize: 16,
    // color: "#555",
    marginLeft: 8,
    color:"#fff",
  },
  iconStyle: {
    marginRight: 10,
  },
  subsectionIcon: {
    marginRight: 5,
    color:"#fff",
  },
});

export default CustomDrawerContent;
