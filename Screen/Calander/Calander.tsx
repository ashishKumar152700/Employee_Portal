import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Agenda } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Card } from 'react-native-paper';
import { calendarservice } from '../../Services/Calendar/Calendar.service';
import { useDispatch } from 'react-redux';
import { differenceInSeconds } from 'date-fns';
import { format } from 'date-fns';


type Item = {
  punchInTime?: string;   // Renamed to match the response field
  punchOutTime?: string;  // Renamed to match the response field
  punchDate?: string;     // Optional: Store the date (if needed)
  totalTime?: string;
  duration?: number;      // Duration (in seconds or other unit)
  outActualAddress?: string;  // Optional: The actual address (if needed)
  outMocked?: boolean;        // Optional: A flag for mocked data
};


const currentYear = new Date().getFullYear();
const minDate = `${currentYear}-01-01`;
const todayDate = new Date();
const maxDate = todayDate.toISOString().split('T')[0];


const Schedule: React.FC = () => {
  const [items, setItems] = useState<{ [key: string]: Item[] }>({});
  const [selectedDate, setSelectedDate] = useState<string>(maxDate);

  const dispatch = useDispatch();

  useEffect(() => {
    Icon.loadFont();
  }, []);


  const fetchCurrentDateData = useCallback(async () => {
    const todayDate = new Date();
    const formattedTodayDate = formatDate(todayDate.toISOString());

    try {
      const response = await calendarservice.CalendarGet(
        formattedTodayDate,
        selectedDate,
        dispatch
      );

      if (response.data.length === 0) {
        // If no data, show absent card for selected date
        const absentData = {
          [formattedTodayDate]: [
            { punchInTime: null, punchOutTime: null, punchDate: formattedTodayDate },
          ],
        };
        setItems(absentData); // Set the absent data for today
      } else {
        const groupedItems: { [key: string]: Item[] } = {};
        response.data.forEach((item: any) => {
          const punchDate = item.punchdate.split('T')[0];
          if (!groupedItems[punchDate]) {
            groupedItems[punchDate] = [];
          }
          groupedItems[punchDate].push({
            punchInTime: item.punchintime,
            punchOutTime: item.punchouttime,
            punchDate: item.punchdate,
            duration: item.duration,
            outActualAddress: item.outactualaddress,
            outMocked: item.outmocked,
          });
        });
        setItems(groupedItems); // Set the fetched data
      }
    } catch (error) {
      // console.error('Error fetching current date data:', error instanceof Error ? error.message : error);
    }
  }, [dispatch, selectedDate]);

  useEffect(() => {
    setSelectedDate(maxDate);
    setItems({});
    fetchCurrentDateData(); // Fetch data for the current date when the component mounts
  }, []);

    const loadItems = useCallback(
    async (day: any) => {
      const newItems: { [key: string]: Item[] } = {};

      for (let i = -15; i <= 0; i++) {
        const time = day.timestamp + i * 24 * 60 * 60 * 1000;
        const strTime = timeToString(time);

        if (strTime >= minDate && strTime <= maxDate && !items[strTime]) {
          const response = await calendarservice.CalendarGet(strTime, strTime, dispatch);
          if (response.data.length === 0) {
            // Show absent card for this day
            newItems[strTime] = [
              { punchInTime: null, punchOutTime: null, punchDate: strTime },
            ];
          } else {
            response.data.forEach((item: any) => {
              const punchDate = item.punchdate.split('T')[0];
              if (!newItems[punchDate]) {
                newItems[punchDate] = [];
              }
              newItems[punchDate].push({
                punchInTime: item.punchintime,
                punchOutTime: item.punchouttime,
                punchDate: item.punchdate,
                duration: item.duration,
                outActualAddress: item.outactualaddress,
                outMocked: item.outmocked,
              });
            });
          }
        }
      }

      setItems((prevItems) => ({ ...prevItems, ...newItems }));
    },
    [dispatch, items]
  );

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        throw new Error("Invalid date format");
      }
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (error) {
      console.error("Error formatting date:", dateString, error);
      return "Invalid Date";
    }
  };

  const handleDayPress = useCallback(
    async (day: { dateString: string }) => {
      const formattedDate = formatDate(day.dateString);
      setSelectedDate(format(new Date(formattedDate), 'dd/MM/yyyy'));
    
      
      
      try {
        // console.log("SelectedDate in ui from calendar : " , formattedDate);
        
        const response = await calendarservice.CalendarGet(formattedDate, formattedDate, dispatch);

        const groupedItems: { [key: string]: Item[] } = {};
        response.data.forEach((item: any) => {
          const punchDate = item.punchdate.split('T')[0];
          if (!groupedItems[punchDate]) {
            groupedItems[punchDate] = [];
          }
          groupedItems[punchDate].push({
            punchInTime: item.punchintime,
            punchOutTime: item.punchouttime,
            punchDate: item.punchdate,
            duration: item.duration,
            outActualAddress: item.outactualaddress,
            outMocked: item.outmocked,
          });
        });

        setItems((prevItems) => ({ ...prevItems, ...groupedItems }));
      } catch (error) {
        console.error('Error fetching data for selected day:', error instanceof Error ? error.message : error);
      }
    },
    [dispatch]
  );

  const renderItem = useCallback(
    (item: Item) => {
      const formattedDate = item.punchDate
        ? item.punchDate.split('T')[0].split('-').reverse().join('/')
        : 'Date Missing';

        
      const convertDurationToHours = (punchDate: string, punchInTime: string, punchOutTime: string) => {
        try {
          const inTime = new Date(`${punchDate.split('T')[0]}T${punchInTime}`);
          const outTime = new Date(`${punchDate.split('T')[0]}T${punchOutTime}`);
          const durationSeconds = differenceInSeconds(outTime, inTime);
          return `${Math.floor(durationSeconds / 3600)}h ${Math.floor((durationSeconds % 3600) / 60)}m ${durationSeconds % 60}s`;
        } catch (error) {
          console.error('Error calculating duration:', error);
          return 'Invalid Duration';
        }
      };


      // If punchInTime is missing, show "Absent" card
      if (!item.punchInTime) {
        return (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.cardContent}>
                <Text style={styles.absentText}>
                  {formattedDate} - Absent
                </Text>
              </View>
            </Card.Content>
          </Card>
        );
      }
      if (item.punchInTime && !item.punchOutTime) {
        return (
          <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardContent}>
              <Text style={styles.presentText}>{formattedDate}</Text>
              <View style={styles.row}>
                <View style={styles.iconWithText}>
                  <Icon name="clock-in" size={24} color="rgb(0, 41, 87)" />
                  <Text style={styles.timeText}>{item.punchInTime}</Text>
                </View>
                <View style={styles.iconWithText}>
                  <Icon name="clock-out" size={24} color="rgb(0, 41, 87)" />
                  <Text style={styles.dintPOText}>Didn't punch out</Text>
                </View>
                <View style={styles.iconWithText}>
                  <Icon name="clock" size={24} color="rgb(0, 41, 87)" />
                  <Text style={styles.timeText}>-- : -- : --</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
        );
      }



      return (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardContent}>
              <Text style={styles.presentText}>{formattedDate}</Text>
              <View style={styles.row}>
                <View style={styles.iconWithText}>
                  <Icon name="clock-in" size={24} color="rgb(0, 41, 87)" />
                  <Text style={styles.timeText}>{item.punchInTime}</Text>
                </View>
                <View style={styles.iconWithText}>
                  <Icon name="clock-out" size={24} color="rgb(0, 41, 87)" />
                  <Text style={styles.timeText}>{item.punchOutTime}</Text>
                </View>
                <View style={styles.iconWithText}>
                  <Icon name="clock" size={24} color="rgb(0, 41, 87)" />
                  <Text style={styles.timeText}>
                    {convertDurationToHours(item.punchDate, item.punchInTime, item.punchOutTime)}
                  </Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      );
    },
    []
  );


  const calPast = () => {
    const previousMonths = new Date().getMonth();
    return previousMonths;
  }

  return (
    <View style={styles.container}>
      <Agenda
        items={items}
        loadItemsForMonth={loadItems}
        selected={maxDate}
        renderItem={renderItem}
        onDayPress={handleDayPress}
        minDate={minDate}
        maxDate={maxDate}
        showClosingKnob={true}
        pastScrollRange={calPast()}
        futureScrollRange={0}
        theme={{
          agendaDayTextColor: 'rgb(0, 41, 87)',
          agendaDayNumColor: 'rgb(0, 41, 87)',
          agendaTodayColor: 'green',
          agendaKnobColor: 'rgb(0, 41, 87)',
          backgroundColor: '#f8f8f8',
          calendarBackground: 'white',
        }}
      />
    </View>
  );
};


