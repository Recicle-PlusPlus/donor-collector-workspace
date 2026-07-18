import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Linking,
} from 'react-native';
import MapView, { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import {
  ArrowLeft,
  MapPin,
  Hash,
  Building2,
  Home,
  Map as MapIcon,
  Navigation,
  ChevronRight,
  Locate,
  Check,
  MailOpen,
} from 'lucide-react-native';

import { supabase } from '@workspace/db';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { colors } from '@workspace/ui';
import { useNavigation } from '@react-navigation/native';

interface AddressForm {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
}

const INITIAL: AddressForm = {
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
};

const cepMask = (v: string) =>
  v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, '$1-$2');

interface FieldProps {
  icon: React.ReactNode;
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  half?: boolean;
  optional?: boolean;
  keyboardType?: 'default' | 'numeric' | 'number-pad';
}

const Field = ({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  half,
  optional,
  keyboardType = 'default',
}: FieldProps) => (
  <View style={[styles.fieldContainer, half && styles.halfWidth]}>
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {optional && <Text style={styles.optionalText}>(opcional)</Text>}
    </View>
    <View style={styles.inputWrapper}>
      <View style={styles.iconContainer}>{icon}</View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </View>
  </View>
);

export function RegisterAddressScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState<AddressForm>(INITIAL);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const [mapRegion, setMapRegion] = useState<Region>({
    latitude: -22.0154,
    longitude: -47.8911,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });
  const [pinCoordinate, setPinCoordinate] = useState({
    latitude: -22.0154,
    longitude: -47.8911,
  });

  const canProceed =
    form.cep.length >= 9 && form.number.length > 0 && form.street.length > 0;

  const fetchCepInfo = async (cepText: string) => {
    const rawCep = cepText.replace(/\D/g, '');
    if (rawCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setForm(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf,
        }));
      }
    } catch (error) {
      console.log('Erro ao buscar CEP:', error);
    }
  };

  const onCepChange = (v: string) => {
    const masked = cepMask(v);
    setForm(prev => ({ ...prev, cep: masked }));
    if (masked.length === 9) {
      fetchCepInfo(masked);
    }
  };

  const setFieldValue = useCallback(
    (key: keyof AddressForm) => (v: string) =>
      setForm(prev => ({ ...prev, [key]: v })),
    [],
  );

  const handleAdvanceToMap = async () => {
    setLoading(true);
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } =
          await Location.requestForegroundPermissionsAsync();
        status = newStatus;
      }

      if (status !== 'granted') {
        Alert.alert(
          'Localização Obrigatória',
          'Precisamos de acesso à sua localização para definir as coordenadas exatas do seu endereço. Por favor, ative nas configurações do aparelho.',
          [
            { text: 'Cancelar', style: 'cancel' },
            {
              text: 'Abrir Configurações',
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }

      let regionToSet = { ...mapRegion };
      const fullAddress = `${form.street}, ${form.number}, ${form.city}, ${form.state}`;
      const geocode = await Location.geocodeAsync(fullAddress);

      if (geocode.length > 0) {
        regionToSet = {
          latitude: geocode[0].latitude,
          longitude: geocode[0].longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
      } else {
        const location = await Location.getCurrentPositionAsync({});
        regionToSet = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        };
      }

      setMapRegion(regionToSet);
      setPinCoordinate({
        latitude: regionToSet.latitude,
        longitude: regionToSet.longitude,
      });
      setStep(2);
    } catch (error) {
      console.error('Erro ao geolocalizar:', error);
      Alert.alert(
        'Erro de Localização',
        'Não foi possível obter sua localização. Verifique se o GPS está ligado.',
      );
    } finally {
      setLoading(false);
    }
  };

  const centerOnUserLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const location = await Location.getCurrentPositionAsync({});
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      });
    }
  };

  const handleConfirmLocation = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Remove tudo que não for número do CEP antes de salvar
      const cleanCep = form.cep.replace(/\D/g, '');

      const addressPayload = {
        user_id: user.id,
        cep: cleanCep,
        street: form.street,
        num: form.number,
        complement: form.complement,
        neighborhood: form.neighborhood,
        city: form.city,
        state: form.state,
        lat: pinCoordinate.latitude,
        lng: pinCoordinate.longitude,
      };

      console.log('[RegisterAddress] Salvando novo endereço:', addressPayload);

      const { error } = await supabase.from('addresses').insert(addressPayload);

      if (error) throw error;

      console.log('[RegisterAddress] Endereço salvo com sucesso!');

      setConfirmed(true);
      setTimeout(() => {
        navigation.goBack();
      }, 1200);
    } catch (error) {
      console.error('[RegisterAddress] Erro ao salvar endereço:', error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 2) {
    return (
      <View style={styles.container}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          region={mapRegion}
          onRegionChangeComplete={region => {
            setMapRegion(region);
            setPinCoordinate({
              latitude: region.latitude,
              longitude: region.longitude,
            });
          }}
          showsUserLocation={false}
          pitchEnabled={false}
        />

        {/* Pin Fixo no Centro */}
        <View style={styles.staticPinContainer} pointerEvents="none">
          <MapPin
            width={40}
            height={40}
            color={colors.primary}
            fill={colors.primary}
          />
          <View style={styles.pinShadow} />
        </View>

        {/* Header Flutuante */}
        <View style={styles.mapHeader}>
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={styles.backButtonMap}>
            <ArrowLeft color="#4b5563" size={24} />
          </TouchableOpacity>
          <View style={styles.mapHeaderCard}>
            <View style={styles.iconBox}>
              <Navigation color={colors.primary} size={20} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.mapHeaderTitle}>Ajuste a localização</Text>
              <Text style={styles.mapHeaderSubtitle}>
                Arraste o mapa para colocar o marcador exatamente na sua porta.
              </Text>
            </View>
          </View>
        </View>

        {/* Botão GPS */}
        <TouchableOpacity
          style={styles.locateButton}
          onPress={centerOnUserLocation}>
          <Locate color={colors.primary} size={24} />
        </TouchableOpacity>

        {/* Bottom Sheet Resumo */}
        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.addressSummaryRow}>
            <View style={styles.summaryIconBox}>
              <MapPin color={colors.primary} size={24} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {form.street}, {form.number}
              </Text>
              <Text style={styles.summarySubtitle} numberOfLines={1}>
                {form.neighborhood} • {form.city}/{form.state}
              </Text>
            </View>
          </View>

          {confirmed ? (
            <View style={styles.successButton}>
              <Check color="#fff" size={24} />
              <Text style={styles.successText}>Endereço Confirmado!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.confirmMapButton}
              onPress={handleConfirmLocation}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Check color="#fff" size={20} />
                  <Text style={styles.confirmMapText}>
                    Confirmar Localização Exata
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // FORMULÁRIO
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header Form */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <ArrowLeft color="#4b5563" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Novo Endereço</Text>
          <Text style={styles.headerTitle}>Cadastro de Endereço</Text>
        </View>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { backgroundColor: '#e5e7eb' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.row}>
          <Field
            icon={<MailOpen color="#9ca3af" size={20} />}
            label="CEP"
            placeholder="00000-000"
            value={form.cep}
            onChangeText={onCepChange}
            keyboardType="number-pad"
            half
          />
          <Field
            icon={<Hash color="#9ca3af" size={20} />}
            label="Número"
            placeholder="123"
            value={form.number}
            onChangeText={setFieldValue('number')}
            keyboardType="number-pad"
            half
          />
        </View>

        <Field
          icon={<MapIcon color="#9ca3af" size={20} />}
          label="Rua"
          placeholder="Nome da rua"
          value={form.street}
          onChangeText={setFieldValue('street')}
        />

        <Field
          icon={<Building2 color="#9ca3af" size={20} />}
          label="Complemento"
          placeholder="Apto, Bloco, Ref..."
          value={form.complement}
          onChangeText={setFieldValue('complement')}
          optional
        />

        <Field
          icon={<Home color="#9ca3af" size={20} />}
          label="Bairro"
          placeholder="Bairro"
          value={form.neighborhood}
          onChangeText={setFieldValue('neighborhood')}
        />

        <View style={styles.row}>
          <Field
            icon={<Building2 color="#9ca3af" size={20} />}
            label="Cidade"
            placeholder="Cidade"
            value={form.city}
            onChangeText={setFieldValue('city')}
            half
          />
          <Field
            icon={<MapIcon color="#9ca3af" size={20} />}
            label="Estado"
            placeholder="UF"
            value={form.state}
            onChangeText={setFieldValue('state')}
            half
          />
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryButton, !canProceed && styles.buttonDisabled]}
            disabled={!canProceed || loading}
            onPress={handleAdvanceToMap}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MapPin color="#fff" size={20} />
                <Text style={styles.primaryButtonText}>
                  Confirmar Localização no Mapa
                </Text>
                <ChevronRight color="#fff" size={20} />
              </>
            )}
          </TouchableOpacity>
          <Text style={styles.helperText}>
            Para garantir que o coletor encontre seu endereço rapidamente,
            pediremos para você confirmar o local no mapa a seguir.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderColor: '#f3f4f6',
    backgroundColor: 'rgba(255,255,255,0.9)',
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
  row: { flexDirection: 'row', gap: 12 },
  fieldContainer: { width: '100%', marginBottom: 16 },
  halfWidth: { flex: 1 },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  label: { fontSize: 12, fontWeight: '600', color: '#4b5563' },
  optionalText: { fontSize: 12, color: '#9ca3af', marginLeft: 4 },
  inputWrapper: { justifyContent: 'center' },
  iconContainer: { position: 'absolute', left: 12, zIndex: 1 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  footer: { marginTop: 10 },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
  },
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  helperText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },

  // Estilos do Mapa
  staticPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -40,
    alignItems: 'center',
  },
  pinShadow: {
    width: 12,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    marginTop: 2,
    transform: [{ scaleX: 2 }],
  },
  mapHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    gap: 10,
  },
  backButtonMap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  mapHeaderCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapHeaderTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  mapHeaderSubtitle: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  locateButton: {
    position: 'absolute',
    bottom: 180,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e5e7eb',
    alignSelf: 'center',
    marginBottom: 20,
  },
  addressSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  summaryIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryTitle: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  summarySubtitle: { fontSize: 12, color: '#6b7280' },
  confirmMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
  },
  confirmMapText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  successButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
  },
  successText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
