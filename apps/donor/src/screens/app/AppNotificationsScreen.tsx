import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { NotificationsScreen } from '@workspace/ui/src/screens/NotificationsScreen';
import { NotificationItem } from '@workspace/db/src/hooks/useNotifications';

export function AppNotificationsScreen() {
  const navigation = useNavigation<any>();
  const {
    notificationPermission,
    requestNotificationPermission,
    openNotificationSettings,
  } = useAuth();
  const showNotificationPrompt =
    notificationPermission !== null && !notificationPermission.granted;

  const handleEnableNotificationsPress = async () => {
    if (notificationPermission?.canAskAgain ?? true) {
      const updatedPermission = await requestNotificationPermission();

      if (!updatedPermission.granted && !updatedPermission.canAskAgain) {
        await openNotificationSettings();
      }

      return;
    }

    await openNotificationSettings();
  };

  return (
    <NotificationsScreen
      onBackPress={() => navigation.goBack()}
      showNotificationPrompt={showNotificationPrompt}
      onEnableNotificationsPress={handleEnableNotificationsPress}
      onNotificationClick={(item: NotificationItem) => {
        if (item.type === 'new_message' && item.data?.donation_id) {
          navigation.navigate('Chat', { donationId: item.data.donation_id });
        } else if (
          item.type === 'donation_accepted' &&
          item.data?.donation_id
        ) {
          navigation.navigate('DonationDetails', {
            donationId: item.data.donation_id,
          });
        }
      }}
    />
  );
}
