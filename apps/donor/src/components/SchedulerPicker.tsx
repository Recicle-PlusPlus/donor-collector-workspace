import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Check, X, Clock, CopyPlus, Trash2 } from 'lucide-react-native';
import { colors } from '@workspace/ui';

export interface ScheduleEntry {
  id: string;
  day: string;
  dayShort: string;
  turn: string;
  timeRange: string;
  dayOfWeekId: number;
  startTime: string;
  endTime: string;
}

const DAYS = [
  { id: 0, short: 'Dom', full: 'Domingo' },
  { id: 1, short: 'Seg', full: 'Segunda-feira' },
  { id: 2, short: 'Ter', full: 'Terça-feira' },
  { id: 3, short: 'Qua', full: 'Quarta-feira' },
  { id: 4, short: 'Qui', full: 'Quinta-feira' },
  { id: 5, short: 'Sex', full: 'Sexta-feira' },
  { id: 6, short: 'Sáb', full: 'Sábado' },
];

const SLOTS = [
  { id: '08-10', label: '08h - 10h', start: '08:00:00', end: '10:00:00' },
  { id: '10-12', label: '10h - 12h', start: '10:00:00', end: '12:00:00' },
  { id: '12-14', label: '12h - 14h', start: '12:00:00', end: '14:00:00' },
  { id: '14-16', label: '14h - 16h', start: '14:00:00', end: '16:00:00' },
  { id: '16-18', label: '16h - 18h', start: '16:00:00', end: '18:00:00' },
  { id: '18-20', label: '18h - 20h', start: '18:00:00', end: '20:00:00' },
];

interface SchedulePickerProps {
  schedules: ScheduleEntry[];
  onChange: (schedules: ScheduleEntry[]) => void;
}

