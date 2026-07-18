import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  Image,
  TouchableOpacity,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { supabase } from '@workspace/db';
import { colors, Loading, NotificationPermissionDialog } from '@workspace/ui';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';

import { DonationCard } from '@workspace/ui/src/components/DonationCard';
import { AvailableDonations } from '../../components/AvailableDonations';

export function Home() {
  const navigation = useNavigation<any>();
  const { user, profile } = useAuth();

  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function fetchMyDonations() {
    if (!user) return;

    const { data: accepted } = await supabase
      .from('donations')
      .select(
        `
        id, status, created_at,
        addresses (*),
        donation_items ( weight_kg, materials ( name ) ),
        donation_schedules (*)
      `,
      )
      .eq('collector_id', user.id)
      .in('status', ['accepted', 'completed'])
      .order('created_at', { ascending: false });

    if (accepted) setMyDonations(accepted);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyDonations();
    setRefreshKey(prev => prev + 1);
    setRefreshing(false);
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await fetchMyDonations();
      setLoading(false);
    };
    loadAll();
  }, [user]);

  if (loading && myDonations.length === 0) return <Loading />;

  const authName = profile?.name ?? user?.user_metadata?.name;
  const authPhotoUrl = profile?.photo_url ?? user?.user_metadata?.photo_url;
  const firstName =
    typeof authName === 'string' && authName.trim().length > 0
      ? authName.split(' ')[0]
      : 'Coletor';
  const firstLetter = firstName.charAt(0).toUpperCase();
  const avatarSource =
    typeof authPhotoUrl === 'string' && authPhotoUrl.length > 0
      ? { uri: authPhotoUrl }
      : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />
      <NotificationPermissionDialog />

      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('ProfileTab' as any)}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{firstLetter}</Text>
              )}
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Bem-vindo(a) de volta,</Text>
              <Text style={styles.nameText}>Olá, {firstName}!</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => navigation.navigate('Notifications')}>
            <MaterialCommunityIcons
              name="bell-outline"
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
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
        {/* COLETAS ACEITAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Minhas Coletas</Text>
          <Text style={styles.sectionSubtitle}>Histórico e andamento</Text>

          {myDonations.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons
                name="clipboard-text-outline"
                size={40}
                color={colors.textSecondary}
              />
              <Text style={styles.emptyText}>
                Você ainda não aceitou nenhuma coleta.
              </Text>
            </View>
          ) : (
            <View style={styles.verticalList}>
              {myDonations.map(donation => (
                <DonationCard
                  key={donation.id}
                  donation={donation}
                  onPress={() =>
                    navigation.navigate('DonationAccept', {
                      donationId: donation.id,
                    })
                  }
                />
              ))}
            </View>
          )}
        </View>

        <AvailableDonations refreshKey={refreshKey} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background || '#F5F9F7' },
  headerContainer: {
    backgroundColor: colors.primary,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
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
  avatarBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarImage: { width: 56, height: 56, borderRadius: 28 },
  avatarText: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  nameText: { fontSize: 20, fontWeight: 'bold', color: '#FFF', marginTop: 2 },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: { paddingBottom: 100 },
  section: { marginBottom: 30 },
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
