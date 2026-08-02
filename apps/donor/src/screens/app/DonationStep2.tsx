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
import * as Notifications from 'expo-notifications';
import {
  ArrowLeft,
  MapPin,
  Package,
  CalendarDays,
  FileText,
  CheckCircle2,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, NotificationPermissionDialog } from '@workspace/ui';
import { supabase } from '@workspace/db';
import { RootStackParamList } from '../../navigation';
import {
  ScheduleEntry,
  SchedulePicker,
} from '../../components/SchedulerPicker';

export function DonationStep2() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, 'DonationStep2'>>();
  const { address, materials } = route.params;

  const [notes, setNotes] = useState('');
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [pendingSuccessNavigation, setPendingSuccessNavigation] =
    useState(false);

  const totalWeight = materials.reduce((acc, m) => acc + Number(m.weight), 0);

  const executeDonation = async () => {
    setLoading(true);

    const formattedSchedules = schedules.map(s => ({
      day_of_week: s.dayOfWeekId,
      start_time: s.startTime,
      end_time: s.endTime,
    }));

    const donationData = {
      p_address_id: address.id,
      p_materials: materials,
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

        {/* Componente Modular do SchedulePicker */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays color={colors.primary} size={16} />
            <Text style={styles.sectionTitle}>Disponibilidade de Horários</Text>
          </View>

          <View style={styles.card}>
            <SchedulePicker schedules={schedules} onChange={setSchedules} />
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
