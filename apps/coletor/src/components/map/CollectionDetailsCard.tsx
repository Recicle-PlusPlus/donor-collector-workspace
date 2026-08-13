import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { DonationCollection } from '../../screens/map/MapScreen';
import { useCompleteDonation } from '@workspace/db';
import { ReviewModal } from '@workspace/ui/src/components/ReviewModal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Props {
  collection: DonationCollection | null;
  isAddedToRoute?: boolean;
  hasRouteBar?: boolean;
  onToggleRoute?: () => void;
  onClose: () => void;
}

export function CollectionDetailsCard({
  collection,
  isAddedToRoute = false,
  hasRouteBar = false,
  onToggleRoute,
  onClose,
}: Props) {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { completeDonation, completing } = useCompleteDonation();
  const [showReview, setShowReview] = useState(false);

  if (!collection) return null;
  const isAccepted = collection.status === 'accepted';

  const baseBottom = Math.max(insets.bottom, 24);
  const dynamicBottom = hasRouteBar ? baseBottom + 90 : baseBottom;

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

  return (
    <View style={[styles.overlayContainer, { bottom: dynamicBottom }]}>
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

        <View style={styles.infoRow}>
          <Text style={styles.distanceText}>
            A {(collection.distance_meters / 1000).toFixed(1)}km de você
          </Text>
          <TouchableOpacity onPress={openInGPS} style={styles.gpsButton}>
            <MaterialCommunityIcons
              name="navigation-variant"
              size={20}
              color="#64748b"
            />
          </TouchableOpacity>
        </View>

        {/* LÓGICA DE BOTÕES INFERIORES */}
        {isAccepted ? (
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              onPress={handleAction}
              style={[styles.actionButton, styles.detailsButtonOutline]}>
              <Text style={styles.detailsTextOutline}>Detalhes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                const result = await completeDonation(collection.donation_id);
                if (result.success) setShowReview(true);
              }}
              disabled={completing}
              style={[styles.actionButton, styles.resumeButton]}>
              <Text style={styles.buttonTextLight}>
                {completing ? 'Aguarde...' : 'Finalizar'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.routeButtonGroup}>
            <TouchableOpacity
              onPress={handleAction}
              style={[styles.actionButton, styles.detailsSecondaryBtn]}>
              <MaterialCommunityIcons
                name="text-box-search-outline"
                size={18}
                color="#64748B"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onToggleRoute}
              style={[
                styles.actionButton,
                isAddedToRoute
                  ? styles.routeRemoveButton
                  : styles.routeAddButton,
              ]}>
              <MaterialCommunityIcons
                name={isAddedToRoute ? 'trash-can-outline' : 'plus'}
                size={18}
                color={isAddedToRoute ? '#EF4444' : '#FFFFFF'}
              />
              <Text
                style={[
                  styles.buttonTextLight,
                  isAddedToRoute && styles.textDestructive,
                ]}>
                {isAddedToRoute ? 'Remover da Rota' : 'Adicionar à Rota'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ReviewModal
        visible={showReview}
        title="Entrega finalizada! Como foi sua coleta?"
        donationId={collection.donation_id}
        revieweeId={collection.donor_id}
        reviewerRole="collector"
        onClose={() => setShowReview(false)}
        onSuccess={() => {
          setShowReview(false);
          onClose();
          navigation.navigate('Main', { refresh: true });
        }}
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
    borderRadius: 24,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    borderWidth: 1,
  },
  cardPending: { borderColor: '#E2E8F0' },
  cardAccepted: { borderColor: '#fef08a' },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleGroup: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerPending: { backgroundColor: '#F1F5F9' },
  iconContainerAccepted: { backgroundColor: '#fefce8' },
  titleTextContainer: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 4,
  },
  badgePending: { backgroundColor: '#ECFDF5' },
  badgeAccepted: { backgroundColor: '#fefce8' },
  badgeText: { fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  badgeTextPending: { color: '#059669' },
  badgeTextAccepted: { color: '#ca8a04' },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  subtitleText: { fontSize: 13, color: '#64748b' },
  closeButton: { padding: 4 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  distanceText: { fontSize: 14, fontWeight: '700', color: '#059669' },
  gpsButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonGroup: { flexDirection: 'row', gap: 8 },
  routeButtonGroup: { flexDirection: 'row', gap: 8 },
  actionButton: {
    flex: 1,
    height: 48,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsSecondaryBtn: { flex: 0.25, backgroundColor: '#F1F5F9' },
  routeAddButton: { flex: 1, backgroundColor: '#059669' },
  routeRemoveButton: { flex: 1, backgroundColor: '#FEF2F2' },
  resumeButton: { backgroundColor: '#ca8a04' },
  detailsButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ca8a04',
  },
  detailsTextOutline: { color: '#ca8a04', fontSize: 14, fontWeight: '700' },
  buttonTextLight: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  textDestructive: { color: '#EF4444' },
});
