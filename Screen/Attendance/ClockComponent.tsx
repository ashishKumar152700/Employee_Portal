// import React, { useEffect, useState } from 'react';
// import { Dimensions, StyleSheet, Text, View } from 'react-native';
// const { width } = Dimensions.get('window');

// const scaleFont = (size: any) => {
//   const scale = width / 375;
//   return Math.round(size * scale);
// };

// const scaleSize = (size: any) => {
//   const scale = width / 375;
//   return Math.round(size * scale);
// };

// const ClockComponent = () => {
//   const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }));
//   const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', {
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//   }));
//   const [currentDay, setCurrentDay] = useState(new Date().toLocaleString('en-US', { weekday: 'long' }));

//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       const now = new Date();
//       setCurrentTime(
//         now.toLocaleTimeString('en-US', { hour12: false }) 
//       );
//       setCurrentDate(
//         now.toLocaleDateString('en-US', {
//           year: 'numeric',
//           month: 'long',
//           day: 'numeric',
//         })
//       );
//       setCurrentDay(
//         now.toLocaleString('en-US', { weekday: 'long' })
//       );
//     }, 1000);

//     return () => clearInterval(intervalId);
//   }, []);

//   return (
//     <View style={styles.container}>
//       <Text style={styles.liveTime}>{currentTime}</Text>
//       <View style={styles.dateContainer}>
//         <Text style={styles.dayText}>{currentDay}</Text>
//         <Text style={styles.dateText}>{currentDate}</Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     alignItems: 'center',
//     marginBottom: scaleSize(12),
//   },
//   liveTime: {
//     fontSize: scaleFont(42),
//     fontWeight: '800',
//     color: '#002957',
//     // marginBottom: scaleSize(5),
//     letterSpacing: 1,
//   },
//   dateContainer: {
//     alignItems: 'center',
//   },
//   dateText: {
//     fontSize: scaleFont(16),
//     color: '#6c757d',
//     marginBottom: scaleSize(2),
//   },
//   dayText: {
//     fontSize: scaleFont(18),
//     fontWeight: '600',
//     color: '#002957',
//   },
// });

// export default ClockComponent;

import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
const { width, height } = Dimensions.get('window');

const scaleFont = (size: any) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

const scaleSize = (size: any) => {
  const scale = width / 375;
  return Math.round(size * scale);
};

const ClockComponent = () => {
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false }) );
  const [currentDate, setCurrentDate] = useState(new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) + ' - ' + new Date().toLocaleString('en-US', { weekday: 'long' }));

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', { hour12: false }) 
      );
      setCurrentDate(
        now.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }) + ' - ' + now.toLocaleString('en-US', { weekday: 'long' })
      );
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      <Text style={styles.liveTime}>{currentTime}</Text>
      <Text style={styles.dateText}>{currentDate}</Text>
    </>
  );
};

const styles = StyleSheet.create({
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
});

export default ClockComponent;
