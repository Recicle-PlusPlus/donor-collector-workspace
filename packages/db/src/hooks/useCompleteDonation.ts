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

      return { success: true };
    } catch (error) {
      console.error('Erro ao finalizar coleta:', error);
      return { success: false, error };
    } finally {
      setCompleting(false);
    }
  };

  return { completeDonation, completing };
};
