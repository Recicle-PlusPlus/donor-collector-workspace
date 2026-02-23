import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  List,
  Card,
  Button,
  Paragraph,
  ActivityIndicator,
  Chip,
} from 'react-native-paper';

import { colors } from '@workspace/ui';
import { supabase } from '@workspace/db';

import { useGetDonationDetails } from '../../hooks/useGetDonationDetails';
import { RootStackParamList } from '../../navigation';

type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'DonationDetails'>;
type DetailsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DonationDetails'
>;

export function DonationDetailsScreen() {
  const navigation = useNavigation<DetailsScreenNavigationProp>();
  const route = useRoute<DetailsScreenRouteProp>();
  const { donationId } = route.params;

  const {
    donation: initialDonation,
    loading,
    error,
  } = useGetDonationDetails(donationId);
  const [donationDetails, setDonationDetails] = useState<any>(null);

  useEffect(() => {
    if (initialDonation) setDonationDetails(initialDonation);
  }, [initialDonation]);

  const handleCancelDonation = async () => {
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

  const handleWhatsAppContact = () => {
    if (!donationDetails?.collector?.phone) {
      Alert.alert('Ops', 'O coletor não possui um telefone cadastrado.');
      return;
    }

    const numericPhone = donationDetails.collector.phone.replace(/\D/g, '');

    const finalPhone = numericPhone.startsWith('55')
      ? numericPhone
      : `55${numericPhone}`;

    const message = `Olá ${donationDetails.collector.name}, sou doador no app de Reciclagem e queria combinar os detalhes da coleta...`;
    const url = `https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`;

    // Tenta abrir o WhatsApp
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'Erro',
        'Não foi possível abrir o WhatsApp. Verifique se o aplicativo está instalado no seu celular.',
      );
    });
  };

  if (loading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, justifyContent: 'center' }}
        size="large"
        color={colors.primary}
      />
    );
  }
  if (error || !donationDetails) {
    return (
      <Text style={styles.centeredText}>
        Erro ao carregar os detalhes da coleta.
      </Text>
    );
  }

  const {
    status,
    address,
    items,
    scheduled_days,
    scheduled_time_slots,
    notes,
    collector,
    accepted_at,
  } = donationDetails;
  const canBeCancelled = status === 'pending' || status === 'accepted';

  const statusInfo: any = {
    pending: { text: 'Aguardando Coletor', color: '#f59e0b' },
    accepted: { text: 'Coleta Agendada', color: colors.primary },
    completed: { text: 'Concluída', color: colors.success },
    cancelled: { text: 'Cancelada', color: colors.error },
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Title
          title="Status da Coleta"
          titleStyle={styles.cardTitle}
          right={() => (
            <Chip
              style={{
                backgroundColor: statusInfo[status]?.color,
                marginRight: 10,
              }}
              textStyle={{ color: 'white' }}>
              {statusInfo[status]?.text}
            </Chip>
          )}
        />
        <Card.Content>
          <List.Section>
            <List.Subheader style={styles.subheader}>Materiais</List.Subheader>
            {items.map((item: any, index: number) => (
              <List.Item
                key={index}
                title={item.material.name}
                description={`${item.weight_kg} kg`}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                left={() => <List.Icon icon="recycle" color={colors.primary} />}
              />
            ))}
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>Endereço</List.Subheader>
            <List.Item
              title={`${address.street}, ${address.num}`}
              description={`${address.neighborhood} - ${address.city}`}
              titleStyle={styles.listItemTitle}
              descriptionStyle={styles.listItemDescription}
              left={() => (
                <List.Icon icon="map-marker" color={colors.primary} />
              )}
            />
          </List.Section>

          <List.Section>
            <List.Subheader style={styles.subheader}>
              Agendamento
            </List.Subheader>
            <List.Item
              title={scheduled_days.join(', ')}
              titleStyle={styles.listItemTitle}
              left={() => <List.Icon icon="calendar" color={colors.primary} />}
            />
            <List.Item
              title={scheduled_time_slots.join(', ')}
              titleStyle={styles.listItemTitle}
              left={() => (
                <List.Icon icon="clock-outline" color={colors.primary} />
              )}
            />
          </List.Section>

          {collector && (
            <List.Section>
              <List.Subheader style={styles.subheader}>
                Coletor(a) Responsável
              </List.Subheader>
              <List.Item
                title={collector.name}
                description={
                  (status === 'accepted' || status === 'completed') &&
                  accepted_at
                    ? `Aceita em: ${new Date(accepted_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
                    : 'Coletor atribuído'
                }
                titleStyle={styles.listItemTitle}
                descriptionStyle={{
                  color: colors.primary,
                  fontSize: 13,
                  marginTop: 2,
                }}
                left={() => <List.Icon icon="account" color={colors.primary} />}
              />

              <Button
                mode="contained"
                icon="chat-processing"
                onPress={() =>
                  navigation.navigate('Chat', { donationId: donationId })
                }
                style={styles.whatsappButton}
                buttonColor={colors.primary}
                textColor="#FFF">
                Abrir Chat
              </Button>
            </List.Section>
          )}

          {notes && (
            <List.Section>
              <List.Subheader style={styles.subheader}>
                Observações
              </List.Subheader>
              <Paragraph style={styles.notes}>{notes}</Paragraph>
            </List.Section>
          )}
        </Card.Content>
      </Card>

      {canBeCancelled && (
        <Button
          mode="contained"
          onPress={handleCancelDonation}
          style={styles.cancelButton}
          buttonColor={colors.error}
          icon="cancel">
          Cancelar Coleta
        </Button>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    paddingTop: 50,
  },
  card: { backgroundColor: colors.surface, marginBottom: 20, marginTop: 20 },
  centeredText: {
    textAlign: 'center',
    marginTop: 50,
    color: colors.textSecondary,
  },
  cancelButton: { margin: 10 },
  whatsappButton: { marginHorizontal: 16, marginTop: 10, marginBottom: 5 },
  cardTitle: { color: colors.primaryDark, fontWeight: 'bold' },
  subheader: { color: colors.textSecondary, fontWeight: 'bold', fontSize: 14 },
  listItemTitle: { color: colors.text, fontSize: 16 },
  listItemDescription: { color: colors.textSecondary, fontSize: 14 },
  notes: { paddingHorizontal: 16, color: colors.text, fontSize: 16 },
});
