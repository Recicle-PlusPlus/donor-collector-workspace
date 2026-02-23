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
  ActivityIndicator,
  Chip,
  Paragraph,
} from 'react-native-paper';

import { colors } from '@workspace/ui';
import { supabase } from '@workspace/db';
import { useAuth } from '../../contexts/AuthContext';

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

  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  // Busca os detalhes completos da doação
  useEffect(() => {
    async function fetchDonationDetails() {
      setLoading(true);
      const { data, error } = await supabase
        .from('donations')
        .select(
          `
          id, status, created_at, notes, scheduled_days, scheduled_time_slots,
          address:addresses ( street, num, neighborhood, city, state, cep, complement ),
          donor:users!donor_id ( name, photo_url, phone ),
          items:donation_items ( weight_kg, material:materials ( name ) )
        `,
        )
        .eq('id', donationId)
        .single();

      if (data) setDonation(data);
      if (error) console.error('Erro ao buscar detalhes:', error);
      setLoading(false);
    }

    fetchDonationDetails();
  }, [donationId]);

  // Função principal para aceitar a coleta
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

            // 1. Atualiza o status para 'accepted'
            // 2. Registra o ID do coletor logado como o responsável
            const { error } = await supabase
              .from('donations')
              .update({
                status: 'accepted',
                collector_id: user.id,
                accepted_at: new Date().toISOString(),
              })
              .eq('id', donationId);

            setAccepting(false);

            if (error) {
              Alert.alert(
                'Erro',
                'Não foi possível aceitar a coleta. Tente novamente.',
              );
            } else {
              Alert.alert(
                'Sucesso!',
                'Coleta aceita! Agora você pode combinar os detalhes com o doador pelo WhatsApp.',
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

  if (!donation) {
    return (
      <Text style={styles.centeredText}>
        Erro ao carregar os detalhes da coleta.
      </Text>
    );
  }

  const {
    address,
    items,
    scheduled_days,
    scheduled_time_slots,
    notes,
    donor,
    status,
  } = donation;
  const isPending = status === 'pending';

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
                descriptionNumberOfLines={3}
                left={() => (
                  <List.Icon icon="map-marker" color={colors.primary} />
                )}
              />
            </List.Section>

            <List.Section>
              <List.Subheader style={styles.subheader}>
                Disponibilidade do Doador
              </List.Subheader>
              <List.Item
                title={scheduled_days.join(', ')}
                titleStyle={styles.listItemTitle}
                left={() => (
                  <List.Icon icon="calendar-check" color={colors.primary} />
                )}
              />
              <List.Item
                title={scheduled_time_slots.join(', ')}
                titleStyle={styles.listItemTitle}
                left={() => (
                  <List.Icon icon="clock-outline" color={colors.primary} />
                )}
              />
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
        <View style={styles.footerContainer}>
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
