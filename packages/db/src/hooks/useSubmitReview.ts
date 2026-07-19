import { useState } from 'react';
import { supabase } from '../client';

interface SubmitReviewInput {
  donation_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
}

export const useSubmitReview = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (data: SubmitReviewInput) => {
    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('submit_review', {
        p_donation_id: data.donation_id,
        p_reviewee_id: data.reviewee_id,
        p_rating: data.rating,
        p_comment: data.comment?.trim() || null,
      });

      if (error) {
        console.error('[useSubmitReview] Erro ao enviar review:', error);
        throw error;
      }

      console.log('[Review] Review salvo:', {
        donation: data.donation_id,
        reviewee: data.reviewee_id,
        rating: data.rating,
        hasComment: !!data.comment
      });
      return { success: true };
    } catch (error) {
      console.error('[useSubmitReview] Falha na requisição:', error);
      return { success: false, error };
    } finally {
      setSubmitting(false);
    }
  };

  return { submitReview, submitting };
};
