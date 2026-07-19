import { useState } from 'react';
import { supabase } from '../client';

export const useCompleteDonation = () => {
  const [completing, setCompleting] = useState(false);

  const completeDonation = async (donationId: string) => {
    setCompleting(true);

    try {
      const { error } = await supabase.rpc('complete_donation', {
        p_donation_id: donationId,
      });

      if (error) throw error;

      console.log(`[useCompleteDonation] Coleta ${donationId} finalizada com sucesso!`);
      return { success: true };
    } catch (error) {
      console.error(`[useCompleteDonation] Erro ao finalizar coleta ${donationId}:`, error);
      return { success: false, error };
    } finally {
      setCompleting(false);
    }
  };

  return { completeDonation, completing };
};
