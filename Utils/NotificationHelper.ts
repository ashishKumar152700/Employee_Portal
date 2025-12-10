

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";

// Show notifications even when the app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Ask permission (Android auto approves but we call for iOS)
export async function requestNotificationPermission() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

// Cancel previous notifications created by this reminder
async function cancelTimesheetNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const ids = scheduled
    .filter(s =>
      s.content?.data?.tag === "RKT_TIMESHEET_REMINDER_DAILY"
    )
    .map(s => s.identifier);

  for (const id of ids) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}


export async function scheduleTimesheetReminderDaily() {
  const alreadySet = await AsyncStorage.getItem("TIMESHEET_REMINDER_SET");

  if (alreadySet === "yes") {
    console.log("Reminder already scheduled, skipping...");
    return;
  }

  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Schedule daily notification at 17:30
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "🕒 Timesheet Reminder",
      body: "Don't forget to fill your timesheet today!",
      data: { tag: "RKT_TIMESHEET_REMINDER_DAILY" }
    },
    trigger: {
      hour: 17,
      minute: 30,
      repeats: true
    }
  });

  await AsyncStorage.setItem("TIMESHEET_REMINDER_SET", "yes");
  console.log("Daily reminder scheduled.");
}


