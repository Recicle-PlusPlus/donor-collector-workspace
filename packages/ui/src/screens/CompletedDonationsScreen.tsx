import React, { useCallback, useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { supabase } from '@workspace/db';
import { colors, Loading } from '@workspace/ui';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { DonationCard } from '@workspace/ui/src/components/DonationCard';
import { getSaoPauloWeekKey } from '../utils/donation';

export function CompletedDonationsScreen({
  userId,
  userRole,
  navigationRouteName,
}: {
  userId: string;
  userRole: 'donor' | 'collector';
  navigationRouteName: string;
}) {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [completedDonations, setCompletedDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCompletedDonations() {
    if (!user) return;

    const { data } = await supabase
      .from('donations')
      .select(
        `
        id, status, created_at, completed_at, donor_reviewed, collector_reviewed,
        addresses (*),
        donation_items ( weight_kg, materials ( name ) ),
        donation_schedules (*)
      `,
      )

      .eq(userRole === 'donor' ? 'donor_id' : 'collector_id', userId)
      .in('status', ['completed', 'awaiting_review'])
      .order('completed_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (data) setCompletedDonations(data);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCompletedDonations();
    setRefreshing(false);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchCompletedDonations();
      setLoading(false);
    };
    loadAll();
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchCompletedDonations();
    }, [user, userId, userRole]),
  );

  if (loading) return <Loading />;

  const currentWeekKey = getSaoPauloWeekKey(new Date());
  const thisWeekDonations = completedDonations.filter(
    donation =>
      donation.completed_at &&
      getSaoPauloWeekKey(donation.completed_at) === currentWeekKey,
  );
  const olderDonations = completedDonations.filter(
    donation =>
      !donation.completed_at ||
      getSaoPauloWeekKey(donation.completed_at) !== currentWeekKey,
  );

  const renderDonationCards = (donations: any[]) => (
    <View style={styles.verticalList}>
      {donations.map(donation => (
        <DonationCard
          key={donation.id}
          donation={donation}
          viewerRole={userRole}
          onPress={() =>
            navigation.navigate(navigationRouteName, {
              donationId: donation.id,
            })
          }
        />
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <View>
              <Text style={styles.nameText}>Histórico de Coletas,</Text>
              <Text style={styles.welcomeText}>Suas coletas concluidas!</Text>
            </View>
          </View>
        </View>
      </View>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
          />
        }>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entregas Dessa Semana</Text>
          <Text style={styles.sectionSubtitle}>
            Entregas realizadas durante esta semana
          </Text>

          {thisWeekDonations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="calendar-blank-outline"
                size={40}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                Nenhuma entrega concluída nesta semana.
              </Text>
            </View>
          ) : (
            renderDonationCards(thisWeekDonations)
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Entregas Mais Antigas</Text>
          <Text style={styles.sectionSubtitle}>
            Entregas realizadas antes desta semana
          </Text>

          {olderDonations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="history"
                size={40}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                Nenhuma entrega mais antiga no histórico.
              </Text>
            </View>
          ) : (
            renderDonationCards(olderDonations)
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#F5F9F7',
  },
  headerContainer: {
    backgroundColor: colors.primary,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
    marginBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  scrollContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryDark,
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  verticalList: {
    paddingHorizontal: 20,
    gap: 15,
  },
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
  },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
});
