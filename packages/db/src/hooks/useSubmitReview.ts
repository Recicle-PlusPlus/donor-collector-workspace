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

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error);
      return { success: false, error };
    } finally {
      setSubmitting(false);
    }
  };

  return { submitReview, submitting };
};