const timeToString = (time: number) => {
  const date = new Date(time);
  return date.toISOString().split('T')[0];
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "fff",
    marginBottom:80,
    
  },
  card: {
    marginRight: 15,
    marginTop: 15,
    marginBottom: 10,
    backgroundColor: '#ffffff',
    
  },
  cardContent: {
    flexDirection: 'column',
    justifyContent: 'space-around',
    // marginBottom: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    // marginBottom: 20,
  },
  iconWithText: {
    flexDirection: 'column',
    alignItems: 'center',
    marginRight: 15,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginTop: 5,
  },
  dintPOText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'maroon',
    marginTop: 5,
  },
  presentText: {
    color: 'black',
    fontSize: 16,
  },
  absentText: {
    color: 'orange',
    fontSize: 20,
    marginBottom: 10,
    fontWeight:'600',
    paddingTop:5
  },
});

export default Schedule;


// import React, { useState, useEffect, useCallback } from "react";
// import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
// import { ExpandableCalendar, CalendarProvider, LocaleConfig } from "react-native-calendars";
// import Icon from "react-native-vector-icons/MaterialIcons";
// import { format } from "date-fns";
// import { calendarservice } from "../../Services/Calendar/Calendar.service";
// // import { calendarservice } from "../../Services/Calendar/Calendar.service";
 
