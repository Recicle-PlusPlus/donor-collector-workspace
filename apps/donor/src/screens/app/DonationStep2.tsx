import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import {
  ArrowLeft,
  MapPin,
  Package,
  CalendarDays,
  FileText,
  CheckCircle2,
  Trash2,
  Clock,
  Plus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, NotificationPermissionDialog } from '@workspace/ui';
import { supabase } from '@workspace/db';
import { RootStackParamList } from '../../navigation';

const DAYS_OF_WEEK = [
  { id: 0, label: 'Dom', full: 'Domingo' },
  { id: 1, label: 'Seg', full: 'Segunda-feira' },
  { id: 2, label: 'Ter', full: 'Terça-feira' },
  { id: 3, label: 'Qua', full: 'Quarta-feira' },
  { id: 4, label: 'Qui', full: 'Quinta-feira' },
  { id: 5, label: 'Sex', full: 'Sexta-feira' },
  { id: 6, label: 'Sáb', full: 'Sábado' },
];

interface ScheduleInterval {
  day_of_week: number;
  start_time: Date;
  end_time: Date;
}

export function DonationStep2() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'DonationStep2'>>();
  const { address, materials } = route.params;

  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState<ScheduleInterval[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingSuccessNavigation, setPendingSuccessNavigation] =
    useState(false);

  const [isAdding, setIsAdding] = useState(false);
  const [newDay, setNewDay] = useState(1);
  const [newStart, setNewStart] = useState(
    new Date(new Date().setHours(8, 0, 0, 0)),
  );
  const [newEnd, setNewEnd] = useState(
    new Date(new Date().setHours(18, 0, 0, 0)),
  );

  const [showPicker, setShowPicker] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end'>('start');

  const totalWeight = materials.reduce((acc, m) => acc + Number(m.weight), 0);

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowPicker(false);
    if (event.type === 'dismissed' || !selectedTime) return;

    if (pickerTarget === 'start') {
      setNewStart(selectedTime);
    } else {
      setNewEnd(selectedTime);
    }
  };

  const handleAddSchedule = () => {
    setSchedules(prev => [
      ...prev,
      { day_of_week: newDay, start_time: newStart, end_time: newEnd },
    ]);
    setIsAdding(false);
  };

  const executeDonation = async () => {
    setLoading(true);

    // Formata a hora
    const formattedSchedules = schedules.map(s => ({
      day_of_week: s.day_of_week,
      start_time: s.start_time.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      end_time: s.end_time.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    }));

    const donationData = {
      p_address_id: address.id,
      p_materials: materials, // [{ materialId, weight }]
      p_notes: notes,
      p_schedules: formattedSchedules,
    };

    const { error } = await supabase.rpc(
      'create_donation_request_v2',
      donationData,
    );
    setLoading(false);

    if (error) {
      Alert.alert(
        'Erro',
        'Ocorreu um erro ao agendar a doação. Tente novamente.',
      );
      console.log(error);
    } else {
      const navigateSuccess = () => {
        navigation.navigate('Main', {
          refresh: true,
          snackbarMessage: 'Coleta agendada com sucesso!',
        });
      };

      try {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === 'denied') {
          setPendingSuccessNavigation(true);
          setShowPermissionDialog(true);
          return;
        }
      } catch (permissionError) {
        console.error(
          '[DonationStep2] Failed to read notification permission status:',
          permissionError,
        );
      }

      navigateSuccess();
    }
  };

  const handleConfirmIntent = () => {
    if (schedules.length === 0) {
      Alert.alert('Atenção', 'Adicione pelo menos um horário disponível.');
      return;
    }

    if (schedules.length < 3) {
      Alert.alert(
        'Aumente suas chances!',
        'Você cadastrou menos de 3 opções de horário. Ter uma janela maior e mais opções de dias ajuda os coletores a aceitarem sua doação mais rápido.\n\nDeseja adicionar mais horários?',
        [
          { text: 'Sim, adicionar mais', style: 'cancel' },
          { text: 'Continuar mesmo assim', onPress: executeDonation },
        ],
      );
    } else {
      executeDonation();
    }
  };

  return (
    <View style={styles.container}>
      <NotificationPermissionDialog
        forceOpen={showPermissionDialog}
        onForceClose={() => {
          setShowPermissionDialog(false);
          if (pendingSuccessNavigation) {
            setPendingSuccessNavigation(false);
            navigation.navigate('Main', {
              refresh: true,
              snackbarMessage: 'Coleta agendada com sucesso!',
            });
          }
        }}
      />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <ArrowLeft color="#4b5563" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Etapa 2 de 2</Text>
          <Text style={styles.headerTitle}>Resumo e Agendamento</Text>
        </View>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Endereço Resumo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>Endereço</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {address.street}, {address.number}
            </Text>
            <Text style={styles.cardSubtitle}>
              {address.neighborhood} - {address.city}
            </Text>
          </View>
        </View>

        {/* Materiais Resumo */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Package color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>Materiais</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>~{totalWeight}kg</Text>
            </View>
          </View>
          <View style={styles.card}>
            <View style={styles.tagsContainer}>
              {materials.map((m, i) => (
                <View key={i} style={styles.tag}>
                  <Text style={styles.tagText}>{m.materialName}</Text>
                  <Text style={styles.tagWeight}>{m.weight}kg</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Intervalos de Agendamento */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>Disponibilidade de Horários</Text>
          </View>

          <View style={styles.card}>
            {schedules.map((sched, idx) => (
              <View key={idx} style={styles.scheduleRow}>
                <View>
                  <Text style={styles.scheduleText}>
                    {DAYS_OF_WEEK[sched.day_of_week].full}
                  </Text>
                  <Text style={styles.scheduleSub}>
                    Das{' '}
                    {sched.start_time.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    às{' '}
                    {sched.end_time.toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    setSchedules(prev => prev.filter((_, i) => i !== idx))
                  }>
                  <Trash2 color="#ef4444" size={20} />
                </TouchableOpacity>
              </View>
            ))}

            {isAdding ? (
              <View style={styles.addForm}>
                <Text style={styles.formLabel}>Dia da Semana</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 15 }}>
                  {DAYS_OF_WEEK.map(d => (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => setNewDay(d.id)}
                      style={[
                        styles.dayChip,
                        newDay === d.id && styles.dayChipActive,
                      ]}>
                      <Text
                        style={[
                          styles.dayChipText,
                          newDay === d.id && { color: '#fff' },
                        ]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.timeRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Início</Text>
                    <TouchableOpacity
                      style={styles.timeBtn}
                      onPress={() => {
                        setPickerTarget('start');
                        setShowPicker(true);
                      }}>
                      <Clock size={16} color={colors.primary} />
                      <Text style={styles.timeBtnText}>
                        {newStart.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.formLabel}>Fim</Text>
                    <TouchableOpacity
                      style={styles.timeBtn}
                      onPress={() => {
                        setPickerTarget('end');
                        setShowPicker(true);
                      }}>
                      <Clock size={16} color={colors.primary} />
                      <Text style={styles.timeBtnText}>
                        {newEnd.toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formActions}>
                  <TouchableOpacity
                    onPress={() => setIsAdding(false)}
                    style={styles.cancelBtn}>
                    <Text style={styles.cancelBtnText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleAddSchedule}
                    style={styles.saveBtn}>
                    <Text style={styles.saveBtnText}>Salvar Horário</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addScheduleBtn}
                onPress={() => setIsAdding(true)}>
                <Plus color={colors.primary} size={20} />
                <Text style={styles.addScheduleText}>Adicionar Intervalo</Text>
              </TouchableOpacity>
            )}

            {showPicker && (
              <DateTimePicker
                value={pickerTarget === 'start' ? newStart : newEnd}
                mode="time"
                is24Hour={true}
                display="default"
                onChange={onTimeChange}
              />
            )}
          </View>
        </View>

        {/* Observações */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FileText color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>
              Observações{' '}
              <Text style={{ fontWeight: 'normal', color: '#9ca3af' }}>
                (opcional)
              </Text>
            </Text>
          </View>
          <TextInput
            style={styles.textArea}
            placeholder="Ex: Pegar na portaria, material em 3 sacolas..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, 24) + 10 },
        ]}>
        <TouchableOpacity
          style={styles.primaryButton}
          disabled={loading}
          onPress={handleConfirmIntent}>
          <CheckCircle2 color="#fff" size={20} />
          <Text style={styles.primaryButtonText}>
            {loading ? 'Aguarde...' : 'Confirmar Doação'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Estilos
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  headerSubtitle: { fontSize: 12, color: '#6b7280', fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  stepIndicator: { flexDirection: 'row', gap: 6 },
  stepDot: { width: 32, height: 6, borderRadius: 3 },
  scrollContent: { padding: 20, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  badge: {
    marginLeft: 'auto',
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: { fontSize: 12, color: colors.primary, fontWeight: 'bold' },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
  },
  cardTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  cardSubtitle: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  tagText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  tagWeight: { fontSize: 12, color: '#6b7280' },

  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  scheduleText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  scheduleSub: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  addScheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 12,
    backgroundColor: `${colors.primary}05`,
  },
  addScheduleText: { color: colors.primary, fontWeight: 'bold', fontSize: 14 },

  // Formulário Inline de Horário
  addForm: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  dayChipActive: { backgroundColor: colors.primary },
  dayChipText: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  timeRow: { flexDirection: 'row', gap: 12, marginBottom: 15 },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  timeBtnText: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  cancelBtnText: { color: '#6b7280', fontWeight: 'bold' },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold' },

  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    padding: 16,
    height: 100,
    textAlignVertical: 'top',
    fontSize: 14,
    color: '#111827',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#e5e7eb',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
  },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
