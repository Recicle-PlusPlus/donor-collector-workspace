import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { colors, ErrorModal } from '@workspace/ui';
import { useAuth } from '@workspace/db/src/contexts/AuthContext';
import { RootStackParamList } from '../../navigation';

import { useGetDonorStatistics } from '../../hooks/useGetDonorStatistics';
import { useGetRecentDonations } from '../../hooks/useGetRecentDonations';

import { ImpactSection } from './../../components/home/ImpactSection';
import { ActiveDonations } from './../../components/home/ActiveDonations';

type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Main'
>;

export function Home() {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const { user, profile } = useAuth();
  const donorId = user?.id;

  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    statistics,
    loading: statsLoading,
    error: statsError,
  } = useGetDonorStatistics(donorId);
  const {
    donations,
    loading: donationsLoading,
    error: donationsError,
  } = useGetRecentDonations(donorId);

  useEffect(() => {
    if (statsError || donationsError) {
      setErrorMsg('Ocorreu um problema ao carregar os seus dados.');
    }
  }, [statsError, donationsError]);

  const authName = profile?.name ?? user?.user_metadata?.name;
  const authPhotoUrl = profile?.photo_url ?? user?.user_metadata?.photo_url;
  const firstName =
    typeof authName === 'string' && authName.trim().length > 0
      ? authName.split(' ')[0]
      : 'Doador';
  const firstLetter = firstName.charAt(0).toUpperCase();
  const avatarSource =
    typeof authPhotoUrl === 'string' && authPhotoUrl.length > 0
      ? { uri: authPhotoUrl }
      : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      {!!errorMsg && (
        <ErrorModal
          title="Erro de Conexão"
          content={errorMsg}
          closeFunc={() => setErrorMsg(null)}
        />
      )}

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <View style={styles.headerContent}>
          <View style={styles.userInfo}>
            <TouchableOpacity
              style={styles.avatarBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Profile' as any)}>
              {avatarSource ? (
                <Image source={avatarSource} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{firstLetter}</Text>
              )}
            </TouchableOpacity>

            <View>
              <Text style={styles.welcomeText}>Bem-vindo de volta</Text>
              <Text style={styles.nameText}>Olá, {firstName}!</Text>
            </View>
          </View>

          {/* Notificações */}
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
        contentContainerStyle={styles.mainContent}
        showsVerticalScrollIndicator={false}>
        {/* SEÇÃO DE IMPACTO */}
        <ImpactSection
          statistics={statistics}
          loading={statsLoading}
          pointsBalance={0}
        />

        {/* BOTÃO DE NOVA DOAÇÃO */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.ctaButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('DonationStep1')}>
            <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
            <Text style={styles.ctaText}>Criar Nova Doação</Text>
          </TouchableOpacity>
        </View>

        {/* DOAÇÕES ATIVAS */}
        <ActiveDonations donations={donations} loading={donationsLoading} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

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
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 15 },

  avatarBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: 'bold' },

  welcomeText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  nameText: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginTop: 2 },

  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  mainContent: { padding: 20, paddingTop: 25, paddingBottom: 100 },

  ctaContainer: { marginBottom: 30 },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 64,
    borderRadius: 16,
    gap: 10,
    elevation: 3,
  },
  ctaText: { color: '#FFF', fontSize: 18, fontWeight: '600' },
});
