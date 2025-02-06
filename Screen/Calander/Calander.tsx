import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { ExpandableCalendar, CalendarProvider, LocaleConfig } from "react-native-calendars";
import Icon from "react-native-vector-icons/MaterialIcons";
import { format } from "date-fns";
import { calendarservice } from "../../Services/Calendar/Calendar.service";
// import { calendarservice } from "../../Services/Calendar/Calendar.service";
 
// Configure the calendar locale
LocaleConfig.locales["en"] = {
  monthNames: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ],
  monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
  dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  today: "Today",
};
LocaleConfig.defaultLocale = "en";
 
const ExpandableCalendarDemo = () => {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]); // Default: today
  const [punchData, setPunchData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<boolean>(false);
 
  const todayDate = new Date().toISOString().split("T")[0]; // Get today's date
 
  // Fetch data from selected date to current date
  const fetchPunchData = useCallback(async () => {
    const formattedTodayDate = format(new Date(), "yyyy-MM-dd"); // Format today’s date
    setLoading(true);
 
    try {
      const response = await calendarservice.CalendarGet(selectedDate, formattedTodayDate, () => {}); // Call API
      console.log("API Response:", response);
 
      const responseData = response?.data || response; // Ensure correct data structure
      console.log("Processed Response:", responseData);
 
      if (!responseData || responseData.length === 0) {
        setPunchData({ [selectedDate]: [{ punchInTime: null, punchOutTime: null, punchDate: selectedDate }] });
        return;
      }
 
      const groupedItems: { [key: string]: any[] } = {};
      responseData.forEach((item: any) => {
        const punchDate = item.punchdate.split("T")[0];
        if (!groupedItems[punchDate]) groupedItems[punchDate] = [];
 
        groupedItems[punchDate].push({
          punchInTime: item.punchintime,
          punchOutTime: item.punchouttime,
          duration: item.duration,
          outActualAddress: item.outactualaddress,
          outMocked: item.outmocked,
        });
      });
 
      setPunchData(groupedItems);
    } catch (error) {
      console.error("Fetch error:", error);
      Alert.alert("Error", "Failed to fetch punch data");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);
 
  useEffect(() => {
    fetchPunchData();
  }, [selectedDate]);
 
  // Function to disable future dates
  const disableFutureDates = (date: string) => {
    return date > todayDate ? { disabled: true, disableTouchEvent: true } : {};
  };
 
  // Marked dates for the calendar
  const markedDates = Object.keys(punchData).reduce((acc, date) => {
    acc[date] = { marked: true, dotColor: "blue" };
    return acc;
  }, {} as Record<string, any>);
 
  markedDates[selectedDate] = {
    selected: true,
    selectedColor: "blue",
    selectedTextColor: "white",
  };
 
  // Disable all future dates
  const daysInMonth = 31; // Adjust based on month
  for (let i = 0; i < daysInMonth; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const futureDate = date.toISOString().split("T")[0];
 
    if (futureDate > todayDate) {
      markedDates[futureDate] = disableFutureDates(futureDate);
    }
  }
 
  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return "N/A"; // Handle invalid values
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
 
  return (
    <CalendarProvider date={selectedDate}>
      <ExpandableCalendar
        selected={selectedDate}
        onDayPress={(day) => {
          if (!markedDates[day.dateString]?.disabled) {
            setSelectedDate(day.dateString);
          } else {
            Alert.alert("Invalid Selection", "You cannot select a future date.");
          }
        }}
        markedDates={markedDates}
      />
      <ScrollView style={styles.eventList}>
        {loading ? (
          <ActivityIndicator size="large" color="rgb(0,47,81)" style={styles.loader} />
        ) : punchData[selectedDate] ? (
          punchData[selectedDate].map((data: any, index: number) => (
            <View key={index} style={styles.card}>
              <View style={styles.cardHeader}>
                <Icon name="access-time" size={24} color="yellowgreen" style={styles.icon} />
                <Text style={styles.cardTitle}>Work Details for {selectedDate}</Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                <View style={styles.row}>
                  <Icon name="fingerprint" size={20} color="green" style={styles.rowIcon} />
                  <Text> {data.punchInTime || "N/A"}</Text>
                </View>
                <View style={styles.row}>
                  <Icon name="fingerprint" size={20} color="red" style={styles.rowIcon} />
                  <Text>{data.punchOutTime || "N/A"}</Text>
                </View>
                <View style={styles.row}>
                  <Icon name="schedule" size={20} color="purple" style={styles.rowIcon} />
                   <Text>{formatDuration(data.duration)}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No data for this day</Text>
          </View>
        )}
      </ScrollView>
    </CalendarProvider>
  );
};
 
const styles = StyleSheet.create({
  eventList: {
    marginTop: 20,
    padding: 10,
  },
  loader: {
    marginTop: 20,
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 15,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  icon: {
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  rowIcon: {
    marginRight: 10,
  },
  noDataContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  noDataText: {
    fontSize: 16,
    fontStyle: "italic",
    color: "#777",
  },
});
 
export default ExpandableCalendarDemo;