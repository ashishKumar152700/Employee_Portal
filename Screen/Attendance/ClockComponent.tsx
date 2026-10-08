import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
const { width } = Dimensions.get('window');

const scaleFont = (size: any) => Math.round(size * (width / 375));

const pad = (n: number) => String(n).padStart(2, '0');

const formatDate = (now: Date) =>
  now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) +
  ' - ' +
  now.toLocaleString('en-US', { weekday: 'long' });

/**
 * Live 24h digital clock. Ticks in its own state so the parent screen
 * doesn't re-render every second.
 */
const ClockComponent = () => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <Text style={styles.liveTime}>
          {pad(now.getHours())}
          <Text style={styles.colon}>:</Text>
          {pad(now.getMinutes())}
        </Text>
        <Text style={styles.seconds}>{pad(now.getSeconds())}</Text>
      </View>
      <Text style={styles.dateText}>{formatDate(now)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  liveTime: {
    fontSize: scaleFont(54),
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(125, 211, 252, 0.55)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  colon: {
    color: 'rgba(125, 211, 252, 0.95)',
  },
  seconds: {
    fontSize: scaleFont(20),
    fontWeight: '700',
    color: 'rgba(125, 211, 252, 0.95)',
    marginLeft: 6,
    marginBottom: scaleFont(10),
    fontVariant: ['tabular-nums'],
  },
  dateText: {
    fontSize: scaleFont(13),
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.4,
    marginTop: 2,
  },
});

export default ClockComponent;
