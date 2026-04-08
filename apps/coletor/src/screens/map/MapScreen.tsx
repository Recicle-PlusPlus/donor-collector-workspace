import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '@workspace/db';

import { CollectionMarker } from '../../components/map/CollectionMarker';
import { MapHeader } from '../../components/map/MapHeader';
import { CollectionDetailsCard } from '../../components/map/CollectionDetailsCard';

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
  materials: {
    material_id: string;
    weight_kg: number;
  }[];
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [collections, setCollections] = useState<DonationCollection[]>([]);
  const [selectedCollection, setSelectedCollection] =
    useState<DonationCollection | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [onlyAvailableNow, setOnlyAvailableNow] = useState<boolean>(false);

  useEffect(() => {
    async function getUserLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permissão de localização negada!');
        Alert.alert(
          'Localização Necessária',
          'Precisamos da sua localização para mostrar as coletas mais próximas de si. Por favor, ative as permissões nas configurações.',
          [{ text: 'OK', onPress: () => console.log('Alerta fechado') }],
        );
        setLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
    }

    getUserLocation();
  }, []);

  useEffect(() => {
    if (location) {
      fetchCollections(location.coords.latitude, location.coords.longitude);
    }
  }, [location, onlyAvailableNow]);

  async function fetchCollections(lat: number, lng: number) {
    setLoading(true);

    // 1. Pega o usuário logado no momento
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // 2. Passa o user.id para a RPC
    const { data, error } = await supabase.rpc('get_nearby_pending_donations', {
      p_lat: lat,
      p_lng: lng,
      p_radius_meters: 10000,
      p_collector_id: user.id, // ID enviado aqui
      p_available_now: onlyAvailableNow,
    });

    if (error) {
      console.error('Erro ao buscar doações:', error);
    }

    if (!error && data) {
      setCollections(data as DonationCollection[]);
    }

    setLoading(false);
  }

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
        showsUserLocation>
        {collections.map(item => (
          <CollectionMarker
            key={item.donation_id}
            collection={item}
            isSelected={selectedCollection?.donation_id === item.donation_id}
            onPress={() => setSelectedCollection(item)}
          />
        ))}
      </MapView>

      <MapHeader
        onFilterAvailable={setOnlyAvailableNow}
        isAvailableActive={onlyAvailableNow}
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
});
