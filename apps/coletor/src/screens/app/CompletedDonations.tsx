import React from 'react';
import { CompletedDonationsScreen } from '@workspace/ui/src/screens/CompletedDonationsScreen';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

export function CompletedDonations() {
  const { user } = useAuth();
  if (!user?.id) return;
  return (
    <CompletedDonationsScreen
      userId={user.id}
      userRole="collector"
      navigationRouteName="DonationAccept"
    />
  );
}
