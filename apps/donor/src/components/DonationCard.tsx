import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card, Chip, Paragraph } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { colors } from '@workspace/ui';
import { RootStackParamList } from '../navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Main'>;

export const DonationCard = ({ item }: { item: any }) => {
  const navigation = useNavigation<NavigationProp>();

  const statusInfo: any = {
    pending: { text: 'Aguardando Coletor', color: '#f59e0b' },
    accepted: { text: 'Coleta Agendada', color: colors.primary },
    completed: { text: 'Concluída', color: colors.success }, // Corrigido para success
    cancelled: { text: 'Cancelada', color: colors.error }, // Corrigido para error
  };

  const handleCardPress = () => {
    navigation.navigate('DonationDetails', { donationId: item.id });
  };

  // Previne erros caso a doação não tenha itens cadastrados
  const materialsText =
    item.donation_items?.map((di: any) => di.materials?.name).join(', ') ||
    'Nenhum material';

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

          <Paragraph style={styles.cardMaterials}>{materialsText}</Paragraph>

          {item.addresses && (
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="map-marker-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={
                  styles.cardAddressText
                }>{`${item.addresses.street}, ${item.addresses.num}`}</Text>
            </View>
          )}

          {item.collector && (
            <View style={styles.cardRow}>
              <MaterialCommunityIcons
                name="account-outline"
                size={16}
                color={colors.textSecondary}
              />
              <Text
                style={
                  styles.cardAddressText
                }>{`Coletor(a): ${item.collector.name}`}</Text>
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
    marginTop: 4,
  },
  cardAddressText: {
    color: colors.textSecondary,
    marginLeft: 8,
    fontSize: 12,
  },
});
