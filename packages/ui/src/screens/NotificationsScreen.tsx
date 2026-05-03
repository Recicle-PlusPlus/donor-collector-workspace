import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Package,
  MessageCircle,
  Check,
  BellOff,
  BellRing,
  Inbox,
} from 'lucide-react-native';
import { useNotifications, NotificationItem } from '@workspace/db';

export interface NotificationsScreenProps {
  onBackPress: () => void;
  onNotificationClick: (item: NotificationItem) => void;
}

const NotificationIcon = ({ type }: { type: string }) => {
  if (type === 'donation_accepted') {
    return (
      <View style={[styles.iconContainer, styles.iconContainerSuccess]}>
        <Package size={24} color="#16a34a" />
        <View style={styles.checkBadge}>
          <Check size={12} color="#ffffff" strokeWidth={3} />
        </View>
      </View>
    );
  }
  return (
    <View style={[styles.iconContainer, styles.iconContainerInfo]}>
      <MessageCircle size={24} color="#2563eb" />
    </View>
  );
};

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

  if (diffInMinutes < 1) return 'Agora mesmo';
  if (diffInMinutes < 60) return `Há ${diffInMinutes} min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Há ${diffInHours} h`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return 'Ontem';
  return `Há ${diffInDays} dias`;
}

export function NotificationsScreen({
  onBackPress,
  onNotificationClick,
}: NotificationsScreenProps) {
  const [pushEnabled, setPushEnabled] = useState(false);
  const { notifications, loading, markAsRead } = useNotifications();

  const handleNotificationPress = (item: NotificationItem) => {
    if (!item.is_read) {
      markAsRead(item.id);
    }
    onNotificationClick(item);
  };

  const renderEmptyState = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptySubtitle}>Carregando notificações...</Text>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrapper}>
          <Inbox size={40} color="#9ca3af" strokeWidth={1.5} />
        </View>
        <Text style={styles.emptyTitle}>Você não tem novas notificações</Text>
        <Text style={styles.emptySubtitle}>
          Quando algo importante acontecer, avisaremos você por aqui.
        </Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: NotificationItem }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => handleNotificationPress(item)}
      style={[styles.card, item.is_read ? styles.cardRead : styles.cardUnread]}>
      <NotificationIcon type={item.type} />

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardTime}>
            {formatRelativeTime(item.created_at)}
          </Text>
        </View>
        <Text style={styles.cardBody} numberOfLines={2}>
          {item.body}
        </Text>
      </View>

      {!item.is_read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
            <ArrowLeft size={20} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notificações</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.content}>
          {!pushEnabled && (
            <View style={styles.banner}>
              <View style={styles.bannerIconWrapper}>
                <BellOff size={20} color="#b45309" />
              </View>
              <View style={styles.bannerTextContainer}>
                <Text style={styles.bannerTitle}>Ative as notificações</Text>
                <Text style={styles.bannerSubtitle}>
                  Saiba na hora quando o coletor chegar.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.bannerButton}
                onPress={() => setPushEnabled(true)}>
                <BellRing size={16} color="#ffffff" />
                <Text style={styles.bannerButtonText}>Ativar</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={notifications}
            keyExtractor={item => item.id}
            renderItem={renderItem}
            ListEmptyComponent={renderEmptyState}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1, padding: 16 },
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  bannerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#fef08a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextContainer: { flex: 1 },
  bannerTitle: { fontSize: 14, fontWeight: 'bold', color: '#713f12' },
  bannerSubtitle: { fontSize: 12, color: '#854d0e', marginTop: 2 },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ca8a04',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  bannerButtonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },
  listContent: { gap: 8, paddingBottom: 24, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  cardRead: { backgroundColor: '#ffffff', borderColor: '#f3f4f6' },
  cardUnread: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainerSuccess: { backgroundColor: '#dcfce7' },
  iconContainerInfo: { backgroundColor: '#dbeafe' },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  cardContent: { flex: 1 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  cardTime: { fontSize: 11, fontWeight: '500', color: '#6b7280' },
  cardBody: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
  unreadDot: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#16a34a',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
