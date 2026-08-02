import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@workspace/ui';
import { FilterChip } from '../FilterChip';

interface MapHeaderProps {
  filterNow: boolean;
  setFilterNow: (v: boolean) => void;
  materials: any[];
  selectedMaterials: string[];
  toggleMaterial: (id: string) => void;
  radiusKm: number;
  onOpenRadius: () => void;
  startHour: number;
  endHour: number;
  selectedDays: number[];
  onOpenTimeFilter: () => void;
  onClearDays: () => void;
}

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function MapHeader({
  filterNow,
  setFilterNow,
  materials,
  selectedMaterials,
  toggleMaterial,
  radiusKm,
  onOpenRadius,
  startHour,
  endHour,
  selectedDays,
  onOpenTimeFilter,
  onClearDays,
}: MapHeaderProps) {
  const insets = useSafeAreaInsets();

  const isScheduleFiltered =
    startHour !== 8 || endHour !== 20 || selectedDays.length > 0;

  const getTopButtonText = () => {
    const timeText = `${startHour}h-${endHour}h`;
    if (selectedDays.length === 0) {
      return timeText;
    }
    return `${timeText} (+${selectedDays.length}d)`;
  };

  const getDaysChipLabel = () => {
    if (selectedDays.length === 1) {
      return `Dia: ${DAY_NAMES[selectedDays[0]]}`;
    }
    if (selectedDays.length <= 3) {
      return `Dias: ${selectedDays.map(d => DAY_NAMES[d]).join(', ')}`;
    }
    return `Dias: ${selectedDays.length} selecionados`;
  };

  return (
    <View style={[styles.container, { top: insets.top + 20 }]}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <MaterialCommunityIcons
            name="filter-variant"
            size={20}
            color={colors.textSecondary}
          />
          <Text style={styles.titleText}>Filtros de Busca</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {/* Botão Superior Compacto (Horário + Badge de quantidade de dias) */}
          <TouchableOpacity
            style={[
              styles.radiusBtn,
              isScheduleFiltered && { backgroundColor: `${colors.primary}20` },
            ]}
            onPress={onOpenTimeFilter}
            activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.radiusText}>{getTopButtonText()}</Text>
          </TouchableOpacity>

          {/* Botão de Raio */}
          <TouchableOpacity
            style={styles.radiusBtn}
            onPress={onOpenRadius}
            activeOpacity={0.7}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={16}
              color={colors.primary}
            />
            <Text style={styles.radiusText}>Até {radiusKm}km</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista Rolável de Filtros */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <FilterChip
          label="Agora"
          icon="clock-fast"
          active={filterNow}
          onPress={() => setFilterNow(!filterNow)}
        />

        {/* CHIP DEDICADO AOS DIAS */}
        {selectedDays.length > 0 && (
          <FilterChip
            label={getDaysChipLabel()}
            icon="calendar-check"
            active={true}
            onPress={onClearDays}
          />
        )}

        {materials.map(m => (
          <FilterChip
            key={m.id}
            label={m.name}
            active={selectedMaterials.includes(m.id)}
            onPress={() => toggleMaterial(m.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.textSecondary,
  },
  radiusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  radiusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scrollContent: {
    paddingRight: 20,
    paddingBottom: 4,
    gap: 8,
  },
});
