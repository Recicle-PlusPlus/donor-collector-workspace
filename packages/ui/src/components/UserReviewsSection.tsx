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
import { useUserReviews, UserReview, ReviewProfileRole } from '@workspace/db';
import { colors } from '../theme/colors';

interface CriterionSummary {
  key: string;
  label: string;
}

const PROFILE_CRITERIA: Record<ReviewProfileRole, CriterionSummary[]> = {
  donor: [
    { key: 'material_condition', label: 'Estado do material' },
    { key: 'description_accuracy', label: 'Conforme a descrição' },
    { key: 'pickup_readiness', label: 'Pronto para retirada' },
    { key: 'wait_time', label: 'Tempo de espera' },
    { key: 'communication', label: 'Agilidade nas respostas' },
  ],
  collector: [
    { key: 'punctuality', label: 'Pontualidade' },
    { key: 'material_care', label: 'Cuidado com os materiais' },
    { key: 'communication', label: 'Agilidade nas respostas' },
    { key: 'courtesy', label: 'Cordialidade' },
    { key: 'collection_experience', label: 'Experiência com a coleta' },
  ],
};

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

interface UserReviewsSectionProps {
  userId: string;
  profileRole: ReviewProfileRole;
}

export function UserReviewsSection({
  userId,
  profileRole,
}: UserReviewsSectionProps) {
  const [visible, setVisible] = useState(false);
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const criteria = PROFILE_CRITERIA[profileRole];
  const {
    averageRating,
    reviewCount,
    criteriaAverages,
    reviews,
    summaryLoading,
    reviewsLoading,
    hasMore,
    error,
    loadReviews,
  } = useUserReviews(userId, profileRole);

  const openReviews = () => {
    setExpandedReviewId(null);
    setVisible(true);
    loadReviews(true);
  };

  const renderReview = ({ item }: { item: UserReview }) => {
    const expanded = expandedReviewId === item.donation_id;
    const criterionAverage =
      criteria.reduce(
        (total, criterion) =>
          total + (item.criteria_ratings[criterion.key] || 0),
        0,
      ) / criteria.length;

    return (
      <View style={styles.reviewCard}>
        <Text style={styles.reviewAuthor}>
          {item.reviewer_name?.trim() || 'Usuário'}
        </Text>
        <View style={styles.reviewMeta}>
          {renderStars(criterionAverage, 14)}
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.reviewDate}>
            {formatReviewDate(item.created_at)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.commentButton}
          onPress={() =>
            setExpandedReviewId(current =>
              current === item.donation_id ? null : item.donation_id,
            )
          }>
          <Text
            style={item.comment?.trim() ? styles.comment : styles.emptyComment}>
            {item.comment?.trim() || 'Avaliação sem comentário.'}
          </Text>
          <View style={styles.commentDetailsHint}>
            <Text style={styles.commentDetailsHintText}>
              {expanded ? 'Ocultar notas' : 'Ver notas por critério'}
            </Text>
            <MaterialCommunityIcons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.primary}
            />
          </View>
        </TouchableOpacity>

        {expanded && (
          <View style={styles.reviewCriteria}>
            {criteria.map(criterion => {
              const rating = item.criteria_ratings[criterion.key] || 0;
              return (
                <View key={criterion.key} style={styles.reviewCriterionRow}>
                  <Text style={styles.reviewCriterionLabel}>
                    {criterion.label}
                  </Text>
                  <View style={styles.reviewCriterionRating}>
                    {renderStars(rating, 14)}
                    <Text style={styles.reviewCriterionNumber}>
                      {rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

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

          <View style={styles.modalCriteriaSummary}>
            <Text style={styles.criteriaTitle}>Médias por critério</Text>
            {criteria.map(criterion => (
              <View key={criterion.key} style={styles.criteriaRow}>
                <Text style={styles.criteriaLabel}>{criterion.label}</Text>
                <View style={styles.criteriaValue}>
                  {renderStars(criteriaAverages[criterion.key] || 0, 15)}
                  <Text style={styles.criteriaNumber}>
                    {(criteriaAverages[criterion.key] || 0).toFixed(1)}
                  </Text>
                </View>
              </View>
            ))}
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
  modalCriteriaSummary: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#F8FAFC',
  },
  criteriaTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  criteriaLabel: { flex: 1, color: '#475569', fontSize: 13 },
  criteriaValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 12,
  },
  criteriaNumber: { color: '#1E293B', fontSize: 14, fontWeight: '700' },
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
  commentButton: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  commentDetailsHint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentDetailsHintText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewCriteria: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    marginTop: 8,
    padding: 12,
  },
  reviewCriterionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  reviewCriterionLabel: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
    marginRight: 8,
  },
  reviewCriterionRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reviewCriterionNumber: {
    minWidth: 24,
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  emptyContainer: { alignItems: 'center', padding: 30 },
  emptyText: {
    marginTop: 12,
    textAlign: 'center',
    color: colors.textSecondary,
  },
  footerLoader: { padding: 18 },
});
