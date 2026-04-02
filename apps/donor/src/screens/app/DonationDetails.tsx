import React, { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '@workspace/db';
import { SharedDonationDetailsScreen } from '@workspace/ui/src/components/SharedDonationDetailsScreen';
import { useGetDonationDetails } from '../../hooks/useGetDonationDetails';
import { Alert } from 'react-native';

export function DonationDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { donationId } = route.params;

  const { donation, loading } = useGetDonationDetails(donationId);

  const handleCancel = async () => {
    Alert.alert(
      'Confirmar Cancelamento',
      'Tem certeza de que deseja cancelar esta coleta?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim, Cancelar',
          style: 'destructive',
          onPress: async () => {
            const { error: updateError } = await supabase
              .from('donations')
              .update({ status: 'cancelled' })
              .eq('id', donationId);

            if (updateError) {
              Alert.alert(
                'Erro',
                'Não foi possível cancelar a coleta. Tente novamente.',
              );
            } else {
              navigation.navigate('Main', {
                refresh: true,
                snackbarMessage: 'Coleta cancelada com sucesso!',
              });
            }
          },
        },
      ],
    );
  };

  const handleOpenChat = () => {
    navigation.navigate('Chat', { donationId });
  };

  return (
    <SharedDonationDetailsScreen
      donation={donation}
      loading={loading}
      role="donor"
      onCancel={handleCancel}
      onOpenChat={handleOpenChat}
    />
  );
}