// // Configure the calendar locale
// LocaleConfig.locales["en"] = {
//   monthNames: [
//     "January", "February", "March", "April", "May", "June",
//     "July", "August", "September", "October", "November", "December"
//   ],
//   monthNamesShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
//   dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
//   dayNamesShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
//   today: "Today",
// };
// LocaleConfig.defaultLocale = "en";
 
// const ExpandableCalendarDemo = () => {
//   const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split("T")[0]); // Default: today
//   const [punchData, setPunchData] = useState<Record<string, any>>({});
//   const [loading, setLoading] = useState<boolean>(false);
 
//   const todayDate = new Date().toISOString().split("T")[0]; // Get today's date
 
//   // Fetch data from selected date to current date
//   const fetchPunchData = useCallback(async () => {
//     const formattedTodayDate = format(new Date(), "yyyy-MM-dd"); // Format today’s date
//     setLoading(true);
 
//     try {
//       const response = await calendarservice.CalendarGet(selectedDate, formattedTodayDate, () => {}); // Call API
//       console.log("API Response:", response);
 
//       const responseData = response?.data || response; // Ensure correct data structure
//       console.log("Processed Response:", responseData);
 
//       if (!responseData || responseData.length === 0) {
//         setPunchData({ [selectedDate]: [{ punchInTime: null, punchOutTime: null, punchDate: selectedDate }] });
//         return;
//       }
 
//       const groupedItems: { [key: string]: any[] } = {};
//       responseData.forEach((item: any) => {
//         const punchDate = item.punchdate.split("T")[0];
//         if (!groupedItems[punchDate]) groupedItems[punchDate] = [];
 
//         groupedItems[punchDate].push({
//           punchInTime: item.punchintime,
//           punchOutTime: item.punchouttime,
//           duration: item.duration,
//           outActualAddress: item.outactualaddress,
//           outMocked: item.outmocked,
//         });
//       });
 
//       setPunchData(groupedItems);
//     } catch (error) {
//       console.error("Fetch error:", error);
//       Alert.alert("Error", "Failed to fetch punch data");
//     } finally {
//       setLoading(false);
//     }
//   }, [selectedDate]);
 
//   useEffect(() => {
//     fetchPunchData();
//   }, [selectedDate]);
 
