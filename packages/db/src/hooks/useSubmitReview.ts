import { useState } from 'react';
import { supabase } from '../client';

interface SubmitReviewInput {
  donation_id: string;
  reviewee_id: string;
  criteria_ratings: Record<string, number>;
  comment?: string;
}

export const useSubmitReview = () => {
  const [submitting, setSubmitting] = useState(false);

  const submitReview = async (data: SubmitReviewInput) => {
    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('submit_detailed_review', {
        p_donation_id: data.donation_id,
        p_reviewee_id: data.reviewee_id,
        p_punctuality_rating: data.criteria_ratings.punctuality || 0,
        p_material_care_rating: data.criteria_ratings.material_care || 0,
        p_communication_rating: data.criteria_ratings.communication || 0,
        p_courtesy_rating: data.criteria_ratings.courtesy || 0,
        p_collection_experience_rating:
          data.criteria_ratings.collection_experience || 0,
        p_material_condition_rating:
          data.criteria_ratings.material_condition || 0,
        p_description_accuracy_rating:
          data.criteria_ratings.description_accuracy || 0,
        p_pickup_readiness_rating: data.criteria_ratings.pickup_readiness || 0,
        p_wait_time_rating: data.criteria_ratings.wait_time || 0,
        p_comment: data.comment?.trim() || null,
      });

      if (error) {
        console.error('[useSubmitReview] Erro ao enviar review:', error);
        throw error;
      }

      console.log('[Review] Review salvo:', {
        donation: data.donation_id,
        reviewee: data.reviewee_id,
        criteriaRatings: data.criteria_ratings,
        hasComment: !!data.comment,
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
