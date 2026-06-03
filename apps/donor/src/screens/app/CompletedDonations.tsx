import React from 'react';
import { CompletedDonations } from '@workspace/ui/src/screens/SharedCompletedDonationsScreen';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

export function CompletedDonationsshare() {
  const { user } = useAuth();
  if (!user?.id) return;
  return (
    <CompletedDonations
      userId={user.id}
      userRole="donor"
      navigationRouteName="DonationDetails"
    />
  );
}
