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
