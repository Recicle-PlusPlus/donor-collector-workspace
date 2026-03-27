import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  List,
  Card,
  Button,
  ActivityIndicator,
  Chip,
  Paragraph,
} from 'react-native-paper';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@workspace/ui';
import { supabase } from '@workspace/db';
import { useAuth } from '../../contexts/AuthContext';

import { useGetDonationDetails } from '../../hooks/useGetDonationDetails';

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

const DAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export function DonationAccept() {
  const navigation = useNavigation<AcceptScreenNavigationProp>();
  const route = useRoute<AcceptScreenRouteProp>();
  const { donationId } = route.params;
  const { user } = useAuth();

  const insets = useSafeAreaInsets();
  const { donation, loading, error } = useGetDonationDetails(donationId);
  const [accepting, setAccepting] = useState(false);

  const handleAcceptDonation = async () => {
    if (!user) return;

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

  if (loading) {
    return (
      <ActivityIndicator
        style={{ flex: 1, justifyContent: 'center' }}
        size="large"
        color={colors.primary}
      />
    );
  }

  if (error || !donation) {
    return (
      <Text style={styles.centeredText}>
        Erro ao carregar os detalhes da coleta.
      </Text>
    );
  }

  const { address, items, schedules, notes, donor, status } = donation;
  const isPending = status === 'pending';

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
    <>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: isPending ? 100 : insets.bottom + 20,
        }}>
        {/* CARD PRINCIPAL - MATERIAIS */}
        <Card style={styles.card}>
          <Card.Title
            title="O que recolher?"
            titleStyle={styles.cardTitle}
            right={() => (
              <Chip
                style={{
                  backgroundColor: isPending ? '#f59e0b' : colors.primary,
                  marginRight: 10,
                }}
                textStyle={{ color: 'white' }}>
                {isPending ? 'Disponível' : 'Em Andamento'}
              </Chip>
            )}
          />
          <Card.Content>
            {items.map((item: any, index: number) => (
              <List.Item
                key={index}
                title={item.material?.name || 'Material'}
                description={`Aprox. ${item.weight_kg} kg`}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                left={() => <List.Icon icon="recycle" color={colors.primary} />}
              />
            ))}
          </Card.Content>
        </Card>

        {/* CARD - ENDEREÇO E HORÁRIOS */}
        <Card style={styles.card}>
          <Card.Content>
            <List.Section>
              <List.Subheader style={styles.subheader}>
                Local da Coleta
              </List.Subheader>
              <List.Item
                title={`${address?.street}, ${address?.num}`}
                description={`${address?.neighborhood} - ${address?.city}\n${address?.complement ? `Complemento: ${address.complement}` : ''}`}
                titleStyle={styles.listItemTitle}
                descriptionStyle={styles.listItemDescription}
                titleNumberOfLines={10}
                descriptionNumberOfLines={10}
                left={() => (
                  <List.Icon icon="map-marker" color={colors.primary} />
                )}
              />
            </List.Section>

            <List.Section>
              <List.Subheader style={styles.subheader}>
                Disponibilidade do Doador
              </List.Subheader>
              {renderSchedules()}
            </List.Section>

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

        {/* INFORMAÇÕES DO DOADOR */}
        <Card style={[styles.card, { marginBottom: 40 }]}>
          <Card.Content>
            <List.Section>
              <List.Subheader style={styles.subheader}>Doador</List.Subheader>
              <List.Item
                title={donor?.name}
                description={
                  isPending
                    ? 'O chat será liberado ao aceitar a coleta'
                    : 'Clique no botão abaixo para conversar'
                }
                titleStyle={styles.listItemTitle}
                left={() => (
                  <List.Icon icon="account-circle" color={colors.primary} />
                )}
              />

              {!isPending && (
                <Button
                  mode="contained"
                  icon="chat-processing"
                  onPress={() =>
                    navigation.navigate('Chat', { donationId: donationId })
                  }
                  style={{ marginTop: 10 }}
                  buttonColor={colors.primary}
                  textColor="#FFF">
                  Abrir Chat
                </Button>
              )}
            </List.Section>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* BOTÃO FIXO NO RODAPÉ SE ESTIVER PENDENTE */}
      {isPending && (
        <View
          style={[
            styles.footerContainer,
            { paddingBottom: Math.max(insets.bottom, 15) }, // Mantém pelo menos 15px se não houver margem do sistema
          ]}>
          <Button
            mode="contained"
            onPress={handleAcceptDonation}
            loading={accepting}
            disabled={accepting}
            style={styles.acceptButton}
            buttonColor={colors.primary}
            textColor={colors.textLight}
            icon="check-circle-outline">
            Aceitar Coleta
          </Button>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 10,
    paddingTop: 20,
  },
  card: { backgroundColor: colors.surface, marginBottom: 15, elevation: 2 },
  centeredText: {
    textAlign: 'center',
    marginTop: 50,
    color: colors.textSecondary,
  },
  cardTitle: { color: colors.primaryDark, fontWeight: 'bold' },
  subheader: {
    color: colors.textSecondary,
    fontWeight: 'bold',
    fontSize: 14,
    paddingLeft: 0,
  },
  listItemTitle: { color: colors.text, fontSize: 16, fontWeight: 'bold' },
  listItemDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  notes: {
    color: colors.text,
    fontSize: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  footerContainer: {
    backgroundColor: colors.surface,
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 10,
  },
  acceptButton: { paddingVertical: 5, borderRadius: 25 },
});
