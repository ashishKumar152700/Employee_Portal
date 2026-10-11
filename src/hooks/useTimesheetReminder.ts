import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// Daily "fill your timesheet" reminder, Monday–Saturday at 17:30 local time.
// Scheduled on the device itself (no server / push token needed), so it fires
// even offline and survives reboots. Tapping it simply opens the app, which
// lands on the Timesheet screen by default.

const CHANNEL_ID = 'timesheet-reminders';
const ID_PREFIX = 'timesheet-reminder-';
const HOUR = 17;
const MINUTE = 30;
// expo-notifications weekdays: 1 = Sunday ... 7 = Saturday
const WEEKDAYS = [2, 3, 4, 5, 6, 7];
const DAY_NAMES = ['', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const STATUS_KEY = 'timesheetReminderStatus'; // last scheduling result (diagnostics)

// Show the banner even if the app is open at 17:30.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Timesheet reminders',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
};

const getScheduledReminders = async () =>
  (await Notifications.getAllScheduledNotificationsAsync()).filter((n) =>
    n.identifier.startsWith(ID_PREFIX),
  );

/** Call on explicit logout only: reminders keep firing while the app is closed. */
export const cancelTimesheetReminders = async () => {
  for (const n of await getScheduledReminders()) {
    await Notifications.cancelScheduledNotificationAsync(n.identifier);
  }
};

// Only one scheduling run at a time; overlapping callers share it.
let inFlight: Promise<string> | null = null;

/** Schedules the Mon–Sat reminders. Never throws; returns a status line. */
export const scheduleTimesheetReminders = (): Promise<string> => {
  if (!inFlight) {
    inFlight = doSchedule().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
};

const doSchedule = async (): Promise<string> => {
  let status: string;
  try {
    await ensureChannel();

    let { status: perm } = await Notifications.getPermissionsAsync();
    if (perm !== 'granted') {
      ({ status: perm } = await Notifications.requestPermissionsAsync());
    }

    if (perm !== 'granted') {
      status = `skipped: permission ${perm}`;
    } else {
      // Skip days that are already scheduled; add only the missing ones. No
      // cancel-then-add, so a reminder is never briefly missing.
      const existing = new Set((await getScheduledReminders()).map((n) => n.identifier));
      const errors: string[] = [];
      for (const weekday of WEEKDAYS) {
        const identifier = `${ID_PREFIX}${weekday}`;
        if (existing.has(identifier)) continue;
        try {
          await Notifications.scheduleNotificationAsync({
            identifier,
            content: {
              title: 'Timesheet reminder ⏰',
              body: "Don't forget to fill in today's timesheet before you wrap up.",
              sound: 'default',
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday,
              hour: HOUR,
              minute: MINUTE,
              channelId: CHANNEL_ID,
            },
          });
        } catch (e: any) {
          errors.push(`${DAY_NAMES[weekday]}: ${e?.message ?? String(e)}`);
        }
      }
      const count = (await getScheduledReminders()).filter((n) =>
        WEEKDAYS.some((d) => n.identifier === `${ID_PREFIX}${d}`),
      ).length;
      status = errors.length
        ? `${count}/6 scheduled, errors: ${errors.join('; ')}`
        : `ok, ${count}/6 scheduled`;
    }
  } catch (e: any) {
    status = `failed: ${e?.message ?? String(e)}`;
  }
  const stamped = `${new Date().toLocaleString()}: ${status}`;
  await AsyncStorage.setItem(STATUS_KEY, stamped).catch(() => {});
  return stamped;
};

/**
 * TEMP diagnostics (drawer → "Test notifications"). Re-runs scheduling, sends
 * one notification now (no alarm) and one in 60s (alarm path), and reports
 * what the device says. Remove once reminders are confirmed working.
 */
let testRunning = false;
export const runNotificationTest = async (): Promise<string> => {
  if (testRunning) return 'Test already running…';
  testRunning = true;
  const lines: string[] = [];
  try {
    const lastRun = await AsyncStorage.getItem(STATUS_KEY);
    lines.push(`Last auto-schedule: ${lastRun ?? 'never ran'}`);

    const perm = await Notifications.getPermissionsAsync();
    lines.push(`Permission: ${perm.status}`);

    await ensureChannel();
    if (Platform.OS === 'android') {
      const ch = await Notifications.getNotificationChannelAsync(CHANNEL_ID);
      lines.push(`Channel importance: ${ch?.importance ?? 'missing'} (6 = high)`);
    }

    lines.push(`Schedule now: ${await scheduleTimesheetReminders()}`);

    await Notifications.scheduleNotificationAsync({
      identifier: 'diag-instant',
      content: { title: 'Test 1 of 2: instant', body: 'If you see this, notifications display fine.' },
      trigger: null,
    });
    await Notifications.scheduleNotificationAsync({
      identifier: 'diag-60s',
      content: { title: 'Test 2 of 2: after 60s', body: 'If you see this, scheduled alarms work.' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60,
        channelId: CHANNEL_ID,
      },
    });
    lines.push('Sent: instant + 60s test');

    const reminders = await getScheduledReminders();
    lines.push(`Daily reminders on device: ${reminders.length}`);
    for (const n of reminders) {
      const t: any = n.trigger;
      lines.push(
        `• ${DAY_NAMES[t?.weekday] ?? n.identifier} ${String(t?.hour).padStart(2, '0')}:${String(t?.minute).padStart(2, '0')}`,
      );
    }
  } catch (error: any) {
    lines.push(`ERROR: ${error?.message ?? String(error)}`);
  } finally {
    testRunning = false;
  }
  return lines.join('\n');
};

export const useTimesheetReminder = (isLoggedIn: boolean): void => {
  useEffect(() => {
    // Not cancelled when logged out here: a cold start sits on the login
    // screen before the session is restored. Logout cancels explicitly.
    if (!isLoggedIn) return;
    scheduleTimesheetReminders();

    // Self-heal: top up any missing reminders whenever the app is reopened.
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') scheduleTimesheetReminders();
    });
    return () => sub.remove();
  }, [isLoggedIn]);
};
