import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { supabase } from '@workspace/db';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

const { width, height } = Dimensions.get('window');

export function ChatUserProfileScreen() {
  const route = useRoute<any>();
  const { userId } = route.params;

  const [userInfo, setUserInfo] = useState<any>(null);
  const [donationCount, setDonationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    async function fetchUserData() {
      setLoading(true);
      const userReq = supabase
        .from('users')
        .select('name, photo_url, created_at')
        .eq('id', userId)
        .single();

      const countReq = supabase
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .or(`donor_id.eq.${userId},collector_id.eq.${userId}`)
        .eq('status', 'completed');

      const [userRes, countRes] = await Promise.all([userReq, countReq]);

      if (userRes.data) setUserInfo(userRes.data);
      if (countRes.count) setDonationCount(countRes.count);

      setLoading(false);
    }
    fetchUserData();
  }, [userId]);

  const joinDate = userInfo?.created_at
    ? new Date(userInfo.created_at).toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      })
    : 'Não informado';

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Modal visible={isModalVisible} transparent={true} animationType="fade">
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.modalCloseButton}
            onPress={() => setIsModalVisible(false)}>
            <MaterialCommunityIcons name="close" size={32} color="#FFF" />
          </TouchableOpacity>
          {userInfo?.photo_url && (
            <Image
              source={{ uri: userInfo.photo_url }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => userInfo?.photo_url && setIsModalVisible(true)}
          activeOpacity={0.9}>
          <View style={styles.avatarWrapper}>
            {userInfo?.photo_url ? (
              <Image
                source={{ uri: userInfo.photo_url }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons
                  name="account"
                  size={60}
                  color={colors.primary}
                />
              </View>
            )}
          </View>
        </TouchableOpacity>

        <Text style={styles.name}>{userInfo?.name || 'Usuário'}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Estatísticas do Usuário</Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="recycle"
            size={16}
            color={colors.primary}
          />
          <Text style={styles.badgeText}>
            {donationCount} reciclagens realizadas
          </Text>
        </View>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons
            name="calendar-account"
            size={24}
            color={colors.primary}
          />
          <View style={styles.infoText}>
            <Text style={styles.label}>Membro desde</Text>
            <Text style={styles.value}>{joinDate}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    backgroundColor: colors.primary,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  avatarWrapper: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 60,
    marginBottom: 15,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: { fontSize: 24, fontWeight: 'bold', color: '#FFF', marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 5,
  },
  badgeText: {
    marginLeft: 6,
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  content: { padding: 20, marginTop: 10 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 15,
    marginLeft: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  infoText: { marginLeft: 15 },
  label: { fontSize: 12, color: '#999', textTransform: 'uppercase' },
  value: { fontSize: 16, color: '#333', fontWeight: '500' },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseButton: { position: 'absolute', top: 50, right: 20, zIndex: 1 },
  fullImage: { width: width, height: height * 0.7 },
});
