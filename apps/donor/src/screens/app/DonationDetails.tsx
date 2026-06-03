import React, { useEffect, useState } from 'react';
import { useRoute, useNavigation } from '@react-navigation/native';
import { supabase, useGetDonationDetails } from '@workspace/db';
import { SharedDonationDetailsScreen } from '@workspace/ui/src/components/SharedDonationDetailsScreen';
import { shouldRequestReview } from '@workspace/ui/src/utils/donation';
import { Alert, View } from 'react-native';
import { ReviewModal } from '@workspace/ui/src/components/ReviewModal';

export function DonationDetailsScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { donationId } = route.params;

  const { donation, loading } = useGetDonationDetails(donationId);

  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (shouldRequestReview(donation, 'donor')) {
      setShowReview(true);
    }
  }, [donation?.status, donation?.completed_at, donation?.donor_reviewed]);

  const handleReviewSuccess = () => {
    setShowReview(false);
    navigation.navigate('Main', { refresh: true });
  };

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
    <View style={{ flex: 1 }}>
      <SharedDonationDetailsScreen
        donation={donation}
        loading={loading}
        role="donor"
        onCancel={handleCancel}
        onOpenChat={handleOpenChat}
      />

      <ReviewModal
        visible={showReview}
        title="Seu item foi coletado! Como foi a experiência?"
        donationId={donationId}
        revieweeId={donation?.collector_id || donation?.collector?.id}
        onClose={() => setShowReview(false)}
        onSuccess={handleReviewSuccess}
      />
    </View>
  );
}
