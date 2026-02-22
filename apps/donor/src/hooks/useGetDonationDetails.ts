import { useState, useEffect } from 'react';
import { supabase } from '@workspace/db';

export function useGetDonationDetails(donationId: string) {
  const [donation, setDonation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    if (!donationId) {
      setLoading(false);
      return;
    }

    async function fetchDetails() {
      setLoading(true);

      const { data, error: fetchError } = await supabase
        .from('donations')
        .select(
          `
          id, status, created_at, accepted_at, notes, scheduled_days, scheduled_time_slots,
          address:addresses ( * ),
          collector:users!collector_id ( name, phone ),
          items:donation_items ( weight_kg, material:materials ( name ) )
        `,
        )
        .eq('id', donationId)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar detalhes da doação:', fetchError);
        setError(fetchError);
      } else {
        setDonation(data);
      }
      setLoading(false);
    }

    fetchDetails();
  }, [donationId]);

  return { donation, loading, error };
}
