import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  ArrowLeft,
  MapPin,
  Check,
  Minus,
  Plus,
  ChevronRight,
  PlusCircle,
  Recycle,
} from 'lucide-react-native';
import { supabase } from '@workspace/db';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { colors } from '@workspace/ui';

interface Material {
  id: string;
  name: string;
  icon_url: string | null;
  kg: number;
  selected: boolean;
}

export function DonationStep1() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [addresses, setAddresses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);

  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      async function fetchData() {
        if (!user) return;
        setLoading(true);

        const { data: addrs } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', user.id);
        if (addrs) {
          setAddresses(addrs);
          if (addrs.length > 0 && !selectedAddress)
            setSelectedAddress(addrs[0].id);
        }

        const { data: mats } = await supabase
          .from('materials')
          .select('*')
          .eq('active', true);
        if (mats) {
          const formattedMats = mats.map(m => ({
            id: m.id,
            name: m.name,
            icon_url: m.icon_url,
            kg: 0,
            selected: false,
          }));
          setMaterials(formattedMats);
        }

        setLoading(false);
      }
      fetchData();
    }, [user]),
  );

  const toggleMaterial = (id: string) => {
    setMaterials(prev =>
      prev.map(m =>
        m.id === id
          ? {
              ...m,
              selected: !m.selected,
              kg: !m.selected ? Math.max(m.kg, 1) : 0,
            }
          : m,
      ),
    );
  };

  const updateKg = (id: string, delta: number) => {
    setMaterials(prev =>
      prev.map(m =>
        m.id === id ? { ...m, kg: Math.max(1, m.kg + delta) } : m,
      ),
    );
  };

  const selectedMaterials = materials.filter(m => m.selected);
  const canProceed = selectedAddress && selectedMaterials.length > 0;

  const handleNext = () => {
    if (!canProceed) return;
    const addr = addresses.find(a => a.id === selectedAddress);
    const mats = selectedMaterials.map(m => ({
      materialId: m.id,
      materialName: m.name,
      weight: m.kg,
    }));

    navigation.navigate('DonationStep2', { address: addr, materials: mats });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <ArrowLeft color="#4b5563" size={24} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerSubtitle}>Etapa 1 de 2</Text>
          <Text style={styles.headerTitle}>O que e Onde</Text>
        </View>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, { backgroundColor: colors.primary }]} />
          <View style={[styles.stepDot, { backgroundColor: '#e5e7eb' }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator
            color={colors.primary}
            size="large"
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {/* Endereços */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MapPin color={colors.primary} size={20} />
                <Text style={styles.sectionTitle}>Endereço de Coleta</Text>
              </View>

              {addresses.length === 0 ? (
                <View style={styles.emptyAddressCard}>
                  <Text style={styles.emptyAddressText}>
                    Você ainda não possui um endereço cadastrado.
                  </Text>
                  <TouchableOpacity
                    style={styles.addAddressBtn}
                    onPress={() => navigation.navigate('RegisterAddress')}>
                    <PlusCircle color="#fff" size={20} />
                    <Text style={styles.addAddressBtnText}>
                      Cadastrar Endereço
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.addressList}>
                  {addresses.map(addr => {
                    const isSelected = selectedAddress === addr.id;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        onPress={() => setSelectedAddress(addr.id)}
                        style={[
                          styles.addressCard,
                          isSelected && styles.addressCardSelected,
                        ]}>
                        <View
                          style={[
                            styles.addressIcon,
                            isSelected && styles.addressIconSelected,
                          ]}>
                          {isSelected ? (
                            <Check color="#fff" size={20} />
                          ) : (
                            <MapPin color="#9ca3af" size={20} />
                          )}
                        </View>
                        <View style={styles.addressInfo}>
                          <Text style={styles.addressStreet} numberOfLines={1}>
                            {addr.street}, {addr.number}
                          </Text>
                          <Text style={styles.addressDetail} numberOfLines={1}>
                            {addr.neighborhood} - {addr.city}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Materiais */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Recycle color={colors.primary} size={20} />
                <Text style={styles.sectionTitle}>Materiais</Text>
                {selectedMaterials.length > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {selectedMaterials.length} sel.
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.grid}>
                {materials.map(mat => (
                  <View key={mat.id} style={styles.gridItem}>
                    <TouchableOpacity
                      onPress={() => toggleMaterial(mat.id)}
                      style={[
                        styles.matCard,
                        mat.selected && styles.matCardSelected,
                      ]}>
                      {mat.selected && (
                        <View style={styles.matCheck}>
                          <Check color="#fff" size={12} />
                        </View>
                      )}

                      {/* Lógica da Imagem do Banco */}
                      {mat.icon_url ? (
                        <Image
                          source={{ uri: mat.icon_url }}
                          style={styles.matImage}
                          resizeMode="contain"
                        />
                      ) : (
                        <Recycle
                          color={mat.selected ? colors.primary : '#9ca3af'}
                          size={32}
                        />
                      )}

                      <Text
                        style={[
                          styles.matName,
                          mat.selected && { color: '#111827' },
                        ]}
                        numberOfLines={1}>
                        {mat.name}
                      </Text>
                    </TouchableOpacity>

                    {mat.selected && (
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          onPress={() => updateKg(mat.id, -1)}
                          style={styles.stepBtn}>
                          <Minus color="#6b7280" size={16} />
                        </TouchableOpacity>
                        <Text style={styles.stepValue}>
                          {mat.kg}
                          <Text style={styles.stepKg}>kg</Text>
                        </Text>
                        <TouchableOpacity
                          onPress={() => updateKg(mat.id, 1)}
                          style={styles.stepBtnPlus}>
                          <Plus color={colors.primary} size={16} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryButton, !canProceed && styles.buttonDisabled]}
          disabled={!canProceed}
          onPress={handleNext}>
          <Text style={styles.primaryButtonText}>Avançar</Text>
          <ChevronRight color="#fff" size={20} />
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
  section: { marginBottom: 30 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  badge: {
    marginLeft: 'auto',
    backgroundColor: `${colors.primary}20`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 12, color: colors.primary, fontWeight: 'bold' },
  emptyAddressCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  emptyAddressText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 15,
  },
  addAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  addAddressBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  addressList: { gap: 12 },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    padding: 15,
    gap: 15,
  },
  addressCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressIconSelected: { backgroundColor: colors.primary },
  addressInfo: { flex: 1 },
  addressStreet: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  addressDetail: { fontSize: 12, color: '#6b7280' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  gridItem: { width: '31%', gap: 8 },
  matCard: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 8,
  },
  matCardSelected: {
    borderColor: colors.primary,
    backgroundColor: `${colors.primary}05`,
  },
  matCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 2,
    zIndex: 1,
  },
  matImage: { width: 40, height: 40, marginBottom: 8 },
  matName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnPlus: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: `${colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepValue: { fontSize: 14, fontWeight: 'bold', color: '#111827' },
  stepKg: { fontSize: 10, color: '#6b7280', fontWeight: 'normal' },
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
  buttonDisabled: { opacity: 0.5 },
  primaryButtonText: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
});
