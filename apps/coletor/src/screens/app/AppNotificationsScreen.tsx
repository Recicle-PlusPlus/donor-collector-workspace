import React from 'react';
import { useNavigation } from '@react-navigation/native';

import { NotificationsScreen } from '@workspace/ui/src/screens/NotificationsScreen';
import { NotificationItem } from '@workspace/db/src/hooks/useNotifications';

export function AppNotificationsScreen() {
  const navigation = useNavigation<any>();

  return (
    <NotificationsScreen
      onBackPress={() => navigation.goBack()}
      onNotificationClick={(item: NotificationItem) => {
        if (item.type === 'new_message' && item.data?.donation_id) {
          navigation.navigate('Chat', { donationId: item.data.donation_id });
        } else if (
          item.type === 'donation_accepted' &&
          item.data?.donation_id
        ) {
          navigation.navigate('DonationAccept', {
            donationId: item.data.donation_id,
          });
        }
      }}
    />
  );
}
