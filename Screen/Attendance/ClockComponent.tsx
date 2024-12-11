import React, { useEffect, useState } from 'react'
import { Dimensions, StyleSheet, Text } from 'react-native';
const { width, height } = Dimensions.get('window');

const scaleFont = (size :any) => {
    const scale = width / 375; 
    return Math.round(size * scale);
  };
  
  const scaleSize = (size :any) => {
    const scale = width / 375; 
    return Math.round(size * scale);
  };

const ClockComponent = () => {

    const [currentTime , setCurrentTime] = useState(new Date().toLocaleTimeString());
    const [currentDate , setCurrentDate] = useState("");

    useEffect(() => {
        const intervalId = setInterval(() => {
          const now = new Date();
          setCurrentTime(now.toLocaleTimeString());
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
  )

}

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
})

export default ClockComponent
