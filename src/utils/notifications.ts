import { LocalNotifications } from '@capacitor/local-notifications';

export async function requestNotificationPermissions() {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    if (display !== 'granted') {
      console.warn('Notification permissions not granted');
    }
    
    // Create high-priority channels for Alarms
    await LocalNotifications.createChannel({
      id: 'manager-alarms',
      name: 'Manager Alarms',
      description: 'Critical reminders for trades and events',
      importance: 5,
      visibility: 1,
      sound: 'alarm.wav',
      vibration: true,
      lights: true,
      lightColor: '#800020'
    });

    // Also create a fallback default channel
    await LocalNotifications.createChannel({
      id: 'default',
      name: 'Standard Notifications',
      importance: 4,
      visibility: 1,
      vibration: true
    });
  } catch (error) {
    console.error('Error requesting notification permissions', error);
  }
}

/**
 * Triggers an immediate "Alarm" style notification.
 */
export async function triggerAlarm(title: string, body: string, id?: number, sound?: string) {
  try {
    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    const notificationId = id || new Date().getTime();

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `🚨 ${title}`,
          body,
          id: notificationId % 100000000,
          schedule: { at: new Date(Date.now() + 100) },
          channelId: 'manager-alarms',
          smallIcon: 'ic_launcher_foreground',
          sound: sound || 'alarm.wav',
          ongoing: false, 
          autoCancel: true
        }
      ]
    });
  } catch (error) {
    console.error('Failed to trigger alarm', error);
  }
}

/**
 * Schedules a future "Reminder" or "Alarm".
 */
export async function scheduleAlarm(title: string, body: string, date: Date, id?: number, sound?: string) {
  try {
    if (date.getTime() <= Date.now()) return;

    const perm = await LocalNotifications.checkPermissions();
    if (perm.display !== 'granted') {
      await LocalNotifications.requestPermissions();
    }

    const notificationId = id || new Date().getTime();

    await LocalNotifications.schedule({
      notifications: [
        {
          title: `⏰ ${title}`,
          body,
          id: notificationId % 100000000,
          schedule: { at: date },
          channelId: 'manager-alarms',
          smallIcon: 'ic_launcher_foreground',
          sound: sound || 'alarm.wav',
          ongoing: false, 
          autoCancel: true
        }
      ]
    });
  } catch (error) {
    console.error('Failed to schedule alarm', error);
  }
}

export async function triggerNotification(title: string, body: string, id?: number, sound?: string) {
    await triggerAlarm(title, body, id, sound);
}

export async function scheduleNotification(title: string, body: string, date: Date, id?: number, sound?: string) {
    await scheduleAlarm(title, body, date, id, sound);
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
