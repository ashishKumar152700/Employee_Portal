import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

export const PRIMARY = 'rgb(0, 41, 87)';
export const PRIMARY_SOFT = 'rgb(0, 86, 160)';
export const PRIMARY_MUTED = 'rgba(0, 41, 87, 0.5)';

export const sharedTabBarStyle = {
  position: 'absolute' as const,
  left: 14,
  right: 14,
  bottom: 10,
  height: 66,
  borderRadius: 33,
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  borderWidth: 1,
  borderTopWidth: 1,
  borderColor: 'rgba(0, 41, 87, 0.08)',
  borderTopColor: 'rgba(0, 41, 87, 0.08)',
  elevation: 18,
  shadowColor: '#001A38',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.18,
  shadowRadius: 16,
  paddingBottom: 6,
  paddingTop: 6,
};

export const sharedTabBarLabelStyle = {
  fontSize: 11,
  fontWeight: '600' as const,
  marginTop: 5,
};

export const sharedActiveTintColor = PRIMARY;
export const sharedInactiveTintColor = PRIMARY_MUTED;

type TabIconProps = {
  name: string;
  focused: boolean;
  size?: number;
};

export const TabIcon = ({name, focused, size = 20}: TabIconProps) => {
  if (focused) {
    return (
      <LinearGradient
        colors={[PRIMARY, PRIMARY_SOFT]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={[styles.pill, {height: size + 14, width: size + 30}]}>
        <Icon name={name} size={size} color="#FFFFFF" />
      </LinearGradient>
    );
  }
  return (
    <View style={[styles.pill, styles.pillIdle, {height: size + 14, width: size + 30}]}>
      <Icon name={name} size={size} color={PRIMARY_MUTED} />
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PRIMARY,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  pillIdle: {
    backgroundColor: 'rgba(0, 41, 87, 0.06)',
    shadowOpacity: 0,
    elevation: 0,
  },
});
