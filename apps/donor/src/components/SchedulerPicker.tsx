import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, InputIcon, InputIconMask } from '@workspace/ui';

export interface Schedule {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface SchedulePickerProps {
  schedules: Schedule[];
  onAddSchedule: (schedule: Schedule) => void;
  onRemoveSchedule: (index: number) => void;
}

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const SchedulePicker = ({
  schedules,
  onAddSchedule,
  onRemoveSchedule,
}: SchedulePickerProps) => {
  const [selectedDay, setSelectedDay] = useState<number>(1); // Padrão: Segunda-feira
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  // Formata o tempo enquanto o usuário digita
  const formatTimeText = (text: string) => {
    const numericText = text.replace(/\D/g, '');

    const limitedText = numericText.slice(0, 4);

    if (limitedText.length >= 3) {
      return `${limitedText.slice(0, 2)}:${limitedText.slice(2)}`;
    }

    return limitedText;
  };

  const handleAdd = () => {
    // Validação simples de formato (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      Alert.alert('Ops', 'Preencha os horários no formato 00:00 (Ex: 08:30)');
      return;
    }

    if (startTime >= endTime) {
      Alert.alert(
        'Horário Inválido',
        'O horário de fim deve ser maior que o de início.',
      );
      return;
    }

    // Verifica se já não adicionou esse exato horário
    const exists = schedules.find(
      s =>
        s.day_of_week === selectedDay &&
        s.start_time === startTime &&
        s.end_time === endTime,
    );

    if (exists) {
      Alert.alert('Aviso', 'Este horário já foi adicionado.');
      return;
    }

    onAddSchedule({
      day_of_week: selectedDay,
      start_time: startTime,
      end_time: endTime,
    });

    // Limpa os campos para o próximo
    setStartTime('');
    setEndTime('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Dias da Semana</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.daysScroll}
        contentContainerStyle={{ paddingHorizontal: 10 }}>
        {DAYS.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayButton,
              selectedDay === index && styles.dayButtonActive,
            ]}
            onPress={() => setSelectedDay(index)}>
            <Text
              style={[
                styles.dayText,
                selectedDay === index && styles.dayTextActive,
              ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.timeRow}>
        <View style={styles.timeInput}>
          {/* Trocamos para InputIcon e mudamos para onChange */}
          <InputIcon
            label="Início"
            placeholder="08:00"
            icon="clock-outline"
            keyboardType="number-pad"
            value={startTime}
            onChangeText={value => setStartTime(formatTimeText(value))}
          />
        </View>
        <View style={styles.timeInput}>
          <InputIcon
            label="Fim"
            placeholder="11:30"
            icon="clock-time-four-outline"
            keyboardType="number-pad"
            value={endTime}
            onChangeText={value => setEndTime(formatTimeText(value))}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
        <MaterialCommunityIcons name="plus" size={20} color="#FFF" />
        <Text style={styles.addButtonText}>Adicionar Horário</Text>
      </TouchableOpacity>

      {/* LISTA DE HORÁRIOS ADICIONADOS */}
      {schedules.length > 0 && (
        <View style={styles.listContainer}>
          <Text style={styles.listTitle}>Horários Selecionados:</Text>
          {schedules.map((item, index) => (
            <View key={index} style={styles.scheduleItem}>
              <Text style={styles.scheduleText}>
                {DAYS[item.day_of_week]}: {item.start_time} às {item.end_time}
              </Text>
              <TouchableOpacity onPress={() => onRemoveSchedule(index)}>
                <MaterialCommunityIcons
                  name="delete-outline"
                  size={24}
                  color={colors.error || 'red'}
                />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 20 },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 10,
    marginBottom: 10,
    marginLeft: 15,
  },
  daysScroll: { flexDirection: 'row', marginBottom: 15 },
  dayButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dayButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayText: { color: colors.textSecondary, fontWeight: 'bold' },
  dayTextActive: { color: colors.textLight },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  timeInput: { flex: 0.48 },
  addButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  addButtonText: { color: '#FFF', fontWeight: 'bold', marginLeft: 5 },
  listContainer: {
    marginTop: 20,
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  listTitle: { fontWeight: 'bold', marginBottom: 10, color: colors.text },
  scheduleItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scheduleText: { fontSize: 15, color: colors.textSecondary },
});
