import React from 'react';
import { Marker } from 'react-native-maps';
import { DonationCollection } from '../../screens/map/MapScreen';

interface Props {
  collection: DonationCollection;
  isSelected: boolean;
  isAddedToRoute: boolean;
  onPress: () => void;
}

export function CollectionMarker({
  collection,
  isSelected,
  isAddedToRoute,
  onPress,
}: Props) {
  const isAccepted = collection.status === 'accepted';

  let markerSource = require('../../../assets/marker_green.png');

  if (isAddedToRoute) {
    markerSource = require('../../../assets/marker_orange.png');
  } else if (isSelected) {
    markerSource = require('../../../assets/marker_primary.png');
  } else if (isAccepted) {
    markerSource = require('../../../assets/marker_yellow.png');
  }
  const sizeMultiplier = isSelected || isAddedToRoute ? 1.2 : 1;

  return (
    <Marker
      coordinate={{
        latitude: collection.address.lat,
        longitude: collection.address.lng,
      }}
      onPress={onPress}
      image={markerSource}
      anchor={{ x: 0.5, y: 1 }}
      tracksViewChanges={false}
      style={{
        width: 44 * sizeMultiplier,
        height: 58 * sizeMultiplier,
      }}
    />
  );
}
