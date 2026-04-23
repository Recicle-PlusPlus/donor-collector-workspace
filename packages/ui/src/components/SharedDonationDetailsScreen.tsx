import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface DonationDetailData {
  id: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  items?: any[];
  schedules?: any[];
  address?: any;
  notes?: string;
  collector?: { name: string; id: string };
  donor?: { name: string; id: string };
  accepted_at?: string;
}

interface SharedDetailsProps {
  donation: DonationDetailData;
  loading: boolean;
  role: 'donor' | 'collector';
  onCancel?: () => void;
  onAccept?: () => void;
  onOpenChat?: () => void;
}

const statusConfig = {
  pending: {
    label: 'Aguardando Coletor',
    icon: 'clock-outline',
    color: '#f59e0b',
    bg: 'rgba(245, 158, 11, 0.15)',
  },
  accepted: {
    label: 'Coleta Agendada',
    icon: 'truck-outline',
    color: colors.primary,
    bg: 'rgba(45, 125, 70, 0.15)',
  },
  completed: {
    label: 'Concluída',
    icon: 'check-circle-outline',
    color: colors.success || '#10b981',
    bg: 'rgba(16, 185, 129, 0.15)',
  },
  cancelled: {
    label: 'Cancelada',
    icon: 'close-circle-outline',
    color: colors.error || '#ef4444',
    bg: 'rgba(239, 68, 68, 0.15)',
  },
};

const DAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];

export const SharedDonationDetailsScreen = ({
  donation,
  loading,
  role,
  onCancel,
  onAccept,
  onOpenChat,
}: SharedDetailsProps) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  if (loading || !donation) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const currentStatus = statusConfig[donation.status] || statusConfig.pending;
  const isPending = donation.status === 'pending';
  const isAcceptedOrCompleted =
    donation.status === 'accepted' || donation.status === 'completed';

  const renderMaterials = () => {
    const items = donation.items || [];
    const totalWeight = items.reduce(
      (sum, item) => sum + (Number(item.weight_kg) || 0),
      0,
    );

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="recycle"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>Materiais</Text>
        </View>

        <View style={styles.cardBody}>
          {items.map((mat, index) => (
            <View key={index} style={styles.rowBetween}>
              <Text style={styles.textMain}>
                {mat.material?.name || 'Material'}
              </Text>
              <View style={styles.weightBadge}>
                <MaterialCommunityIcons
                  name="weight"
                  size={14}
                  color={colors.textSecondary}
                />
                <Text style={styles.weightText}>{mat.weight_kg} kg</Text>
              </View>
            </View>
          ))}

          <View style={styles.separator} />

          <View style={styles.rowBetween}>
            <Text style={styles.textSemiBold}>Total estimado</Text>
            <Text style={[styles.textBold, { color: colors.primary }]}>
              {totalWeight.toFixed(1)} kg
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAddress = () => {
    const address = donation.address;
    if (!address) return null;

    const fullAddress = `${address.street}, ${address.num}\n${address.neighborhood} - ${address.city}${address.complement ? `\nComplemento: ${address.complement}` : ''}`;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="map-marker-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>Endereço</Text>
        </View>
        <Text style={styles.textContent}>{fullAddress}</Text>
      </View>
    );
  };

  const renderSchedules = () => {
    const schedules = donation.schedules || [];

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons
            name="calendar-month-outline"
            size={20}
            color={colors.primary}
          />
          <Text style={styles.cardTitle}>Horários Disponíveis</Text>
        </View>

        <View style={styles.cardBody}>
          {schedules.length === 0 ? (
            <Text style={styles.textMuted}>Nenhum horário definido.</Text>
          ) : (
            schedules.map((s, index) => {
              const start = s.start_time?.substring(0, 5);
              const end = s.end_time?.substring(0, 5);
              return (
                <View key={index} style={styles.rowBetween}>
                  <Text style={styles.textMain}>{DAYS[s.day_of_week]}</Text>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeText}>
                      {start} às {end}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </View>
    );
  };

  const renderActionBar = () => {
    if (role === 'donor') {
      const canCancel = isPending || donation.status === 'accepted';

      return (
        <View
          style={[
            styles.actionBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 },
          ]}>
          {canCancel && (
            <TouchableOpacity style={styles.btnOutlineError} onPress={onCancel}>
              <Text style={styles.btnOutlineErrorText}>Cancelar Doação</Text>
            </TouchableOpacity>
          )}
          {isAcceptedOrCompleted && (
            <TouchableOpacity style={styles.btnPrimary} onPress={onOpenChat}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.btnPrimaryText}>Falar com Coletor</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    // COLETOR vendo a doação
    if (role === 'collector') {
      return (
        <View
          style={[
            styles.actionBar,
            { paddingBottom: insets.bottom > 0 ? insets.bottom + 10 : 20 },
          ]}>
          {isPending && (
            <TouchableOpacity style={styles.btnPrimary} onPress={onAccept}>
              <Text style={styles.btnPrimaryText}>Aceitar Coleta</Text>
            </TouchableOpacity>
          )}
          {isAcceptedOrCompleted && (
            <TouchableOpacity style={styles.btnPrimary} onPress={onOpenChat}>
              <MaterialCommunityIcons
                name="chat-processing-outline"
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.btnPrimaryText}>Falar com Doador</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Top Bar Navigation Embutida */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons
              name="arrow-left"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes da Doação</Text>
        </View>

        {/* Card de Status */}
        <View style={[styles.card, styles.statusCard]}>
          <View style={[styles.iconBox, { backgroundColor: currentStatus.bg }]}>
            <MaterialCommunityIcons
              name={currentStatus.icon as any}
              size={24}
              color={currentStatus.color}
            />
          </View>
          <View>
            <Text style={styles.statusLabel}>Status</Text>
            <Text style={[styles.statusValue, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>
        </View>

        {renderMaterials()}
        {renderAddress()}
        {renderSchedules()}

        {/* Observações */}
        <View style={[styles.card, { marginBottom: 40 }]}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={20}
              color={colors.primary}
            />
            <Text style={styles.cardTitle}>Observações</Text>
          </View>
          <Text style={styles.textContent}>
            {donation.notes || 'Nenhuma observação adicionada.'}
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Action Bar */}
      {renderActionBar()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F5F9F7' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 20, paddingTop: 50, paddingBottom: 100 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 15,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },

  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 1,
  },
  statusCard: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 2,
  },
  statusValue: { fontSize: 16, fontWeight: 'bold' },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  cardBody: { gap: 12 },

  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textMain: { fontSize: 15, color: colors.text },
  textSemiBold: { fontSize: 15, fontWeight: '600', color: colors.text },
  textBold: { fontSize: 16, fontWeight: 'bold' },
  textContent: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },
  textMuted: { color: colors.textSecondary, fontStyle: 'italic' },

  weightBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weightText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },

  timeBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  timeText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  separator: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 4 },

  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    gap: 12,
    elevation: 10,
  },
  btnOutlineError: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutlineErrorText: {
    color: colors.error || '#EF4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnPrimary: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btnPrimaryText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
});
