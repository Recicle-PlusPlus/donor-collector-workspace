import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import * as Device from 'expo-device';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { supabase } from '../client';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

export function usePushNotifications() {
  const [expoPushToken, setExpoPushToken] = useState<string | undefined>();

  useEffect(() => {
    if (isExpoGo) {
      return;
    }

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

    registerForPushNotificationsAsync(Notifications).then(token =>
      setExpoPushToken(token),
    );
  }, []);

  async function registerForPushNotificationsAsync(
    Notifications: typeof import('expo-notifications'),
  ) {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Falha ao obter permissão para push notification!');
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId;

      if (!projectId) {
        console.warn(
          'Project ID não encontrado. Verifique se você rodou eas init.',
        );
      }

      try {
        token = (
          await Notifications.getExpoPushTokenAsync({
            projectId,
          })
        ).data;
      } catch (e) {
        console.error('Erro ao gerar token:', e);
      }
    } else {
      console.log(
        'Push Notifications só funcionam em dispositivos físicos, não em simuladores.',
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

    if (error) console.error('Erro ao salvar push token no Supabase:', error);
  };

  return { expoPushToken, saveTokenToDatabase };
}