//   // Function to disable future dates
//   const disableFutureDates = (date: string) => {
//     return date > todayDate ? { disabled: true, disableTouchEvent: true } : {};
//   };
 
//   // Marked dates for the calendar
//   const markedDates = Object.keys(punchData).reduce((acc, date) => {
//     acc[date] = { marked: true, dotColor: "blue" };
//     return acc;
//   }, {} as Record<string, any>);
 
//   markedDates[selectedDate] = {
//     selected: true,
//     selectedColor: "blue",
//     selectedTextColor: "white",
//   };
 
//   // Disable all future dates
//   const daysInMonth = 31; // Adjust based on month
//   for (let i = 0; i < daysInMonth; i++) {
//     const date = new Date();
//     date.setDate(date.getDate() + i);
//     const futureDate = date.toISOString().split("T")[0];
 
//     if (futureDate > todayDate) {
//       markedDates[futureDate] = disableFutureDates(futureDate);
//     }
//   }
 
//   const formatDuration = (seconds: number) => {
//     if (!seconds || seconds < 0) return "N/A"; // Handle invalid values
//     const hours = Math.floor(seconds / 3600);
//     const minutes = Math.floor((seconds % 3600) / 60);
//     return `${hours}h ${minutes}m`;
//   };
 
//   return (
//     <CalendarProvider date={selectedDate}>
//       <ExpandableCalendar
//         selected={selectedDate}
//         onDayPress={(day) => {
//           if (!markedDates[day.dateString]?.disabled) {
//             setSelectedDate(day.dateString);
//           } else {
//             Alert.alert("Invalid Selection", "You cannot select a future date.");
//           }
//         }}
//         markedDates={markedDates}
//       />
//       <ScrollView style={styles.eventList}>
//         {loading ? (
//           <ActivityIndicator size="large" color="rgb(0,47,81)" style={styles.loader} />
//         ) : punchData[selectedDate] ? (
//           punchData[selectedDate].map((data: any, index: number) => (
//             <View key={index} style={styles.card}>
//               <View style={styles.cardHeader}>
//                 <Icon name="access-time" size={24} color="yellowgreen" style={styles.icon} />
//                 <Text style={styles.cardTitle}>Work Details for {selectedDate}</Text>
//               </View>
//               <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
//                 <View style={styles.row}>
//                   <Icon name="fingerprint" size={20} color="green" style={styles.rowIcon} />
//                   <Text> {data.punchInTime || "N/A"}</Text>
//                 </View>
//                 <View style={styles.row}>
//                   <Icon name="fingerprint" size={20} color="red" style={styles.rowIcon} />
//                   <Text>{data.punchOutTime || "N/A"}</Text>
//                 </View>
//                 <View style={styles.row}>
//                   <Icon name="schedule" size={20} color="purple" style={styles.rowIcon} />
//                    <Text>{formatDuration(data.duration)}</Text>
//                 </View>
//               </View>
//             </View>
//           ))
//         ) : (
//           <View style={styles.noDataContainer}>
//             <Text style={styles.noDataText}>No data for this day</Text>
//           </View>
//         )}
//       </ScrollView>
//     </CalendarProvider>
//   );
// };
 
// const styles = StyleSheet.create({
//   eventList: {
//     marginTop: 20,
//     padding: 10,
//   },
//   loader: {
//     marginTop: 20,
//   },
//   card: {
//     backgroundColor: "#fff",
//     padding: 15,
//     marginBottom: 15,
//     borderRadius: 10,
//     shadowColor: "#000",
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.2,
//     shadowRadius: 5,
//     elevation: 3,
//   },
//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 10,
//   },
//   icon: {
//     marginRight: 10,
//   },
//   cardTitle: {
//     fontSize: 16,
//     fontWeight: "bold",
//   },
//   row: {
//     flexDirection: "column",
//     alignItems: "center",
//     marginBottom: 8,
//     gap: 8,
//   },
//   rowIcon: {
//     marginRight: 10,
//   },
//   noDataContainer: {
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 20,
//   },
//   noDataText: {
//     fontSize: 16,
//     fontStyle: "italic",
//     color: "#777",
//   },
// });
 
// export default ExpandableCalendarDemo;