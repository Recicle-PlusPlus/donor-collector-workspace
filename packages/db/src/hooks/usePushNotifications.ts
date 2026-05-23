import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '../client';

type PushPermissionStatus = 'undetermined' | 'denied' | 'granted';

interface UsePushNotificationsOptions {
  autoRequest?: boolean;
}

export function usePushNotifications(options: UsePushNotificationsOptions = {}) {
  const { autoRequest = true } = options;
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();
  const [permissionStatus, setPermissionStatus] =
    useState<PushPermissionStatus>('undetermined');
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [permissionRequesting, setPermissionRequesting] = useState(false);

  useEffect(() => {
    const Notifications =
      require('expo-notifications') as typeof import('expo-notifications');

    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });

    const initialize = async () => {
      if (autoRequest) {
        const token = await registerForPushNotificationsAsync(Notifications);
        setExpoPushToken(token);
      } else {
        await refreshPermissionStatus(Notifications, 'manual');
      }
    };

    void initialize();
  }, [autoRequest]);

  const refreshPermissionStatus = async (
    Notifications: typeof import('expo-notifications'),
    context: 'launch' | 'manual',
  ) => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status as PushPermissionStatus);
      setPermissionChecked(true);
      console.log(
        `[usePushNotifications] Notification permission status (${context}): ${status}.`,
      );
      return status as PushPermissionStatus;
    } catch (error) {
      console.error(
        '[usePushNotifications] Failed to read notification permission status:',
        error,
      );
      setPermissionChecked(true);
      return 'undetermined' as PushPermissionStatus;
    }
  };

  const requestPermission = async () => {
    const Notifications =
      require('expo-notifications') as typeof import('expo-notifications');

    setPermissionRequesting(true);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPermissionStatus(status as PushPermissionStatus);
      setPermissionChecked(true);
      console.log(
        `[usePushNotifications] Notification permission request result: ${status}.`,
      );

      if (status !== 'granted') {
        console.log(
          '[usePushNotifications] Notification permission denied by user.',
        );
      }

      return status as PushPermissionStatus;
    } catch (error) {
      console.error(
        '[usePushNotifications] Failed to request notification permission:',
        error,
      );
      return 'undetermined' as PushPermissionStatus;
    } finally {
      setPermissionRequesting(false);
    }
  };

  async function registerForPushNotificationsAsync(
    Notifications: typeof import('expo-notifications'),
  ) {
    let token;

    if (Platform.OS === 'android') {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (error) {
        console.error(
          '[usePushNotifications] Failed to set Android notification channel:',
          error,
        );
      }
    }

    if (Device.isDevice) {
      let finalStatus = await refreshPermissionStatus(Notifications, 'launch');

      if (finalStatus !== 'granted') {
        finalStatus = await requestPermission();
      }

      if (finalStatus !== 'granted') {
        console.log(
          '[usePushNotifications] Push permission not granted. Skipping token registration.',
        );
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn(
          '[usePushNotifications] Project ID not found',
        );
      }

      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      } catch (e) {
        console.error('[usePushNotifications] Error generating token:', e);
      }
    } else {
      console.log(
        '[usePushNotifications] Push Notifications only works on physical devices.',
      );
    }

    return token;
  }

  const saveTokenToDatabase = async (userId: string, token: string) => {
    if (!userId || !token) return;

    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) console.error('[usePushNotifications] Error saving push token to Supabase:', error);
  };

  return {
    expoPushToken,
    saveTokenToDatabase,
    permissionStatus,
    permissionChecked,
    permissionRequesting,
    requestPermission,
  };
}
