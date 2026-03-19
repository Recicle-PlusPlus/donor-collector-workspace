import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
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

const DAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

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

  const { status, address, items, schedules, notes, collector, accepted_at } =
    donationDetails;

  const canBeCancelled = status === 'pending' || status === 'accepted';

  const statusInfo: any = {
    pending: { text: 'Aguardando Coletor', color: '#f59e0b' },
    accepted: { text: 'Coleta Agendada', color: colors.primary },
    completed: { text: 'Concluída', color: colors.success },
    cancelled: { text: 'Cancelada', color: colors.error },
  };

  const renderSchedules = () => {
    if (!schedules || schedules.length === 0) {
      return (
        <List.Item
          title="Nenhum horário definido"
          titleStyle={styles.listItemDescription}
          left={() => (
            <List.Icon icon="calendar-alert" color={colors.textSecondary} />
          )}
        />
      );
    }

    return schedules.map((schedule: any, index: number) => {
      const dayName = DAYS[schedule.day_of_week];
      const start = schedule.start_time?.substring(0, 5);
      const end = schedule.end_time?.substring(0, 5);

      return (
        <List.Item
          key={index}
          title={dayName}
          description={`${start} às ${end}`}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          left={() => (
            <List.Icon icon="calendar-clock" color={colors.primary} />
          )}
        />
      );
    });
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
              Disponibilidade
            </List.Subheader>
            {renderSchedules()}
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
