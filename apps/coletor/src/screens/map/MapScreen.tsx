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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supabase } from '@workspace/db';
import { colors } from '@workspace/ui';

import { CollectionMarker } from '../../components/map/CollectionMarker';
import { MapHeader } from '../../components/map/MapHeader';
import { CollectionDetailsCard } from '../../components/map/CollectionDetailsCard';
import { RadiusBottomSheet } from '../../components/RadiusBottomSheet';
import { TimeRangeBottomSheet } from '../../components/map/TimeRangeBottomSheet';
import { RouteActionBar } from '../../components/map/RouteActionBar';

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
  const insets = useSafeAreaInsets();

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
  const [startHour, setStartHour] = useState<number>(8);
  const [endHour, setEndHour] = useState<number>(20);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [showTimeSheet, setShowTimeSheet] = useState(false);
  const [routeIds, setRouteIds] = useState<string[]>([]);

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
        'Localização',
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
  }, [
    location,
    onlyAvailableNow,
    filterRadiusKm,
    selectedMaterials,
    startHour,
    endHour,
    selectedDays,
  ]);

  async function fetchCollections(lat: number, lng: number) {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const formattedStart = `${startHour.toString().padStart(2, '0')}:00:00`;
      const formattedEnd = `${endHour.toString().padStart(2, '0')}:00:00`;

      const { data: pendingData, error: rpcError } = await supabase.rpc(
        'get_available_donations',
        {
          p_collector_lat: lat,
          p_collector_lng: lng,
          p_radius_km: filterRadiusKm,
          p_material_ids:
            selectedMaterials.length > 0 ? selectedMaterials : null,
          p_available_now: onlyAvailableNow,
          p_start_time:
            startHour === 8 && endHour === 20 ? null : formattedStart,
          p_end_time: startHour === 8 && endHour === 20 ? null : formattedEnd,
          p_days_of_week: selectedDays.length > 0 ? selectedDays : null,
        },
      );

      if (rpcError) console.error('[MapScreen] Erro RPC:', rpcError);

      let mappedPending =
        pendingData?.map((d: any) => ({
          donation_id: d.id,
          donor_id: d.donor_id,
          distance_meters: d.distance_meters,
          status: d.status,
          address: d.address_json,
          materials: d.items_json || [],
        })) || [];

      const { data: acceptedData } = await supabase
        .from('donations')
        .select(
          `id, donor_id, status, addresses ( street, num, neighborhood, lat, lng ), donation_items ( weight_kg, materials ( name ) )`,
        )
        .eq('collector_id', user.id)
        .in('status', ['accepted']);

      let mappedAccepted =
        acceptedData?.map((d: any) => ({
          donation_id: d.id,
          donor_id: d.donor_id,
          distance_meters: 0,
          status: d.status,
          address: d.addresses,
          materials: d.donation_items || [],
        })) || [];

      setCollections([...mappedPending, ...mappedAccepted]);
    } catch (err) {
      console.error('[MapScreen] Erro:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (!location) await getUserLocation();
    else fetchCollections(location.coords.latitude, location.coords.longitude);
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

  const toggleRouteSelection = (id: string) => {
    setRouteIds(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id],
    );
  };

  const hasRouteSelected = routeIds.length > 0;

  const getFloatingBottomPadding = () => {
    const basePadding = Math.max(insets.bottom, 16);
    if (selectedCollection && hasRouteSelected) return basePadding + 340;
    if (selectedCollection) return basePadding + 260;
    if (hasRouteSelected) return basePadding + 100;
    return basePadding + 32;
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
        {collections.map((item, i) => (
          <CollectionMarker
            key={`${item.donation_id}-${i}`}
            collection={item}
            isSelected={selectedCollection?.donation_id === item.donation_id}
            isAddedToRoute={routeIds.includes(item.donation_id)}
            onPress={() => setSelectedCollection(item)}
          />
        ))}
      </MapView>

      <MapHeader
        filterNow={onlyAvailableNow}
        setFilterNow={setOnlyAvailableNow}
        materials={materialsList}
        selectedMaterials={selectedMaterials}
        toggleMaterial={id =>
          setSelectedMaterials(p =>
            p.includes(id) ? p.filter(m => m !== id) : [...p, id],
          )
        }
        radiusKm={filterRadiusKm}
        onOpenRadius={() => setShowRadiusSheet(true)}
        startHour={startHour}
        endHour={endHour}
        selectedDays={selectedDays}
        onOpenTimeFilter={() => setShowTimeSheet(true)}
        onClearDays={() => setSelectedDays([])}
      />

      {/* Botões Flutuantes */}
      <View
        style={[
          styles.floatingControls,
          { bottom: getFloatingBottomPadding() },
        ]}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleRefresh}
          disabled={isRefreshing || loading}>
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

      <RadiusBottomSheet
        visible={showRadiusSheet}
        currentRadius={filterRadiusKm}
        onClose={() => setShowRadiusSheet(false)}
        onApply={radius => setFilterRadiusKm(radius)}
      />

      <TimeRangeBottomSheet
        visible={showTimeSheet}
        currentStartHour={startHour}
        currentEndHour={endHour}
        currentDays={selectedDays}
        onClose={() => setShowTimeSheet(false)}
        onApply={(min, max, days) => {
          setStartHour(min);
          setEndHour(max);
          setSelectedDays(days);
        }}
      />

      <CollectionDetailsCard
        collection={selectedCollection}
        isAddedToRoute={
          selectedCollection
            ? routeIds.includes(selectedCollection.donation_id)
            : false
        }
        hasRouteBar={hasRouteSelected}
        onToggleRoute={() =>
          selectedCollection &&
          toggleRouteSelection(selectedCollection.donation_id)
        }
        onClose={() => setSelectedCollection(null)}
      />

      <RouteActionBar
        selectedCount={routeIds.length}
        onGenerateRoute={() => {
          Alert.alert(
            'Próxima Fase',
            'Em breve você será redirecionado para o Resumo e Cálculo do Google Directions API.',
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F9F7' },
  map: { width: '100%', height: '100%' },
  floatingControls: { position: 'absolute', right: 16, gap: 12, zIndex: 10 },
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
