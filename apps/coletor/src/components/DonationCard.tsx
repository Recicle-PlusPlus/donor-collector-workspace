import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';
import { useNavigation } from '@react-navigation/native';

interface DonationCardProps {
  donation: any;
  onPressDetails: () => void;
  isPending?: boolean; // Se true, é uma coleta nova. Se false, é uma em andamento.
}

export const DonationCard = ({
  donation,
  onPressDetails,
  isPending = true,
}: DonationCardProps) => {
  const navigation = useNavigation<any>();

  const { address, donor, items, status } = donation;

  // Junta os nomes dos materiais para exibir (Ex: Plástico, Metal)
  const materialsString =
    items?.map((i: any) => i.material?.name).join(', ') || 'Materiais variados';

  // Soma o peso total estimado
  const totalWeight =
    items?.reduce((sum: number, item: any) => sum + (item.weight_kg || 0), 0) ||
    0;

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPressDetails} 
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <View style={styles.materialsBadge}>
          <Text style={styles.materialsText} numberOfLines={1}>
            {materialsString}
          </Text>
        </View>
        <Text style={styles.weightText}>{totalWeight} kg</Text>
      </View>

      <View style={styles.infoRow}>
        <MaterialCommunityIcons
          name="map-marker-outline"
          size={20}
          color={colors.primary}
        />
        <Text style={styles.infoText} numberOfLines={1}>
          {address?.neighborhood} - {address?.city}
        </Text>
      </View>

      {/* Exibe o Doador e o Botão correto dependendo do status */}
      <View style={styles.footerRow}>
        <View style={styles.donorInfo}>
          {donor?.photo_url ? (
            <View style={styles.avatarMock}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          ) : (
            <View style={styles.avatarMock}>
              <MaterialCommunityIcons name="account" size={20} color="#fff" />
            </View>
          )}
          <Text style={styles.donorName} numberOfLines={1}>
            {donor?.name}
          </Text>
        </View>

        {isPending ? (
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onPressDetails}>
            <Text style={styles.detailsButtonText}>Ver Detalhes</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.whatsappButton, { backgroundColor: colors.primary }]}
            onPress={() =>
              navigation.navigate('Chat', { donationId: donation.id })
            }>
            <MaterialCommunityIcons
              name="chat-processing"
              size={18}
              color="#fff"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.whatsappButtonText}>Chat</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    width: 280, // Largura fixa boa para scroll horizontal
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  materialsBadge: {
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flex: 1,
    marginRight: 10,
  },
  materialsText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 12,
  },
  weightText: { fontWeight: 'bold', color: colors.textSecondary },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  infoText: { marginLeft: 5, color: colors.text, flex: 1 },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  donorInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarMock: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  donorName: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  detailsButton: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  detailsButtonText: {
    color: colors.primaryDark,
    fontWeight: 'bold',
    fontSize: 13,
  },
  whatsappButton: {
    flexDirection: 'row',
    backgroundColor: '#25D366',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignItems: 'center',
  },
  whatsappButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
});
