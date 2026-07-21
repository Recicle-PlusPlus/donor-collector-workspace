import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../client';

const REVIEWS_PAGE_SIZE = 20;

export interface UserReview {
  donation_id: string;
  reviewer_id: string;
  reviewer_name: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export const useUserReviews = (userId?: string) => {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviews, setReviews] = useState<UserReview[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchSummary = useCallback(async () => {
    if (!userId) {
      setAverageRating(0);
      setReviewCount(0);
      setSummaryLoading(false);
      return;
    }

    setSummaryLoading(true);
    setError(null);

    const { data, error: summaryError } = await supabase.rpc(
      'get_user_review_summary',
      { p_user_id: userId },
    );

    if (summaryError) {
      console.error('Erro ao buscar resumo das avaliações:', summaryError);
      setError(summaryError);
    } else {
      const summary = Array.isArray(data) ? data[0] : data;
      setAverageRating(Number(summary?.average_rating) || 0);
      setReviewCount(Number(summary?.review_count) || 0);
    }

    setSummaryLoading(false);
  }, [userId]);

  const loadReviews = useCallback(
    async (reset = false) => {
      if (!userId || reviewsLoading) return;

      setReviewsLoading(true);
      setError(null);

      const offset = reset ? 0 : reviews.length;
      const { data, error: reviewsError } = await supabase.rpc(
        'get_user_reviews',
        {
          p_user_id: userId,
          p_limit: REVIEWS_PAGE_SIZE,
          p_offset: offset,
        },
      );

      if (reviewsError) {
        console.error('Erro ao buscar avaliações:', reviewsError);
        setError(reviewsError);
      } else {
        const nextReviews = ((data || []) as UserReview[]).map(review => ({
          ...review,
          rating: Number(review.rating) || 0,
        }));

        setReviews(current =>
          reset ? nextReviews : [...current, ...nextReviews],
        );
        setHasMore(nextReviews.length === REVIEWS_PAGE_SIZE);
      }

      setReviewsLoading(false);
    },
    [reviews.length, reviewsLoading, userId],
  );

  useEffect(() => {
    setReviews([]);
    setHasMore(false);
    fetchSummary();
  }, [fetchSummary]);

  return {
    averageRating,
    reviewCount,
    reviews,
    summaryLoading,
    reviewsLoading,
    hasMore,
    error,
    refreshSummary: fetchSummary,
    loadReviews,
  };
};
