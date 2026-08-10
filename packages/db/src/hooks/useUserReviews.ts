import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../client';

const REVIEWS_PAGE_SIZE = 20;

export type ReviewProfileRole = 'donor' | 'collector';

export interface UserReview {
  donation_id: string;
  reviewer_id: string;
  reviewer_name: string | null;
  rating: number;
  criteria_ratings: Record<string, number>;
  comment: string | null;
  created_at: string;
}

interface DetailedReviewRow extends Omit<UserReview, 'criteria_ratings'> {
  punctuality_rating: number;
  material_care_rating: number;
  communication_rating: number;
  courtesy_rating: number;
  collection_experience_rating: number;
  material_condition_rating: number;
  description_accuracy_rating: number;
  pickup_readiness_rating: number;
  wait_time_rating: number;
}

export const useUserReviews = (
  userId: string | undefined,
  profileRole: ReviewProfileRole,
) => {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [criteriaAverages, setCriteriaAverages] = useState<
    Record<string, number>
  >({});
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) {
      setAverageRating(0);
      setReviewCount(0);
      setCriteriaAverages({});
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setError(null);

    const { data, error: summaryError } = await supabase.rpc(
      'get_user_detailed_review_summary',
      { p_user_id: userId, p_profile_role: profileRole },
    );

    if (summaryError) {
      console.error('Erro ao buscar resumo das avaliações:', summaryError);
      setError(summaryError);
    } else {
      const summary = Array.isArray(data) ? data[0] : data;
      setAverageRating(Number(summary?.average_rating) || 0);
      setReviewCount(Number(summary?.review_count) || 0);
      setCriteriaAverages({
        punctuality: Number(summary?.punctuality_average) || 0,
        material_care: Number(summary?.material_care_average) || 0,
        communication: Number(summary?.communication_average) || 0,
        courtesy: Number(summary?.courtesy_average) || 0,
        collection_experience:
          Number(summary?.collection_experience_average) || 0,
        material_condition: Number(summary?.material_condition_average) || 0,
        description_accuracy:
          Number(summary?.description_accuracy_average) || 0,
        pickup_readiness: Number(summary?.pickup_readiness_average) || 0,
        wait_time: Number(summary?.wait_time_average) || 0,
      });
    }

    setSummaryLoading(false);
  }, [profileRole, userId]);

  const loadReviews = useCallback(
    async (reset = false) => {
      if (!userId || reviewsLoading) return;

      setReviewsLoading(true);
      setError(null);

      const offset = reset ? 0 : reviews.length;
      const { data, error: reviewsError } = await supabase.rpc(
        'get_user_detailed_reviews',
        {
          p_user_id: userId,
          p_profile_role: profileRole,
          p_limit: REVIEWS_PAGE_SIZE,
          p_offset: offset,
        },
      );

      if (reviewsError) {
        console.error('Erro ao buscar avaliações:', reviewsError);
        setError(reviewsError);
      } else {
        const nextReviews = ((data || []) as DetailedReviewRow[]).map(
          review => ({
            ...review,
            rating: Number(review.rating) || 0,
            criteria_ratings: {
              punctuality: Number(review.punctuality_rating) || 0,
              material_care: Number(review.material_care_rating) || 0,
              communication: Number(review.communication_rating) || 0,
              courtesy: Number(review.courtesy_rating) || 0,
              collection_experience:
                Number(review.collection_experience_rating) || 0,
              material_condition: Number(review.material_condition_rating) || 0,
              description_accuracy:
                Number(review.description_accuracy_rating) || 0,
              pickup_readiness: Number(review.pickup_readiness_rating) || 0,
              wait_time: Number(review.wait_time_rating) || 0,
            },
          }),
        );

        setReviews(current =>
          reset ? nextReviews : [...current, ...nextReviews],
        );
        setHasMore(nextReviews.length === REVIEWS_PAGE_SIZE);
      }

      setReviewsLoading(false);
    },
    [profileRole, reviews.length, reviewsLoading, userId],
  );

  useEffect(() => {
    setReviews([]);
    setHasMore(false);
    fetchSummary();
  }, [fetchSummary]);

  return {
    averageRating,
    reviewCount,
    criteriaAverages,
    reviews,
    summaryLoading,
    reviewsLoading,
    hasMore,
    error,
    refreshSummary: fetchSummary,
    loadReviews,
  };
};
