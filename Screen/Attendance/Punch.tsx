
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Feather } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { punchService } from '../../Services/Punch/Punch.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSelector } from 'react-redux';
import ClockComponent from './ClockComponent';

const { width, height } = Dimensions.get('window');

const scaleFont = (size :any) => {
  const scale = width / 375; 
  return Math.round(size * scale);
};

const scaleSize = (size :any) => {
  const scale = width / 375; 
  return Math.round(size * scale);
};

interface ClockButtonProps {
  time: string;
  date: string;
  type: 'in' | 'out';
  onPress: () => void;
  isLoading: boolean;
}

const ClockButton: React.FC<ClockButtonProps> = ({ time, date, type, onPress, isLoading }) => (
  <View >
    <LinearGradient
      colors={type === 'in' ? ['#3481ed', '#c087e6'] : ['#98309c', '#d93473']}
      style={styles.gradientButton}
    >
      <TouchableOpacity onPress={onPress} style={styles.button} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <>
            <MaterialIcons name='touch-app' size={scaleSize(50)} color="white"  />
            <Text style={styles.buttonText}>{type === 'in' ? 'CLOCK IN' : 'CLOCK OUT'}</Text>
          </>
        )}
      </TouchableOpacity>
    </LinearGradient>
  </View>
);

const PunchScreen: React.FC = () => {
  const [clockInTime, setClockInTime] = useState<string | null>(null);
  const [clockOutTime, setClockOutTime] = useState<string | null>(null);
  const [totalTime, setTotalTime] = useState<string | null>(null);
  const [clockInDate, setClockInDate] = useState<Date | null>(null);
  const [isClockInLoading, setIsClockInLoading] = useState(false);
  const [isClockOutLoading, setIsClockOutLoading] = useState(false);

  const punchInforSelector = useSelector((state: any) => state.punchInfo);

  console.log("punchInforSelector :- ", punchInforSelector);
  
  useEffect(() => {
    const fetchPunchInfo = async () => {
      try {
        const punchInfo = punchInforSelector;
    
        if (punchInfo.length > 0 && punchInfo[0].punchintime) {
          setClockInTime(punchInfo[0].punchintime); 
          setClockOutTime(punchInfo[0].punchouttime);
    
          // Convert duration in seconds to hr:min:sec
          const totalSeconds = punchInfo[0].duration;
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
    
          const formattedDuration = `${hours}h ${minutes}m `;
    
          setTotalTime(formattedDuration); // Store in formatted string
          console.log('Punch In Time:', punchInfo[0].punchintime);
          console.log('Duration:', formattedDuration);
        } else {
          console.log('No punch in time found in the stored data.');
        }
      } catch (error) {
        console.error('Error fetching punch info from AsyncStorage:', error);
      }
    };
    

    fetchPunchInfo();
  }, []);
  
  const requestLocationPermission = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();

    console.log("status : " , status);
    
    if (status !== 'granted') {
      showLocationAlert();
      return true;
    }
    else{
      return false;
    }
  };


  const showLocationAlert = () => {
    return new Promise(async (resolve , reject) => {
      Alert.alert(
        'Location Disabled',
        'Please enable location services to proceed.',
        [
          {
            text: 'No Thanks',
            onPress: () => resolve(false),
            style: 'cancel',
          },
          {
            text: 'Turn On',
            onPress: async () => {
              await Location.requestForegroundPermissionsAsync();
              resolve(true);
            },
          },
        ],
        { cancelable: false }
      );
    });
  };
  
  const getLocation = async () => {
    let hasPermission = await requestLocationPermission();
    console.log("hasPermission : " , hasPermission);
    
    if (!hasPermission) {
      const enableLocation = await showLocationAlert();
      console.log("enableLocation : ", enableLocation);
      if (!enableLocation) {
        return Alert.alert(
          'Location Disabled',
          'Please enable location services to punch.'); // or throw an error, depending on your use case
      }
    }
  
   return await Location.getCurrentPositionAsync({}).then((loc)=>{
      console.log("print the location : " , loc);
      
      return loc;
    }).catch((err)=>{
      console.log("error in location declined : ", err);
       Alert.alert(
        'Location Disabled',
        `${err}`);
        return undefined;
    });
   
    
  };
  
  const handleClockIn = async () => {
    setIsClockInLoading(true);
    const location : any = await getLocation();
    
    console.log("print the location 1.1 : ", location);
    
    if (location) {
      const now = new Date();
      
      setClockInDate(now);
      
      try {
        const response = await punchService.PunchInApi(location);
        console.log("response to check : " , response.data.punchintime);
        
        if (response.message === 'Already Puched In!') {
          setClockInTime(response.data.punchintime);
          Alert.alert('Info', response.message);
        } else {
          setClockInTime(response.data.punchintime);
          Alert.alert('Success', response.message);
        }
      } catch (error) {
        console.error('Punch In Error:', error);
        Alert.alert('Error', 'An error occurred while clocking in.');
      }
    }
    
    setIsClockInLoading(false);
  };
  

  const handleClockOut = async () => {

    
     const punchInfoString = await AsyncStorage.getItem('punchInfo');
          const punchInfo = JSON.parse(punchInfoString);
    

   
    setIsClockOutLoading(true);
    const location : any = await getLocation();
    console.log("location during punch out : " , location);
    if (location) {
      // const now = new Date();
      // setClockOutTime(punchInfo[0].punchouttime);
     
      try {
       const response = await punchService.PunchOutApi(location); 
       console.log("response from service to punch screen : " , response);

       const formattedDuration = response.formattedDuration
       setTotalTime(formattedDuration);
       setClockOutTime(response.punchouttime);  
        
        Alert.alert('Success', response.punchOutMessage);
      } catch (error) {
        console.error('Punch Out Error:', error);
        Alert.alert('Error', 'An error occurred while clocking out.');
      }
    }
    setIsClockOutLoading(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.card}>
         <ClockComponent />
          <ClockButton
            time={clockInTime || "09:10 AM"}
            date="March 19, 2024 - Friday"
            type="in"
            onPress={handleClockIn}
            isLoading={isClockInLoading}
          />
        </View>

        <View style={styles.card}>
          <ClockButton
            time={clockOutTime || "03:15 PM"}
            date="March 19, 2024 - Friday"
            type="out"
            onPress={handleClockOut}
            isLoading={isClockOutLoading}
          />
          <View style={styles.footer}>
            <View style={styles.footerItem}>
              <Feather name="clock" size={scaleSize(20)} color="rgb(0, 41, 87)" />
              <Text style={{ marginTop: 5 }}>{clockInTime || 'Punch In'}</Text>
              <Text style={styles.footerText}>Clock In</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather name="clock" size={scaleSize(20)} color="rgb(0, 41, 87)" />
              <Text style={{ marginTop: 5 }}>{clockOutTime || 'Punch Out'}</Text>
              <Text style={styles.footerText}>Clock Out</Text>
            </View>
            <View style={styles.footerItem}>
              <Feather name="bar-chart-2" size={scaleSize(20)} color="rgb(0, 41, 87)" />
              <Text style={{ marginTop: 5 }}>{totalTime || '0h 0m'}</Text>
              <Text style={styles.footerText}>Totals</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // backgroundColor: 'rgb(0, 41, 87)',
    backgroundColor:'lightgrey' ,
    // backgroundColor: '#133E87',
    padding: scaleSize(13),
    alignItems: 'center',
    paddingBottom: scaleSize(65) ,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    
    
  },
  card: {
    backgroundColor: '#FFFFFF',
    // backgroundColor: '#CBDCEB',
    borderRadius: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
    padding: scaleSize(15),
    width: '100%',
    marginBottom: scaleSize(10),
    flexGrow: 1,
    minHeight: scaleSize(100),
    justifyContent: 'center',
  },
  liveTime: {
    fontSize: scaleFont(36),
    fontWeight: 'bold',
    textAlign: 'center',
    color: 'rgb(0, 41, 87)',
  },
  dateText: {
    fontSize: scaleFont(16),
    textAlign: 'center',
    color: 'rgb(0, 41, 87)',
    marginBottom: scaleSize(20),
  },
  buttonText: {
    fontSize: scaleFont(20),
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  gradientButton: {
    width: scaleSize(170),
    height: scaleSize(170),
    borderRadius: scaleSize(85),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: scaleSize(30),
  },
  footerItem: {
    alignItems: 'center',
    width: '33%',
  },
  footerText: {
    fontSize: scaleFont(12),
    color: 'rgb(0, 41, 87)',
    marginTop: scaleSize(4),
    fontWeight:'bold'
  },
});

export default PunchScreen;
