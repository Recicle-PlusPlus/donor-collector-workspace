import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@workspace/ui';
import {
  supabase,
  useCompleteDonation,
  useGetDonationDetails,
} from '@workspace/db';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { shouldRequestReview } from '@workspace/ui/src/utils/donation';

import { SharedDonationDetailsScreen } from '@workspace/ui/src/components/SharedDonationDetailsScreen';
import { ReviewModal } from '@workspace/ui/src/components/ReviewModal';

type RootStackParamList = {
  Main: { refresh?: boolean };
  DonationAccept: { donationId: string };
  Chat: { donationId: string };
};

type AcceptScreenRouteProp = RouteProp<RootStackParamList, 'DonationAccept'>;
type AcceptScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DonationAccept'
>;

export function DonationAccept() {
  const navigation = useNavigation<AcceptScreenNavigationProp>();
  const route = useRoute<AcceptScreenRouteProp>();
  const { donationId } = route.params;
  const { user } = useAuth();

  const { donation, loading, error } = useGetDonationDetails(donationId);
  const [accepting, setAccepting] = useState(false);
  const { completeDonation } = useCompleteDonation();
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (shouldRequestReview(donation, 'collector')) {
      setShowReview(true);
    }
  }, [donation?.status, donation?.completed_at, donation?.collector_reviewed]);

  const handleAcceptDonation = async () => {
    if (!user || accepting) return;

    Alert.alert(
      'Confirmar Coleta',
      'Você se compromete a realizar esta coleta nos dias/horários agendados?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Aceitar',
          style: 'default',
          onPress: async () => {
            setAccepting(true);

            const { error: updateError } = await supabase
              .from('donations')
              .update({
                status: 'accepted',
                collector_id: user.id,
                accepted_at: new Date().toISOString(),
              })
              .eq('id', donationId);

            setAccepting(false);

            if (updateError) {
              Alert.alert(
                'Erro',
                'Não foi possível aceitar a coleta. Tente novamente.',
              );
            } else {
              Alert.alert(
                'Sucesso!',
                'Coleta aceita! Agora você pode combinar os detalhes com o doador pelo Chat.',
              );
              navigation.navigate('Main', { refresh: true });
            }
          },
        },
      ],
    );
  };

  const handleOpenChat = () => {
    navigation.navigate('Chat', { donationId });
  };
  const handleComplete = async () => {
    Alert.alert(
      'Finalizar Coleta',
      'Tem a certeza de que já recolheu os itens desta doação?',
      [
        { text: 'Ainda não', style: 'cancel' },
        {
          text: 'Sim, recolhi',
          style: 'default',
          onPress: async () => {
            const completeResult = await completeDonation(donationId);

            if (!completeResult.success) {
              Alert.alert('Erro', 'Não foi possível finalizar a coleta.');
              return;
            }

            setShowReview(true);
          },
        },
      ],
    );
  };

  const handleReviewSuccess = () => {
    setShowReview(false);
    navigation.navigate('Main', { refresh: true });
  };

  const handleReviewClose = async () => {
    Alert.alert('Sucesso!', 'Coleta finalizada sem avaliação.');
    setShowReview(false);
    navigation.navigate('Main', { refresh: true });
  };

  if (error || (!loading && !donation)) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          Erro ao carregar os detalhes da coleta.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SharedDonationDetailsScreen
        donation={donation}
        loading={loading}
        role="collector"
        onAccept={handleAcceptDonation}
        onOpenChat={handleOpenChat}
        onComplete={handleComplete}
      />
      <ReviewModal
        visible={showReview}
        title="Coleta finalizada! Como foi o doador?"
        donationId={donationId}
        revieweeId={donation?.donor?.id || (donation as any)?.donor_id}
        onClose={handleReviewClose}
        onSuccess={handleReviewSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 20,
  },
  errorText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
  },
});
