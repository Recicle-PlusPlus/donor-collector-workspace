import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@workspace/ui';
import { supabase } from '@workspace/db';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { useGetDonationDetails } from '../../hooks/useGetDonationDetails';

import { SharedDonationDetailsScreen } from '@workspace/ui/src/components/SharedDonationDetailsScreen';

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
    <SharedDonationDetailsScreen
      donation={donation}
      loading={loading}
      role="collector"
      onAccept={handleAcceptDonation}
      onOpenChat={handleOpenChat}
    />
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
