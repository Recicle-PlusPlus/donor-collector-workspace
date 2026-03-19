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
          id, status, created_at, notes,
          address:addresses ( street, num, neighborhood, city, state, cep, complement ),
          donor:users!donor_id ( name, photo_url, phone ),
          items:donation_items ( weight_kg, material:materials ( name ) ),
          schedules:donation_schedules ( day_of_week, start_time, end_time )
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
