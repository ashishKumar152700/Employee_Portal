import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { baseUrl } from '../../Global/Config';

// Expo Push registration. The backend sends the Mon–Sat 17:30 timesheet
// reminder to every registered device, logged in or not, so this runs on app
// start (not at login). The employee code is attached when available so the
// backend can target people later; logout does not unregister the device.

export const CHANNEL_ID = 'timesheet-reminders'; // backend sends with this channelId
const REGISTER_URL = `${baseUrl}/api/v1/push-tokens`;
const CACHE_KEY = 'pushRegistration';
const RESEND_AFTER_MS = 24 * 60 * 60 * 1000; // refresh lastSeen daily
const OLD_LOCAL_PREFIX = 'timesheet-reminder-'; // on-device reminders from 1.0.2 OTAs

// Show the banner even if the app is open when the push arrives.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Earlier OTAs scheduled reminders on the device; the server sends them now.
const removeOldLocalReminders = async () => {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.identifier.startsWith(OLD_LOCAL_PREFIX)) {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }
};

const getExpoPushToken = async (): Promise<string | null> => {
  if (Platform.OS === 'android') {
    // Must exist before the Android 13+ permission prompt can show.
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Timesheet reminders',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
};

let inFlight: Promise<void> | null = null;

const register = async (employeeCode: string | null) => {
  await removeOldLocalReminders().catch(() => {});

  const token = await getExpoPushToken();
  if (!token) return;

  // Skip the call if nothing changed recently (logout clears AsyncStorage,
  // so the device re-registers without an employee code afterwards).
  const cached = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) || 'null');
  if (
    cached &&
    cached.token === token &&
    cached.employeeCode === employeeCode &&
    Date.now() - cached.at < RESEND_AFTER_MS
  ) {
    return;
  }

  const res = await axios.post(
    REGISTER_URL,
    {
      token,
      platform: Platform.OS,
      employeeCode,
      appVersion: Constants.expoConfig?.version ?? null,
    },
    { timeout: 15000 },
  );
  // Only cache a real API success: an unknown route can answer 200 with the
  // web frontend's HTML, which must not count as registered.
  if (res.data?.success !== true) {
    throw new Error(`Unexpected register response (${res.status})`);
  }
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ token, employeeCode, at: Date.now() }));
};

const registerOnce = (employeeCode: string | null) => {
  if (!inFlight) {
    inFlight = register(employeeCode)
      .catch((error) => console.warn('Push registration failed:', error?.message ?? error))
      .finally(() => {
        inFlight = null;
      });
  }
  return inFlight;
};

/** Registers this device for push on app start, on login/logout, and on resume. */
export const usePushNotifications = (employeeCode: string | null): void => {
  useEffect(() => {
    registerOnce(employeeCode);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') registerOnce(employeeCode);
    });
    return () => sub.remove();
  }, [employeeCode]);
};
