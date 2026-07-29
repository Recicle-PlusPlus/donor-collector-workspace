import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { RangeSlider } from '@react-native-assets/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '@workspace/ui';

interface TimeRangeBottomSheetProps {
  visible: boolean;
  currentStartHour: number;
  currentEndHour: number;
  currentDays: number[];
  onClose: () => void;
  onApply: (startHour: number, endHour: number, days: number[]) => void;
}

const DISCRETE_HOURS = [8, 10, 12, 14, 16, 18, 20];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom' },
  { id: 1, label: 'Seg' },
  { id: 2, label: 'Ter' },
  { id: 3, label: 'Qua' },
  { id: 4, label: 'Qui' },
  { id: 5, label: 'Sex' },
  { id: 6, label: 'Sáb' },
];

export const TimeRangeBottomSheet: React.FC<TimeRangeBottomSheetProps> = ({
  visible,
  currentStartHour,
  currentEndHour,
  currentDays,
  onClose,
  onApply,
}) => {
  const [startHour, setStartHour] = useState(currentStartHour);
  const [endHour, setEndHour] = useState(currentEndHour);
  const [selectedDays, setSelectedDays] = useState<number[]>(currentDays);

  useEffect(() => {
    if (visible) {
      setStartHour(currentStartHour);
      setEndHour(currentEndHour);
      setSelectedDays(currentDays);
    }
  }, [visible, currentStartHour, currentEndHour, currentDays]);

  const handleRangeChange = (range: [number, number]) => {
    let [min, max] = range;
    if (max - min < 2) {
      if (min === startHour) {
        max = min + 2;
      } else {
        min = max - 2;
      }
    }
    setStartHour(min);
    setEndHour(max);
  };

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev =>
      prev.includes(dayId)
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId].sort((a, b) => a - b),
    );
  };

  const formatHour = (hour: number) => `${hour.toString().padStart(2, '0')}h`;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              <View style={styles.header}>
                <Text style={styles.title}>Filtros de Disponibilidade</Text>
                <TouchableOpacity
                  onPress={onClose}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <MaterialCommunityIcons
                    name="close"
                    size={24}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>

              {/* SEÇÃO 1: DIAS DA SEMANA */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Dias da Semana</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.daysScroll}>
                  {DAYS_OF_WEEK.map(day => {
                    const isSelected = selectedDays.includes(day.id);
                    return (
                      <TouchableOpacity
                        key={day.id}
                        onPress={() => toggleDay(day.id)}
                        style={[
                          styles.dayChip,
                          isSelected && styles.dayChipActive,
                        ]}>
                        <Text
                          style={[
                            styles.dayChipText,
                            isSelected && styles.dayChipTextActive,
                          ]}>
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* SEÇÃO 2: FAIXA DE HORÁRIOS */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Janela de Horários (Intervalos de 2h)
                </Text>

                <View style={styles.rangeDisplay}>
                  <MaterialCommunityIcons
                    name="clock-outline"
                    size={20}
                    color={colors.primary}
                  />
                  <Text style={styles.rangeText}>
                    Das <Text style={styles.bold}>{formatHour(startHour)}</Text>{' '}
                    às <Text style={styles.bold}>{formatHour(endHour)}</Text>
                  </Text>
                </View>

                <View style={styles.sliderContainer}>
                  <RangeSlider
                    range={[startHour, endHour]}
                    minimumValue={8}
                    maximumValue={20}
                    step={2}
                    minimumRange={2}
                    onValueChange={handleRangeChange}
                    outboundColor="#E2E8F0"
                    inboundColor={colors.primary}
                    thumbTintColor={colors.primary}
                    thumbSize={24}
                    style={styles.slider}
                  />

                  <View style={styles.ticksRow}>
                    {DISCRETE_HOURS.map(h => {
                      const isSelected = h >= startHour && h <= endHour;
                      return (
                        <Text
                          key={h}
                          style={[
                            styles.tickText,
                            isSelected && styles.tickTextActive,
                          ]}>
                          {formatHour(h)}
                        </Text>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Ações */}
              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.resetBtn}
                  onPress={() => {
                    setStartHour(8);
                    setEndHour(20);
                    setSelectedDays([]);
                  }}>
                  <Text style={styles.resetText}>Limpar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={() => {
                    onApply(startHour, endHour, selectedDays);
                    onClose();
                  }}>
                  <Text style={styles.applyText}>Aplicar Filtros</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  daysScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  dayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dayChipTextActive: {
    color: '#FFF',
  },
  rangeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
  },
  rangeText: {
    fontSize: 16,
    color: '#1E293B',
  },
  bold: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  sliderContainer: {
    marginVertical: 8,
    gap: 10,
  },
  slider: {
    height: 40,
    width: '100%',
  },
  ticksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  tickText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  tickTextActive: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  resetText: {
    color: '#64748B',
    fontWeight: 'bold',
    fontSize: 14,
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  applyText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
