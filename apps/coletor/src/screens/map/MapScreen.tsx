import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';

import { CollectionMarker } from '../../components/map/CollectionMarker';
import { MapHeader } from '../../components/map/MapHeader';
import { CollectionDetailsCard } from '../../components/map/CollectionDetailsCard';
import { RadiusBottomSheet } from '../../components/RadiusBottomSheet';

export interface DonationCollection {
  donation_id: string;
  donor_id: string;
  distance_meters: number;
  status: string;
  address: {
    street: string;
    num: string;
    neighborhood: string;
    lat: number;
    lng: number;
  };
  materials: any[];
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [collections, setCollections] = useState<DonationCollection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<DonationCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [materialsList, setMaterialsList] = useState<any[]>([]);
  const [onlyAvailableNow, setOnlyAvailableNow] = useState(false);
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
    getUserLocation();
  }, []);

  async function getUserLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Localização Necessária',
        'Precisamos da sua localização para mostrar as coletas mais próximas.',
      );
      setLoading(false);
      return;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    setLocation(loc);
  }

  useEffect(() => {
    if (location) {
      fetchCollections(location.coords.latitude, location.coords.longitude);
    }
  }, [location, onlyAvailableNow, filterRadiusKm, selectedMaterials]);

  async function fetchCollections(lat: number, lng: number) {
    setLoading(true);
    try {
      console.log(`[MapScreen] Buscando coletas. Raio: ${filterRadiusKm}km`);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pendingData, error: rpcError } = await supabase.rpc(
        'get_available_donations',
        {
          p_collector_lat: lat,
          p_collector_lng: lng,
          p_radius_km: filterRadiusKm,
          p_material_ids:
            selectedMaterials.length > 0 ? selectedMaterials : null,
          p_available_now: onlyAvailableNow,
        },
      );

      if (rpcError) console.error('[MapScreen] Erro na RPC:', rpcError);

      let mappedPending: DonationCollection[] = [];
      if (pendingData) {
        mappedPending = pendingData.map((d: any) => ({
          donation_id: d.donation_id,
          donor_id: d.donor_id,
          distance_meters: d.distance_meters,
          status: d.status,
          address: d.address_json,
          materials: d.items_json || [],
        }));
      }

      const { data: acceptedData, error: acceptedError } = await supabase
        .from('donations')
        .select(
          `
          id, donor_id, status,
          addresses ( street, num, neighborhood, lat, lng ),
          donation_items ( weight_kg, materials ( name ) )
        `,
        )
        .eq('collector_id', user.id)
        .in('status', ['accepted', 'completed']);

      if (acceptedError)
        console.error('[MapScreen] Erro coletas aceitas:', acceptedError);

      let mappedAccepted: DonationCollection[] = [];
      if (acceptedData) {
        mappedAccepted = acceptedData.map((d: any) => ({
          donation_id: d.id,
          donor_id: d.donor_id,
          distance_meters: 0,
          status: d.status,
          address: d.addresses,
          materials: d.donation_items || [],
        }));
      }

      setCollections([...mappedPending, ...mappedAccepted]);
    } catch (err) {
      console.error('[MapScreen] Erro geral ao buscar coletas:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (!location) {
      await getUserLocation();
    } else {
      fetchCollections(location.coords.latitude, location.coords.longitude);
    }
  };

  const centerMap = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000,
      );
    }
  };

  const toggleMaterial = (id: string) => {
    setSelectedMaterials(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id],
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: location?.coords.latitude || -22.017,
          longitude: location?.coords.longitude || -47.891,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}>
        {collections.map(item => (
          <CollectionMarker
            key={item.donation_id}
            collection={item}
            isSelected={selectedCollection?.donation_id === item.donation_id}
            onPress={() => setSelectedCollection(item)}
          />
        ))}
      </MapView>

      {/* Componente de Filtros */}
      <MapHeader
        filterNow={onlyAvailableNow}
        setFilterNow={setOnlyAvailableNow}
        materials={materialsList}
        selectedMaterials={selectedMaterials}
        toggleMaterial={toggleMaterial}
        radiusKm={filterRadiusKm}
        onOpenRadius={() => setShowRadiusSheet(true)}
      />

      {/* Botões Flutuantes (Direita) */}
      <View
        style={[
          styles.floatingControls,
          { bottom: selectedCollection ? 240 : 32 },
        ]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleRefresh}
          disabled={isRefreshing}>
          {isRefreshing || loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <MaterialCommunityIcons
              name="refresh"
              size={24}
              color={colors.primaryDark}
            />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={centerMap}>
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={colors.primaryDark}
          />
        </TouchableOpacity>
      </View>

      {/* Bottom Sheet */}
      <RadiusBottomSheet
        visible={showRadiusSheet}
        currentRadius={filterRadiusKm}
        onClose={() => setShowRadiusSheet(false)}
        onApply={radius => setFilterRadiusKm(radius)}
      />

      <CollectionDetailsCard
        collection={selectedCollection}
        onClose={() => setSelectedCollection(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F9F7',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  floatingControls: {
    position: 'absolute',
    right: 16,
    gap: 12,
    zIndex: 10,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
});
