import React, { useState } from 'react';
import { Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Button,
  List,
  Checkbox,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';

import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';
import { RootStackParamList } from '../../navigation';

type Step2RouteProp = RouteProp<RootStackParamList, 'DonationStep2'>;
type NavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'DonationStep2'
>;

const DAYS_OPTIONS = [
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
  'Domingo',
];
const TIME_SLOTS_OPTIONS = ['Manhã (8h-12h)', 'Tarde (13h-18h)'];

export function DonationStep2() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<Step2RouteProp>();

  // Recebendo os dados da Etapa 1
  const { address, materials } = route.params;

  const [notes, setNotes] = useState('');
  const [scheduledDays, setScheduledDays] = useState<string[]>([]);
  const [scheduledTimeSlots, setScheduledTimeSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const handleDayToggle = (day: string) => {
    setScheduledDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day],
    );
  };

  const handleTimeToggle = (time: string) => {
    setScheduledTimeSlots(prev =>
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time],
    );
  };

  async function handleConfirmDonation() {
    setLoading(true);

    const donationData = {
      p_address_id: address.id,
      p_materials: materials, // O array que montamos na Etapa 1
      p_notes: notes,
      p_scheduled_days: scheduledDays,
      p_scheduled_time_slots: scheduledTimeSlots,
    };

    const { data, error } = await supabase.rpc(
      'create_donation_request',
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
      // Dispara a navegação para a Home com a flag de refresh
      navigation.navigate('Home', {
        refresh: true,
        snackbarMessage: 'Coleta agendada com sucesso!',
      });
    }
  }

  return (
    <ScrollView style={styles.container}>
      {loading && (
        <ActivityIndicator
          animating={true}
          size="large"
          color={colors.primary}
          style={styles.loading}
        />
      )}

      <Text style={styles.title}>Resumo da Coleta</Text>

      <List.Section>
        <List.Subheader style={styles.subheader}>Endereço</List.Subheader>
        <List.Item
          title={`${address.street}, ${address.num}`}
          description={`${address.neighborhood} - ${address.city}`}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          left={() => <List.Icon icon="map-marker" color={colors.primary} />}
        />
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.subheader}>Materiais</List.Subheader>
        {materials.map((mat: any) => (
          <List.Item
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

      <List.Section>
        <List.Subheader style={styles.subheader}>
          Selecione os dias disponíveis
        </List.Subheader>
        {DAYS_OPTIONS.map(day => (
          <Checkbox.Item
            key={day}
            label={day}
            labelStyle={styles.checkboxLabel}
            status={scheduledDays.includes(day) ? 'checked' : 'unchecked'}
            onPress={() => handleDayToggle(day)}
            color={colors.primary}
            uncheckedColor={colors.textSecondary}
          />
        ))}
      </List.Section>

      <List.Section>
        <List.Subheader style={styles.subheader}>
          Selecione os períodos
        </List.Subheader>
        {TIME_SLOTS_OPTIONS.map(time => (
          <Checkbox.Item
            key={time}
            label={time}
            labelStyle={styles.checkboxLabel}
            status={scheduledTimeSlots.includes(time) ? 'checked' : 'unchecked'}
            onPress={() => handleTimeToggle(time)}
            color={colors.primary}
            uncheckedColor={colors.textSecondary}
          />
        ))}
      </List.Section>

      <TextInput
        style={styles.input}
        placeholder="Observações (opcional)... Ex: Deixar na portaria, material em 3 sacolas, etc."
        placeholderTextColor={colors.textSecondary}
        value={notes}
        onChangeText={setNotes}
        multiline
      />

      <Button
        style={styles.navButton}
        mode="contained"
        onPress={handleConfirmDonation}
        disabled={
          loading ||
          scheduledDays.length === 0 ||
          scheduledTimeSlots.length === 0
        }
        buttonColor={colors.primary}
        textColor={colors.textLight}>
        Confirmar Agendamento
      </Button>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}>
        {snackbar.message}
      </Snackbar>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colors.background },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: colors.primaryDark,
  },
  subheader: { color: colors.textSecondary },
  listItemTitle: { color: colors.text, fontWeight: 'bold' },
  listItemDescription: { color: colors.textSecondary },
  checkboxLabel: { color: colors.text },
  input: {
    backgroundColor: colors.surface,
    color: colors.text,
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  navButton: { marginTop: 20, marginBottom: 40 },
  loading: { position: 'absolute', top: '50%', left: '50%', zIndex: 10 },
});