export const SchedulePicker: React.FC<SchedulePickerProps> = ({
  schedules,
  onChange,
}) => {
  const [activeDay, setActiveDay] = useState(DAYS[1].short);

  const day = DAYS.find(d => d.short === activeDay)!;
  const entryId = (dayShort: string, slotId: string) => `${dayShort}-${slotId}`;

  const isOn = (dayShort: string, slotId: string) =>
    schedules.some(s => s.id === entryId(dayShort, slotId));

  const toggleSlot = (slotId: string) => {
    const slot = SLOTS.find(s => s.id === slotId)!;
    const id = entryId(activeDay, slotId);

    if (isOn(activeDay, slotId)) {
      onChange(schedules.filter(s => s.id !== id));
    } else {
      onChange([
        ...schedules,
        {
          id,
          day: day.full,
          dayShort: day.short,
          turn: slot.label,
          timeRange: slot.label,
          dayOfWeekId: day.id,
          startTime: slot.start,
          endTime: slot.end,
        },
      ]);
    }
  };

  const daySlots = SLOTS.filter(s => isOn(activeDay, s.id));

  const applyToWeekdays = () => {
    if (daySlots.length === 0) return;
    const targets = DAYS.slice(1, 6); // Seg a Sex
    const additions: ScheduleEntry[] = [];

    targets.forEach(d => {
      daySlots.forEach(slot => {
        const id = entryId(d.short, slot.id);
        if (
          !schedules.some(s => s.id === id) &&
          !additions.some(s => s.id === id)
        ) {
          additions.push({
            id,
            day: d.full,
            dayShort: d.short,
            turn: slot.label,
            timeRange: slot.label,
            dayOfWeekId: d.id,
            startTime: slot.start,
            endTime: slot.end,
          });
        }
      });
    });

    if (additions.length) onChange([...schedules, ...additions]);
  };

  const removeEntry = (id: string) =>
    onChange(schedules.filter(s => s.id !== id));

  const clearDay = (dayShort: string) =>
    onChange(schedules.filter(s => s.dayShort !== dayShort));

  const grouped = DAYS.map(d => ({
    day: d,
    entries: SLOTS.map(slot =>
      schedules.find(s => s.id === entryId(d.short, slot.id)),
    ).filter(Boolean) as ScheduleEntry[],
  })).filter(g => g.entries.length > 0);

  return (
    <View style={styles.container}>
      {/* Seletor de Dia */}
      <View style={styles.section}>
        <Text style={styles.label}>Escolha o dia</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.daysScroll}>
          {DAYS.map(d => {
            const isActive = activeDay === d.short;
            const count = schedules.filter(s => s.dayShort === d.short).length;
            return (
              <TouchableOpacity
                key={d.short}
                onPress={() => setActiveDay(d.short)}
                style={[styles.dayButton, isActive && styles.dayButtonActive]}>
                <Text
                  style={[
                    styles.dayButtonText,
                    isActive && styles.dayButtonTextActive,
                  ]}>
                  {d.short}
                </Text>
                {count > 0 && (
                  <View
                    style={[
                      styles.counterBadge,
                      isActive && styles.counterBadgeActive,
                    ]}>
                    <Text
                      style={[
                        styles.counterText,
                        isActive && styles.counterTextActive,
                      ]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Slots de Horários */}
      <View style={styles.section}>
        <View style={styles.slotsHeader}>
          <Text style={styles.label}>Horários em {day.full}</Text>
          {daySlots.length > 0 && (
            <TouchableOpacity onPress={() => clearDay(activeDay)}>
              <Text style={styles.clearText}>Limpar</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.slotsGrid}>
          {SLOTS.map(slot => {
            const selected = isOn(activeDay, slot.id);
            return (
              <TouchableOpacity
                key={slot.id}
                onPress={() => toggleSlot(slot.id)}
                style={[
                  styles.slotButton,
                  selected && styles.slotButtonActive,
                ]}>
                {selected ? (
                  <Check color="#fff" size={16} />
                ) : (
                  <Clock color="#64748B" size={16} />
                )}
                <Text
                  style={[
                    styles.slotButtonText,
                    selected && styles.slotButtonTextActive,
                  ]}>
                  {slot.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {daySlots.length > 0 && (
          <TouchableOpacity
            onPress={applyToWeekdays}
            style={styles.applyButton}>
            <CopyPlus color={colors.primary} size={16} />
            <Text style={styles.applyButtonText}>Repetir de Seg a Sex</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resumo da Agenda */}
      {grouped.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.label}>
            Sua agenda{' '}
            <Text style={styles.sublabel}>
              ({schedules.length}{' '}
              {schedules.length === 1 ? 'horário' : 'horários'})
            </Text>
          </Text>

          <View style={styles.groupedContainer}>
            {grouped.map(({ day: d, entries }) => (
              <View key={d.short} style={styles.groupCard}>
                <View style={styles.groupHeader}>
                  <Text style={styles.groupDayTitle}>{d.full}</Text>
                  <TouchableOpacity
                    onPress={() => clearDay(d.short)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Trash2 color="#64748B" size={16} />
                  </TouchableOpacity>
                </View>

                <View style={styles.entriesContainer}>
                  {entries.map(e => (
                    <View key={e.id} style={styles.entryChip}>
                      <Clock color={colors.primary} size={14} />
                      <Text style={styles.entryText}>{e.timeRange}</Text>
                      <TouchableOpacity
                        onPress={() => removeEntry(e.id)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                        <X color="#64748B" size={14} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 20 },
  section: { gap: 10 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  sublabel: { fontSize: 12, fontWeight: 'normal', color: '#64748B' },
  daysScroll: { gap: 8, paddingVertical: 2 },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  counterBadge: {
    marginLeft: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  counterBadgeActive: {
    backgroundColor: '#fff',
  },
  counterText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  counterTextActive: {
    color: colors.primary,
  },
  slotsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotButton: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  slotButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  slotButtonTextActive: {
    color: '#fff',
  },
  applyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: `${colors.primary}60`,
    borderRadius: 12,
    backgroundColor: `${colors.primary}08`,
  },
  applyButtonText: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  groupedContainer: {
    gap: 10,
  },
  groupCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  groupDayTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1E293B',
    textTransform: 'uppercase',
  },
  entriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  entryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 6,
    borderRadius: 10,
  },
  entryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
  },
});
