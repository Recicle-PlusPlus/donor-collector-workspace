import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, TextInput, View } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, List, ActivityIndicator, Snackbar } from 'react-native-paper';

import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';
import { RootStackParamList } from '../../navigation';

import { SchedulePicker, Schedule } from '../../components/SchedulerPicker';

type Step2RouteProp = RouteProp<RootStackParamList, 'DonationStep2'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DonationStep2'
>;

export function DonationStep2() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Step2RouteProp>();

  const insets = useSafeAreaInsets();

  const { address, materials } = route.params;

  const [notes, setNotes] = useState('');

  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  async function handleConfirmDonation() {
    if (schedules.length === 0) {
      setSnackbar({
        visible: true,
        message: 'Adicione pelo menos um horário disponível.',
      });
      return;
    }

    setLoading(true);

    // Formata os horários (HH:MM:SS)
    const formattedSchedules = schedules.map(s => ({
      day_of_week: s.day_of_week,
      start_time: `${s.start_time}:00`,
      end_time: `${s.end_time}:00`,
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
      console.error('Erro ao criar doação:', error);
      setSnackbar({
        visible: true,
        message: 'Erro ao agendar a coleta. Tente novamente.',
      });
    } else {
      navigation.navigate('Main', {
        refresh: true,
        snackbarMessage: 'Coleta agendada com sucesso!',
      });
    }
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator
            animating={true}
            size="large"
            color={colors.primary}
          />
        </View>
      )}

      <Text style={styles.title}>Resumo da Coleta</Text>

      <List.Section style={styles.sectionCard}>
        <List.Subheader style={styles.subheader}>
          Local de Retirada
        </List.Subheader>
        <List.Item
          style={{ paddingLeft: 15 }}
          title={`${address.street}, ${address.num}`}
          description={`${address.neighborhood} - ${address.city}`}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          left={() => <List.Icon icon="map-marker" color={colors.primary} />}
        />
      </List.Section>

      <List.Section style={styles.sectionCard}>
        <List.Subheader style={styles.subheader}>
          Materiais Separados
        </List.Subheader>
        {materials.map((mat: any) => (
          <List.Item
            style={{ paddingLeft: 15 }}
            key={mat.materialId}
            title={mat.materialName}
            description={`${mat.weight} kg`}
            titleStyle={styles.listItemTitle}
            descriptionStyle={styles.listItemDescription}
            left={() => <List.Icon icon="recycle" color={colors.primary} />}
          />
        ))}
      </List.Section>

      <Text style={styles.title}>Agendamento</Text>

      {/* A MÁGICA ACONTECE AQUI */}
      <View style={styles.sectionCard}>
        <SchedulePicker
          schedules={schedules}
          onAddSchedule={newSchedule =>
            setSchedules([...schedules, newSchedule])
          }
          onRemoveSchedule={index => {
            const newSchedules = [...schedules];
            newSchedules.splice(index, 1);
            setSchedules(newSchedules);
          }}
        />
      </View>

      <Text style={styles.title}>Observações Adicionais</Text>
      <TextInput
        style={styles.input}
        placeholder="Ex: Pegar na portaria, material em 3 sacolas, avisar quando estiver vindo..."
        placeholderTextColor={colors.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button
        style={styles.navButton}
        mode="contained"
        onPress={handleConfirmDonation}
        disabled={loading || schedules.length === 0}
        buttonColor={colors.primary}
        textColor={colors.textLight}
        icon="check-circle-outline">
        Confirmar Agendamento
      </Button>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        style={{ backgroundColor: colors.surface }}
        theme={{ colors: { onSurface: colors.text } }}>
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 40,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    color: colors.primaryDark,
  },
  subheader: { color: colors.textSecondary, fontWeight: 'bold' },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingBottom: 10,
    marginBottom: 15,
    elevation: 1,
  },
  listItemTitle: { color: colors.text, fontWeight: 'bold' },
  listItemDescription: { color: colors.textSecondary },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 15,
    borderRadius: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#eee',
    marginBottom: 20,
  },
  navButton: {
    marginTop: 10,
    marginBottom: 40,
    paddingVertical: 5,
    borderRadius: 25,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
