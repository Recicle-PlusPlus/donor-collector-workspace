import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DonationCollection } from '../../screens/map/MapScreen';
import { useCompleteDonation } from '@workspace/db';
import { ReviewModal } from '@workspace/ui/src/components/ReviewModal';
interface Props {
  collection: DonationCollection | null;
  onClose: () => void;
}

export function CollectionDetailsCard({ collection, onClose }: Props) {
  const navigation = useNavigation<any>();
  const { completeDonation, completing } = useCompleteDonation();
  const [showReview, setShowReview] = useState(false);

  if (!collection) return null;

  const isAccepted = collection.status === 'accepted';

  const openInGPS = () => {
    const { lat, lng } = collection.address;
    const url = Platform.select({
      ios: `maps:0,0?q=${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(Coleta)`,
    });
    if (url) Linking.openURL(url);
  };

  const handleAction = () => {
    onClose();
    navigation.navigate('DonationAccept', {
      donationId: collection.donation_id,
    });
  };

  const handleComplete = async () => {
    const result = await completeDonation(collection.donation_id);
    if (result.success) {
      setShowReview(true);
    } else {
      Alert.alert(
        'Erro',
        'Não foi possível finalizar a coleta. Tente novamente.',
      );
    }
  };

  const handleReviewSuccess = () => {
    setShowReview(false);
    onClose();
    navigation.navigate('Main', { refresh: true });
  };
  return (
    <View style={styles.overlayContainer}>
      <View
        style={[
          styles.card,
          isAccepted ? styles.cardAccepted : styles.cardPending,
        ]}>
        <View style={styles.headerRow}>
          <View style={styles.titleGroup}>
            <View
              style={[
                styles.iconContainer,
                isAccepted
                  ? styles.iconContainerAccepted
                  : styles.iconContainerPending,
              ]}>
              <Feather
                name={isAccepted ? 'clock' : 'package'}
                size={24}
                color={isAccepted ? '#ca8a04' : '#059669'}
              />
            </View>

            <View style={styles.titleTextContainer}>
              <View
                style={[
                  styles.badge,
                  isAccepted ? styles.badgeAccepted : styles.badgePending,
                ]}>
                <Text
                  style={[
                    styles.badgeText,
                    isAccepted
                      ? styles.badgeTextAccepted
                      : styles.badgeTextPending,
                  ]}>
                  {isAccepted
                    ? 'Sua Coleta em Andamento'
                    : 'Nova Coleta Disponível'}
                </Text>
              </View>

              <Text style={styles.titleText} numberOfLines={1}>
                {collection.address.neighborhood}
              </Text>
              <Text style={styles.subtitleText} numberOfLines={1}>
                {collection.address.street}, {collection.address.num}
              </Text>
            </View>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionRow}>
          <View>
            <Text style={styles.distanceText}>
              A {(collection.distance_meters / 1000).toFixed(1)}km
            </Text>
            <Text style={styles.itemsText}>
              {collection.materials?.length || 0} itens
            </Text>
          </View>

          <View style={styles.buttonGroup}>
            <TouchableOpacity onPress={openInGPS} style={styles.gpsButton}>
              <MaterialCommunityIcons
                name="navigation-variant"
                size={20}
                color="#64748b"
              />
            </TouchableOpacity>

            {isAccepted ? (
              <>
                <TouchableOpacity
                  onPress={handleAction}
                  style={[styles.acceptButton, styles.detailsButtonOutline]}>
                  <Text style={styles.detailsTextOutline}>Detalhes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleComplete}
                  disabled={completing}
                  style={[styles.acceptButton, styles.resumeButton]}>
                  <Text style={styles.acceptText}>
                    {completing ? 'Aguarde...' : 'Finalizar'}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                onPress={handleAction}
                style={[styles.acceptButton, styles.newButton]}>
                <Text style={styles.acceptText}>Ver detalhes</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ReviewModal
        visible={showReview}
        title="Entrega finalizada! Como foi sua coleta?"
        donationId={collection.donation_id}
        revieweeId={collection.donor_id}
        reviewerRole="collector"
        onClose={() => setShowReview(false)}
        onSuccess={handleReviewSuccess}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlayContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 50,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    borderWidth: 1,
  },
  cardPending: {
    borderColor: '#3dc096',
  },
  cardAccepted: {
    borderColor: '#fef08a',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerPending: {
    backgroundColor: '#ecfdf5',
  },
  iconContainerAccepted: {
    backgroundColor: '#fefce8',
  },
  titleTextContainer: {
    flex: 1,
  },
  // Estilos da nova Tag (Badge)
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgePending: {
    backgroundColor: '#ecfdf5',
  },
  badgeAccepted: {
    backgroundColor: '#fefce8',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  badgeTextPending: {
    color: '#059669',
  },
  badgeTextAccepted: {
    color: '#ca8a04',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitleText: {
    fontSize: 13,
    color: '#64748b',
  },
  closeButton: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  itemsText: {
    fontSize: 13,
    color: '#64748b',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  gpsButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    height: 44,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newButton: {
    backgroundColor: '#059669',
  },
  resumeButton: {
    backgroundColor: '#ca8a04',
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  detailsButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ca8a04',
  },
  detailsTextOutline: {
    color: '#ca8a04',
    fontSize: 14,
    fontWeight: '600',
  },
});
