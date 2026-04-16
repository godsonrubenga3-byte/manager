import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermissions() {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') {
      console.warn('Push notification permissions not granted');
    }
  } catch (error) {
    console.error('Error requesting notification permissions', error);
  }
}

export async function triggerNotification(title: string, body: string, id: number = new Date().getTime()) {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: id % 100000000,
          schedule: { at: new Date(Date.now() + 100) },
          channelId: 'default',
          smallIcon: 'ic_launcher_foreground', 
          actionTypeId: '',
          extra: null
        }
      ]
    });
  } catch (error) {
    console.error('Failed to trigger notification', error);
  }
}

/**
 * Schedules a notification for a specific future date and time.
 * @param title Title of the notification
 * @param body Body text of the notification
 * @param date The Date object representing when to trigger
 * @param id Unique ID for the notification
 */
export async function scheduleNotification(title: string, body: string, date: Date, id: number = new Date().getTime()) {
  try {
    // Only schedule if the date is in the future
    if (date.getTime() <= Date.now()) {
      return;
    }

    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: id % 100000000,
          schedule: { at: date },
          channelId: 'default',
          smallIcon: 'ic_launcher_foreground',
          sound: 'default'
        }
      ]
    });
    console.log(`Scheduled notification: "${title}" at ${date.toLocaleString()}`);
  } catch (error) {
    console.error('Failed to schedule notification', error);
  }
}

export async function cancelNotification(id: number) {
  try {
    await LocalNotifications.cancel({
      notifications: [{ id: id % 100000000 }]
    });
  } catch (error) {
    console.error('Failed to cancel notification', error);
  }
}
