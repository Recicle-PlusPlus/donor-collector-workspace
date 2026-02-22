import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, ButtonDefault, Loading, ErrorModal } from '@workspace/ui';
import { useAuth } from '../../contexts/AuthContext';

import { RootStackParamList } from '../../navigation';
import { useGetDonorStatistics } from '../../hooks/useGetDonorStatistics';
import { useGetRecentDonations } from '../../hooks/useGetRecentDonations';

import { HomeHeader } from '../../components/HomeHeader';
import { StatisticItem } from '../../components/StatisticItem';
import { DonationCard } from '../../components/DonationCard';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Home'
>;
type HomeScreenRouteProp = RouteProp<RootStackParamList, 'Home'>;

export function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const route = useRoute<HomeScreenRouteProp>();
  const { user } = useAuth();

  const donorId = user?.id;
  const donorName = user?.user_metadata?.name || 'Doador';
  const userPhotoUrl = user?.user_metadata?.photo_url
    ? { uri: user?.user_metadata?.photo_url }
    : null;

  const {
    statistics,
    loading: statsLoading,
    error: statsError,
  } = useGetDonorStatistics(donorId);
  const {
    donations,
    loading: donationsLoading,
    error: donationsError,
    refetch,
  } = useGetRecentDonations(donorId);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.refresh) {
      refetch();
      navigation.setParams({ refresh: false });
    }
  }, [route.params?.refresh, navigation, refetch]);

  if (donationsLoading && !donations.length) {
    return <Loading message="Carregando dados..." />;
  }

  const renderStatistics = () => {
    if (statsLoading) {
      return (
        <ActivityIndicator
          size="large"
          color={colors.primary}
          style={{ marginVertical: 20 }}
        />
      );
    }

    if (statsError || !statistics || statistics.collectionsCompleted === 0) {
      return (
        <View style={styles.centeredMessage}>
          <Text style={styles.emptyText}>
            Nenhuma doação completada ainda. Cadastre a sua primeira doação!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.statisticsContainer}>
        <StatisticItem
          label="Coletas Completadas"
          value={statistics.collectionsCompleted.toString()}
        />
        {statistics.materialTotals.map(
          material =>
            material.totalKg > 0 && (
              <StatisticItem
                key={material.name}
                label={material.name}
                value={`${material.totalKg.toFixed(1)} kg`}
              />
            ),
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {!!(donationsError || statsError) && (
        <ErrorModal
          title="Erro de Conexão"
          content="Ocorreu um problema ao carregar os seus dados."
          closeFunc={() => setErrorMsg(null)} // To-DO: criar uma função para resetar os erros dos hooks
        />
      )}

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <HomeHeader donorName={donorName} userImage={userPhotoUrl} />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Minhas Estatísticas</Text>
        </View>

        {renderStatistics()}

        <View style={styles.mainButtonContainer}>
          <ButtonDefault
            title="Agendar Nova Coleta"
            fun={() => alert('Navegar para DonationCreation')}
            color={colors.primary}
            textColor={colors.textLight}
            width={0.8}
            radius={50}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Últimas Doações</Text>
        </View>

        <FlatList
          horizontal
          data={donations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <DonationCard item={item} />}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 10 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Nenhum histórico para exibir.</Text>
          }
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { paddingHorizontal: 20, marginTop: 30, marginBottom: 10 },
  sectionTitle: { color: colors.primary, fontWeight: 'bold', fontSize: 18 },
  centeredMessage: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyText: { color: colors.textSecondary, fontStyle: 'italic' },
  mainButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  statisticsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
});
