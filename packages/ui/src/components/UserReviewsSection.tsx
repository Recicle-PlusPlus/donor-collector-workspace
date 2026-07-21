import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useUserReviews, UserReview } from '@workspace/db';
import { colors } from '../theme/colors';

const renderStars = (rating: number, size: number) => (
  <View style={styles.starsRow}>
    {[1, 2, 3, 4, 5].map(star => (
      <MaterialCommunityIcons
        key={star}
        name={star <= Math.round(rating) ? 'star' : 'star-outline'}
        size={size}
        color="#F59E0B"
      />
    ))}
  </View>
);

const formatReviewDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const elapsedMilliseconds = Math.max(0, now.getTime() - date.getTime());
  const elapsedMinutes = Math.floor(elapsedMilliseconds / 60000);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDays = Math.floor(elapsedHours / 24);

  if (elapsedMinutes < 1) return 'agora';
  if (elapsedMinutes < 60)
    return `há ${elapsedMinutes} ${elapsedMinutes === 1 ? 'minuto' : 'minutos'}`;
  if (elapsedHours < 24)
    return `há ${elapsedHours} ${elapsedHours === 1 ? 'hora' : 'horas'}`;
  if (elapsedDays < 30)
    return `há ${elapsedDays} ${elapsedDays === 1 ? 'dia' : 'dias'}`;

  return date.toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export function UserReviewsSection({ userId }: { userId: string }) {
  const [visible, setVisible] = useState(false);
  const {
    averageRating,
    reviewCount,
    reviews,
    summaryLoading,
    reviewsLoading,
    hasMore,
    error,
    loadReviews,
  } = useUserReviews(userId);

  const openReviews = () => {
    setVisible(true);
    loadReviews(true);
  };

  const renderReview = ({ item }: { item: UserReview }) => (
    <View style={styles.reviewCard}>
      <Text style={styles.reviewAuthor}>
        {item.reviewer_name?.trim() || 'Usuário'}
      </Text>
      <View style={styles.reviewMeta}>
        {renderStars(item.rating, 14)}
        <Text style={styles.metaSeparator}>•</Text>
        <Text style={styles.reviewDate}>
          {formatReviewDate(item.created_at)}
        </Text>
      </View>
      <Text style={item.comment?.trim() ? styles.comment : styles.emptyComment}>
        {item.comment?.trim() || 'Avaliação sem comentário.'}
      </Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.summaryCard}
        activeOpacity={0.75}
        onPress={openReviews}
        disabled={summaryLoading}>
        {summaryLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <>
            <View style={styles.averageContainer}>
              <View style={styles.averageRow}>
                <Text style={styles.average}>{averageRating.toFixed(1)}</Text>
                {renderStars(averageRating, 20)}
              </View>
              <Text style={styles.reviewCount}>
                {reviewCount === 1
                  ? '1 avaliação'
                  : `${reviewCount} avaliações`}
              </Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={colors.textSecondary}
              style={styles.summaryChevron}
            />
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        onRequestClose={() => setVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Avaliações recebidas</Text>
              <Text style={styles.modalSubtitle}>
                {averageRating.toFixed(1)} de 5 · {reviewCount}{' '}
                {reviewCount === 1 ? 'avaliação' : 'avaliações'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color="#334155" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={reviews}
            keyExtractor={item => item.donation_id}
            renderItem={renderReview}
            contentContainerStyle={
              reviews.length === 0 ? styles.emptyList : styles.listContent
            }
            onEndReached={() => {
              if (hasMore && !reviewsLoading) loadReviews();
            }}
            onEndReachedThreshold={0.4}
            ListEmptyComponent={
              reviewsLoading ? (
                <ActivityIndicator size="large" color={colors.primary} />
              ) : (
                <View style={styles.emptyContainer}>
                  <MaterialCommunityIcons
                    name="star-outline"
                    size={48}
                    color="#CBD5E1"
                  />
                  <Text style={styles.emptyText}>
                    {error
                      ? 'Não foi possível carregar as avaliações.'
                      : 'Esta pessoa ainda não recebeu avaliações.'}
                  </Text>
                </View>
              )
            }
            ListFooterComponent={
              reviews.length > 0 && reviewsLoading ? (
                <ActivityIndicator
                  style={styles.footerLoader}
                  color={colors.primary}
                />
              ) : null
            }
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  averageContainer: { alignItems: 'center' },
  averageRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  average: { fontSize: 25, fontWeight: 'bold', color: '#1E293B' },
  starsRow: { flexDirection: 'row' },
  reviewCount: { marginTop: 4, fontSize: 12, color: colors.textSecondary },
  summaryChevron: { position: 'absolute', right: 15 },
  modalContainer: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { fontSize: 21, fontWeight: 'bold', color: '#1E293B' },
  modalSubtitle: { marginTop: 4, fontSize: 14, color: colors.textSecondary },
  closeButton: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 12 },
  listContent: { paddingHorizontal: 18, paddingBottom: 40 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  reviewCard: {
    paddingVertical: 18,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  reviewAuthor: {
    marginBottom: 5,
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  reviewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  metaSeparator: {
    marginHorizontal: 5,
    fontSize: 12,
    color: colors.textSecondary,
  },
  reviewDate: { fontSize: 12, color: colors.textSecondary },
  comment: { fontSize: 14, lineHeight: 20, color: '#374151' },
  emptyComment: { fontSize: 14, fontStyle: 'italic', color: '#94A3B8' },
  emptyContainer: { alignItems: 'center', padding: 30 },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  footerLoader: { padding: 18 },
});
