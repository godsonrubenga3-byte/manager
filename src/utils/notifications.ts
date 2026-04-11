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
          smallIcon: 'ic_launcher_foreground', // Good practice for Android
          actionTypeId: '',
          extra: null
        }
      ]
    });
  } catch (error) {
    console.error('Failed to trigger notification', error);
  }
}
