import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ref, update } from 'firebase/database';
import { database } from '../config/firebase';

// Configure how notifications appear when app is open
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const registerForPushNotifications = async (userId) => {
  // Push notifications only work on real devices
  if (!Device.isDevice) {
    console.log('Push notifications require a real device');
    return null;
  }

  // Ask permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  // Android needs a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('exampulse', {
      name: 'ExamPulse',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#000666',
    });
  }

  // Get the Expo push token
  const token = await Notifications.getExpoPushTokenAsync({
    projectId: '5dc60540-b719-43f2-83f1-b6096e117106',
  });

  console.log('FCM Token:', token.data);

  // Save token to Firebase against this user
  await update(ref(database, `users/${userId}`), {
    fcmToken: token.data,
    tokenUpdatedAt: new Date().toISOString(),
  });

  return token.data;
};