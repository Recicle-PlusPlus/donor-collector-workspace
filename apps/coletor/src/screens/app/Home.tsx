import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  RefreshControl,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { supabase } from '@workspace/db';
import { colors, Loading } from '@workspace/ui';
import { DonationCard } from '../../components/DonationCard';
import { useAuth } from '../../contexts/AuthContext';

export function Home() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();

  const [collectorName, setCollectorName] = useState('Coletor');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [city, setCity] = useState<string | null>(null);

  const [pendingDonations, setPendingDonations] = useState<any[]>([]);
  const [myDonations, setMyDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchCollectorData() {
    if (!user) return;
    const { data } = await supabase
      .from('users')
      .select('name, photo_url')
      .eq('id', user.id)
      .single();
    if (data) {
      setCollectorName(data.name || 'Coletor');
      setPhotoUrl(data.photo_url || null);
    }
  }

  async function fetchDonations() {
    // TO-DO: filtros, por exemplo por cidade: .eq('address.city', 'São Carlos')
    const { data: pending } = await supabase
      .from('donations')
      .select(
        `
        id, status, created_at,
        address:addresses ( neighborhood, city ),
        donor:users!donor_id ( name, photo_url, phone ),
        items:donation_items ( weight_kg, material:materials ( name ) )
      `,
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pending) setPendingDonations(pending);

    // 2. Busca as doações que ESTE coletor aceitou
    if (user) {
      const { data: accepted } = await supabase
        .from('donations')
        .select(
          `
          id, status, created_at,
          address:addresses ( neighborhood, city ),
          donor:users!donor_id ( name, photo_url, phone ),
          items:donation_items ( weight_kg, material:materials ( name ) )
        `,
        )
        .eq('collector_id', user.id)
        .in('status', ['accepted', 'completed']) // Traz as em andamento e concluídas
        .order('created_at', { ascending: false });

      if (accepted) setMyDonations(accepted);
    }
  }

  async function loadAllData() {
    setLoading(true);
    await fetchCollectorData();
    await fetchDonations();
    setLoading(false);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDonations();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, [user]);

  if (loading) return <Loading />;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
        />
      }>
      {/* CABEÇALHO */}
      <View style={styles.header}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.welcomeText}>Bem-vindo(a),</Text>
          <Text style={styles.nameText} numberOfLines={1}>
            {collectorName}
          </Text>
        </View>
        <View style={styles.imageWrapper}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.image} />
          ) : (
            <MaterialCommunityIcons
              name="account"
              size={40}
              color={colors.primary}
            />
          )}
        </View>
      </View>

      {/* COLETAS DISPONÍVEIS (PENDENTES) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Coletas Disponíveis</Text>
        <Text style={styles.sectionSubtitle}>
          Novas doações aguardando retirada
        </Text>

        {pendingDonations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons
              name="leaf-off"
              size={40}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyText}>
              Nenhuma coleta disponível no momento.
            </Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {pendingDonations.map(donation => (
              <View key={donation.id} style={{ marginRight: 15 }}>
                <DonationCard
                  donation={donation}
                  isPending={true}
                  onPressDetails={() =>
                    navigation.navigate('DonationAccept', {
                      donationId: donation.id,
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* MINHAS COLETAS (EM ANDAMENTO) */}
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {myDonations.map(donation => (
              <View key={donation.id} style={{ marginRight: 15 }}>
                <DonationCard
                  donation={donation}
                  isPending={false}
                  onPressDetails={() =>
                    navigation.navigate('DonationAccept', {
                      donationId: donation.id,
                    })
                  }
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTextContainer: { flex: 1 },
  welcomeText: { color: colors.textLight, fontSize: 16 },
  nameText: { color: colors.textLight, fontSize: 24, fontWeight: 'bold' },
  imageWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  image: { width: '100%', height: '100%', borderRadius: 30 },
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
  scrollContent: { paddingHorizontal: 20, paddingBottom: 10 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    marginHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  emptyText: {
    color: colors.textSecondary,
    marginTop: 10,
    textAlign: 'center',
  },
});
