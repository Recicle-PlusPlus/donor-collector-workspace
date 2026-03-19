import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@workspace/ui';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const DonationCard = ({ item }: { item: any }) => {
  const navigation = useNavigation<NavigationProp>();

  const statusInfo: any = {
    pending: { text: 'Aguardando Coletor', color: '#f59e0b' },
    accepted: { text: 'Coleta Agendada', color: colors.primary },
    completed: { text: 'Concluída', color: colors.success },
    cancelled: { text: 'Cancelada', color: colors.error },
  };

  const handleCardPress = () => {
    navigation.navigate('DonationDetails', { donationId: item.id });
  };

  const materialsText =
    item.donation_items?.map((di: any) => di.materials?.name).join(', ') ||
    'Nenhum material';

  // Lógica inteligente para resumir os horários no Card
  let scheduleText = 'Horário a combinar';
  if (item.donation_schedules && item.donation_schedules.length > 0) {
    const firstSchedule = item.donation_schedules[0];
    const dayName = DAYS[firstSchedule.day_of_week];

    // O Supabase retorna TIME como "HH:MM:SS", o substring(0,5) pega só "HH:MM"
    const start = firstSchedule.start_time?.substring(0, 5);
    const end = firstSchedule.end_time?.substring(0, 5);

    scheduleText = `${dayName}, ${start} às ${end}`;

    // Se tiver mais de um horário, avisa que tem mais opções
    if (item.donation_schedules.length > 1) {
      scheduleText += ` (+${item.donation_schedules.length - 1})`;
    }
  }

  return (
    <TouchableOpacity onPress={handleCardPress} activeOpacity={0.8}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Paragraph style={styles.cardDate}>
              {new Date(item.created_at).toLocaleDateString('pt-BR')}
            </Paragraph>
            <Chip
              style={{
                backgroundColor: statusInfo[item.status]?.color || '#888',
              }}
              textStyle={{ color: 'white', fontSize: 12 }}>
              {statusInfo[item.status]?.text || 'Desconhecido'}
            </Chip>
          </View>

          <Paragraph style={styles.cardMaterials} numberOfLines={1}>
            {materialsText}
          </Paragraph>

          {/* NOVO BLOCO DE HORÁRIOS */}
          <View style={styles.cardRow}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.cardInfoText}>{scheduleText}</Text>
          </View>

          {item.addresses && (
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.cardInfoText} numberOfLines={1}>
                {`${item.addresses.street}, ${item.addresses.num}`}
              </Text>
            </View>
          )}

          {item.collector && (
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text style={styles.cardInfoText} numberOfLines={1}>
                {`Coletor: ${item.collector.name}`}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 15,
    width: 280,
    backgroundColor: colors.surface,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardDate: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  cardMaterials: {
    color: colors.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  cardInfoText: {
    color: colors.textSecondary,
    marginLeft: 8,
    fontSize: 12,
    flex: 1,
  },
});
