import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';
import {
  DonationRole,
  DonationStatus,
  formatCompletedAt,
  getDonationDisplayStatus,
} from '../utils/donation';

export interface DonationItem {
  id: string;
  status: DonationStatus;
  donation_schedules?: any[];
  donation_items?: any[];
  addresses?: any;
  completed_at?: string;
  donor_reviewed?: boolean;
  collector_reviewed?: boolean;
}

interface DonationCardProps {
  donation: DonationItem;
  onPress: () => void;
  viewerRole?: DonationRole;
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
  awaiting_review: {
    label: 'Aguardando Avaliação',
    icon: 'star-circle-outline',
    color: '#8b5cf6',
    bg: '#f3e8ff',
  },
};

const SHORT_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MAX_VISIBLE_DAYS = 3;

export const DonationCard = ({
  donation,
  onPress,
  viewerRole,
}: DonationCardProps) => {
  const displayStatus = getDonationDisplayStatus(donation, viewerRole);
  const currentStatus = statusConfig[displayStatus] || statusConfig.pending;
  const completedAt = formatCompletedAt(donation.completed_at);

  const renderSchedules = () => {
    if (
      !donation.donation_schedules ||
      donation.donation_schedules.length === 0
    ) {
      return <Text style={styles.textMuted}>Sem horário definido</Text>;
    }

    const uniqueDays = [
      ...new Set(donation.donation_schedules.map(s => s.day_of_week)),
    ].sort();
    const dayNames = uniqueDays.map(dayNum => SHORT_DAYS[dayNum]);

    const visible = dayNames.slice(0, MAX_VISIBLE_DAYS);
    const remaining = dayNames.length - MAX_VISIBLE_DAYS;

    return (
      <Text style={styles.textMuted} numberOfLines={1}>
        {visible.join(', ')}
        {remaining > 0 && (
          <Text style={styles.textHighlight}> +{remaining}</Text>
        )}
      </Text>
    );
  };

  const renderMaterials = () => {
    if (!donation.donation_items || donation.donation_items.length === 0)
      return null;

    const names = donation.donation_items
      .map(i => i.materials?.name || 'Material')
      .join(', ');

    const totalWeight = donation.donation_items.reduce(
      (sum, item) => sum + (Number(item.weight_kg) || 0),
      0,
    );

    return (
      <Text style={styles.textMuted} numberOfLines={1}>
        {names}
        {totalWeight > 0 && (
          <Text style={styles.textDark}>
            {' '}
            · Aprox. {totalWeight.toFixed(1)} kg
          </Text>
        )}
      </Text>
    );
  };

  const shortAddress = donation.addresses
    ? `${donation.addresses.street}, ${donation.addresses.num} - ${donation.addresses.neighborhood}`
    : 'Endereço indisponível';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.contentRow}>
        {/* Coluna Principal */}
        <View style={styles.mainColumn}>
          {/* Status */}
          <View style={styles.statusRow}>
            <View
              style={[styles.iconBox, { backgroundColor: currentStatus.bg }]}>
              <MaterialCommunityIcons
                name={currentStatus.icon as any}
                size={16}
                color={currentStatus.color}
              />
            </View>
            <Text style={[styles.statusText, { color: currentStatus.color }]}>
              {currentStatus.label}
            </Text>
          </View>

          {(displayStatus === 'completed' ||
            displayStatus === 'awaiting_review') &&
            completedAt && (
              <View style={styles.infoRow}>
                <MaterialCommunityIcons
                  name="calendar-check-outline"
                  size={16}
                  color={colors.success || '#10b981'}
                  style={styles.infoIcon}
                />
                <Text style={styles.completedAtText} numberOfLines={1}>
                  {displayStatus === 'completed'
                    ? 'Concluída'
                    : 'Entrega realizada'}{' '}
                  em {completedAt}
                </Text>
              </View>
            )}

          {/* Horários */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="calendar-blank-outline"
              size={16}
              color={colors.textSecondary}
              style={styles.infoIcon}
            />
            {renderSchedules()}
          </View>

          {/* Endereço */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="map-marker-outline"
              size={16}
              color={colors.textSecondary}
              style={styles.infoIcon}
            />
            <Text style={styles.textMedium} numberOfLines={1}>
              {shortAddress}
            </Text>
          </View>

          {/* Materiais */}
          <View style={styles.infoRow}>
            <MaterialCommunityIcons
              name="recycle"
              size={16}
              color={colors.primary}
              style={styles.infoIcon}
            />
            {renderMaterials()}
          </View>
        </View>

        {/* Chevron Direita */}
        <View style={styles.chevronCol}>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#CBD5E1"
          />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mainColumn: { flex: 1, gap: 8 },
  chevronCol: { paddingLeft: 10, justifyContent: 'center' },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: { fontSize: 14, fontWeight: 'bold' },

  infoRow: { flexDirection: 'row', alignItems: 'center', paddingRight: 10 },
  infoIcon: { marginRight: 8, width: 16, textAlign: 'center' },

  textMuted: {
    fontSize: 13,
    color: colors.textSecondary || '#64748b',
    flexShrink: 1,
  },
  textMedium: {
    fontSize: 13,
    color: colors.text || '#0f172a',
    fontWeight: '500',
    flexShrink: 1,
  },
  completedAtText: {
    fontSize: 13,
    color: colors.success || '#10b981',
    fontWeight: '600',
    flexShrink: 1,
  },
  textDark: { fontWeight: 'bold', color: colors.text || '#0f172a' },
  textHighlight: { fontWeight: 'bold', color: colors.primary },
});
