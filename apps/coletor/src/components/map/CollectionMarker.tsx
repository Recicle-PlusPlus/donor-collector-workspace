import React from 'react';
import { Marker } from 'react-native-maps';
import { StyleSheet } from 'react-native';
import { DonationCollection } from '../../screens/map/MapScreen';

interface Props {
  collection: DonationCollection;
  isSelected: boolean;
  onPress: () => void;
}

export function CollectionMarker({ collection, isSelected, onPress }: Props) {
  const isInProgress = collection.status === 'accepted';

  const markerImage = isInProgress
    ? require('../../../assets/marker_yellow.png')
    : require('../../../assets/marker_green.png');

  return (
    <Marker
      coordinate={{
        latitude: collection.address.lat,
        longitude: collection.address.lng,
      }}
      onPress={onPress}
      image={markerImage}
      anchor={{ x: 0.5, y: 1 }}
      style={styles.marker}
    />
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 44,
    height: 58,
  },
});
