import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';

import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';
import { DonationCard } from '@workspace/ui/src/components/DonationCard';
import { FilterChip } from './FilterChip';
import { RadiusBottomSheet } from './RadiusBottomSheet';

interface AvailableDonationsProps {
  refreshKey?: number;
}

export function AvailableDonations({
  refreshKey = 0,
}: AvailableDonationsProps) {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [materialsList, setMaterialsList] = useState<any[]>([]);

  const [collectorLocation, setCollectorLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [filterNow, setFilterNow] = useState(false);
  const [filterRadiusKm, setFilterRadiusKm] = useState(10);
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);

  const [showRadiusSheet, setShowRadiusSheet] = useState(false);

  useEffect(() => {
    async function loadMaterials() {
      const { data } = await supabase
        .from('materials')
        .select('id, name')
        .eq('active', true);
      if (data) setMaterialsList(data);
    }
    loadMaterials();
  }, []);

  useEffect(() => {
    fetchDonations();
  }, [filterNow, filterRadiusKm, selectedMaterials, refreshKey]);

  const toggleMaterial = (matId: string) => {
    setSelectedMaterials(prev =>
      prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId],
    );
  };

  const getCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      return { lat: location.coords.latitude, lng: location.coords.longitude };
    } catch (e) {
      return null;
    }
  };

  async function fetchDonations() {
    setLoading(true);
    let coords = collectorLocation;

    if (!coords) {
      coords = await getCurrentLocation();
      if (coords) setCollectorLocation(coords);
    }

    if (coords) {
      const { data, error } = await supabase.rpc('get_available_donations', {
        p_collector_lat: coords.lat,
        p_collector_lng: coords.lng,
        p_radius_km: filterRadiusKm,
        p_material_ids: selectedMaterials.length > 0 ? selectedMaterials : null,
        p_available_now: filterNow,
      });

      if (data) {
        const formattedDonations = data.map((d: any) => ({
          id: d.donation_id,
          donor_id: d.donor_id,
          status: d.status,
          created_at: d.created_at,
          distance_meters: d.distance_meters,
          addresses: d.address_json,
          donation_items: d.items_json
            ? d.items_json.map((item: any) => ({
                weight_kg: item.weight_kg,
                materials: { name: item.material_name },
              }))
            : [],
          donation_schedules: d.schedules_json || [],
        }));

        setDonations(formattedDonations);
      }
      if (error) console.log('[AvailableDonations] Erro:', error);
    } else {
      setDonations([]); // Sem GPS
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Coletas Disponíveis</Text>
          <Text style={styles.subtitle}>Novas doações aguardando retirada</Text>
        </View>
        <TouchableOpacity
          style={styles.advancedFilterBtn}
          onPress={() => setShowRadiusSheet(true)}>
          <MaterialCommunityIcons
            name="tune"
            size={20}
            color={colors.primary}
          />
          <View style={styles.radiusBadge}>
            <Text style={styles.radiusText}>{filterRadiusKm}km</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* CHIPS DE FILTRO */}
      <View style={styles.filterRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          persistentScrollbar={true}
          contentContainerStyle={styles.filterScroll}>
          <FilterChip
            label="Agora"
            icon="clock-fast"
            active={filterNow}
            onPress={() => setFilterNow(!filterNow)}
          />
          {materialsList.map(mat => (
            <FilterChip
              key={mat.id}
              label={mat.name}
              active={selectedMaterials.includes(mat.id)}
              onPress={() => toggleMaterial(mat.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* CONTEÚDO (LOADING OU LISTA) */}
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator
            size="large"
            color={colors.primary}
            style={{ marginTop: 40 }}
          />
        ) : donations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="leaf-off"
              size={40}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              Nenhuma coleta encontrada no raio de {filterRadiusKm}km com os
              filtros atuais.
            </Text>
          </View>
        ) : (
          <View style={styles.verticalList}>
            {donations.map(donation => (
              <DonationCard
                key={donation.donation_id || donation.id}
                donation={donation}
                onPress={() =>
                  navigation.navigate('DonationAccept', {
                    donationId: donation.donation_id || donation.id,
                  })
                }
              />
            ))}
          </View>
        )}
      </View>

      <RadiusBottomSheet
        visible={showRadiusSheet}
        currentRadius={filterRadiusKm}
        onClose={() => setShowRadiusSheet(false)}
        onApply={radius => setFilterRadiusKm(radius)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 30 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.primaryDark },
  subtitle: { fontSize: 14, color: colors.textSecondary },
  advancedFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 8,
    borderRadius: 20,
    gap: 4,
  },
  radiusBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  radiusText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  filterRow: { paddingLeft: 20, marginBottom: 15 },
  filterScroll: { paddingRight: 40, paddingBottom: 5, gap: 8 },
  content: { minHeight: 150 },
  verticalList: { paddingHorizontal: 20, gap: 15 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});
